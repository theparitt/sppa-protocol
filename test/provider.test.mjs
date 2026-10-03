import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createProvider } from '../reference/ffmpeg/server.mjs';
import { Client } from '../src/client.mjs';
import { envelope, sha256, validate, verifyReceipt, canonicalHash } from '../src/core.mjs';
let provider, client, other, bytes, policy;
const providerId = 'com.example.ffmpeg';
before(async () => {
 provider = await createProvider({ tokens: { testtoken1: 'agent://one', testtoken2: 'agent://two' } });
 client = new Client(provider.url + '/v1', { token: 'testtoken1', callerId: 'agent://one', providerId, allowLoopback: true });
 other = new Client(provider.url + '/v1', { token: 'testtoken2', callerId: 'agent://two', providerId, allowLoopback: true });
 bytes = await readFile(new URL('./fixtures/input.mp4', import.meta.url));
 policy = JSON.parse(await readFile(new URL('../examples/policy.json', import.meta.url)));
});
after(async () => { await provider?.close(); });
async function upload() { return client.upload(bytes, { mediaType: 'video/mp4' }); }
const payload = artifact => ({ capability: 'video.transcode', capability_version: '1.0.0', input: { artifact: artifact.ref }, parameters: { codec: 'h264', crf: 24 }, policy, deadline: new Date(Date.now() + 30000).toISOString() });
async function terminal(job) { for (let i = 0; i < 100; i++) { const result = await client.request('/jobs/get', 'job.get', { job_id: job.job_id }); if (!['queued', 'running'].includes(result.status)) return result; await new Promise(r => setTimeout(r, 50)); } throw new Error('Job failed to terminate'); }
test('Discovery exposes a valid manifest and public key set', async () => { const m = await (await fetch(provider.url + '/.well-known/sppa.json')).json(); validate('manifest', m); assert.equal(m.endpoint, provider.url + '/v1'); validate('keys', await (await fetch(provider.url + '/v1/keys')).json()); });
test('Authentication derives identity, never trusts the envelope caller', async () => { const body = envelope('health.get', {}, 'agent://two'); const r = await fetch(provider.url + '/v1/health', { method: 'POST', headers: { authorization: 'Bearer testtoken1', 'content-type': 'application/json' }, body: JSON.stringify(body) }); assert.equal(r.status, 403); const unauth = await fetch(provider.url + '/v1/health', { method: 'POST' }); assert.equal(unauth.status, 401); });
test('Real FFmpeg job transfers artifacts and returns a verifiable receipt', async () => {
 const input = await upload(); const job = await client.request('/jobs', 'job.create', payload(input), { idempotency_key: randomUUID() });
 const result = await terminal(job); assert.equal(result.status, 'completed'); validate('job', result);
 const output = await client.download(result.output.artifact); assert.ok(output.length > 0);
 const receipt = await client.request('/receipts/get', 'receipt.get', { receipt_id: result.receipt_id });
 assert.equal(verifyReceipt(receipt, { publicKey: provider.publicKey, keyId: provider.keyId, providerId, callerId: 'agent://one', jobId: job.job_id, capabilityId: 'video.transcode', capabilityVersion: '1.0.0', parametersHash: canonicalHash({ codec: 'h264', crf: 24 }), inputRef: input.ref, outputRef: result.output.artifact, inputHash: input.sha256, outputHash: sha256(output) }), true);
 await assert.rejects(other.request('/jobs/get', 'job.get', { job_id: result.job_id }), e => e.code === 'not_found');
 await assert.rejects(other.download(result.output.artifact), e => e.code === 'not_found');
 await assert.rejects(other.request('/receipts/get', 'receipt.get', { receipt_id: result.receipt_id }), e => e.code === 'not_found');
});
test('Idempotency reuses a job and rejects changed content', async () => { const input = await upload(), data = payload(input), key = randomUUID(); const first = await client.request('/jobs', 'job.create', data, { idempotency_key: key }); const duplicate = await client.request('/jobs', 'job.create', data, { idempotency_key: key }); assert.equal(duplicate.job_id, first.job_id); await assert.rejects(client.request('/jobs', 'job.create', { ...data, parameters: { codec: 'h264', crf: 10 } }, { idempotency_key: key }), e => e.code === 'idempotency_conflict'); await terminal(first); });
test('Bad checksum upload is not committed', async () => { const t = await client.request('/transfers/uploads', 'transfer.prepare_upload', { media_type: 'video/mp4', size_bytes: bytes.length, sha256: 'sha256:' + '0'.repeat(64), privacy: 'private', retention_seconds: 3600 }); const r = await fetch(t.url, { method: 'PUT', headers: { authorization: 'Bearer testtoken1' }, body: bytes }); assert.equal(r.status, 422); await assert.rejects(client.request('/transfers/complete', 'transfer.complete', { transfer_id: t.transfer_id }), e => e.code === 'state_conflict'); });
test('Completed upload is immutable and completion is idempotent', async () => { const t = await client.request('/transfers/uploads', 'transfer.prepare_upload', { media_type: 'video/mp4', size_bytes: bytes.length, sha256: sha256(bytes), privacy: 'private', retention_seconds: 3600 }); assert.equal((await fetch(t.url, { method: 'PUT', headers: { authorization: 'Bearer testtoken1' }, body: bytes })).status, 200); const a = await client.request('/transfers/complete', 'transfer.complete', { transfer_id: t.transfer_id }); const b = await client.request('/transfers/complete', 'transfer.complete', { transfer_id: t.transfer_id }); assert.equal(a.ref, b.ref); assert.equal((await fetch(t.url, { method: 'PUT', headers: { authorization: 'Bearer testtoken1' }, body: bytes })).status, 409); });
test('Oversize admission, invalid parameters and privacy downgrades fail', async () => { await assert.rejects(client.request('/transfers/uploads', 'transfer.prepare_upload', { media_type: 'video/mp4', size_bytes: 8388609, sha256: sha256(bytes), privacy: 'private', retention_seconds: 3600 }), e => e.code === 'constraint_violation'); const input = await upload(); const request = payload(input); await assert.rejects(client.request('/jobs', 'job.create', { ...request, parameters: { codec: 'h265', crf: 24 } }, { idempotency_key: randomUUID() }), e => e.code === 'constraint_violation'); await assert.rejects(client.request('/jobs', 'job.create', { ...request, policy: { ...policy, privacy: 'public' } }, { idempotency_key: randomUUID() }), e => e.code === 'constraint_violation'); });
test('Aborted upload cannot be written or completed', async () => { const t = await client.request('/transfers/uploads', 'transfer.prepare_upload', { media_type: 'video/mp4', size_bytes: bytes.length, sha256: sha256(bytes), privacy: 'private', retention_seconds: 3600 }); await client.request('/transfers/abort', 'transfer.abort', { transfer_id: t.transfer_id }); assert.equal((await fetch(t.url, { method: 'PUT', headers: { authorization: 'Bearer testtoken1' }, body: bytes })).status, 409); await assert.rejects(client.request('/transfers/complete', 'transfer.complete', { transfer_id: t.transfer_id }), e => e.code === 'state_conflict'); });
test('Cancellation is terminal and retry creates an explicit new lineage', async () => { const input = await upload(), request = payload(input); const job = await client.request('/jobs', 'job.create', request, { idempotency_key: randomUUID() }); const canceled = await client.request('/jobs/cancel', 'job.cancel', { job_id: job.job_id }); assert.equal(canceled.status, 'canceled'); const retried = await client.request('/jobs/retry', 'job.retry', { job_id: job.job_id, deadline: new Date(Date.now() + 30000).toISOString() }, { idempotency_key: randomUUID() }); assert.notEqual(retried.job_id, job.job_id); assert.equal(retried.retry_of, job.job_id); assert.equal((await terminal(retried)).status, 'completed'); assert.equal((await client.request('/jobs/get', 'job.get', { job_id: job.job_id })).status, 'canceled'); });
test('Invalid video data fails execution with a structured terminal error', async () => { const a = await client.upload(Buffer.from('not a video'), { mediaType: 'video/mp4' }); const job = await client.request('/jobs', 'job.create', payload(a), { idempotency_key: randomUUID() }); const result = await terminal(job); assert.equal(result.status, 'failed'); assert.equal(result.error.code, 'execution_failed'); validate('job', result); });
test('Aborting a download revokes its temporary byte endpoint', async () => {
 const a = await upload(); const t = await client.request('/transfers/downloads', 'transfer.prepare_download', { artifact: a.ref });
 await client.request('/transfers/abort', 'transfer.abort', { transfer_id: t.transfer_id });
 assert.equal((await fetch(t.url, { headers: { authorization: 'Bearer testtoken1' } })).status, 409);
 assert.deepEqual(await client.download(a.ref), bytes);
});
test('Caller identity cannot expand permissions and invalid timestamps fail', async () => {
 const a = await upload(), data = payload(a);
 await assert.rejects(client.request('/jobs', 'job.create', { ...data, policy: { ...policy, granted_permissions: [...policy.granted_permissions, 'system.admin'] } }, { idempotency_key: randomUUID() }), e => e.code === 'forbidden');
 const body = envelope('health.get', {}, 'agent://one'); body.timestamp = '2026-10-03T00:00:99Z';
 const r = await fetch(provider.url + '/v1/health', { method: 'POST', headers: { authorization: 'Bearer testtoken1', 'content-type': 'application/json' }, body: JSON.stringify(body) }); assert.equal(r.status, 400);
 const mismatched = new Client(provider.url + '/v1', { token: 'testtoken1', callerId: 'agent://one', providerId: 'com.example.wrong', allowLoopback: true });
 await assert.rejects(mismatched.request('/jobs/get', 'job.get', { job_id: 'job_nonexistent000' }), e => e.code === 'invalid_request');
});
