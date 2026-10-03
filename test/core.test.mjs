import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';
import { validate, validateManifest, parseJSON, parseArtifact, transition, checkEligibility, envelope, canonicalHash, signDocument, verifyDocument, verifyReceipt, ReplayGuard, checkEndpoint } from '../src/core.mjs';
const example = n => JSON.parse(readFileSync(new URL(`../examples/${n}.json`, import.meta.url)));
const health = () => ({ ...example('health'), observed_at: new Date().toISOString(), valid_until: new Date(Date.now() + 60000).toISOString() });
const baseMatch = (mutate = () => {}) => { const c = example('capability'), a = example('artifact'), p = example('policy'), h = health(); a.retention_until = new Date(Date.now() + 60000).toISOString(); mutate(c, a, p, h); return checkEligibility(c, a, p, h); };
for (const n of ['manifest', 'capability', 'artifact', 'policy', 'health']) test(`Canonical ${n} validates`, () => validate(n, example(n)));
test('Typed request validates, missing idempotency key fails', () => { const e = example('job-create'); validate('envelope', e); delete e.idempotency_key; assert.throws(() => validate('envelope', e)); });
test('Unknown fields and incompatible protocol version fail', () => { const e = example('job-create'); e.unknown = 1; assert.throws(() => validate('envelope', e)); delete e.unknown; e.sppa = '0.2.0'; assert.throws(() => validate('envelope', e)); });
test('Operation-specific payload is enforced', () => { const e = example('job-create'); e.type = 'job.cancel'; assert.throws(() => validate('envelope', e)); });
test('Manifest requires Core profile and unique capabilities', () => { const m = example('manifest'); validateManifest(m); m.capabilities.push(m.capabilities[0]); assert.throws(() => validateManifest(m)); m.capabilities.pop(); m.profiles = ['security.signed_requests']; assert.throws(() => validate('manifest', m)); });
test('Capability schemas cannot fetch arbitrary references', () => { const m = example('manifest'); m.capabilities[0].parameters_schema = { type: 'object', properties: { url: { $ref: 'https://internal.example/schema' } } }; assert.throws(() => validateManifest(m)); });
test('Duplicate JSON members are rejected, including escaped names', () => { assert.throws(() => parseJSON('{"a":1,"a":2}')); assert.throws(() => parseJSON('{"x":{"a":1,"\\u0061":2}}')); assert.deepEqual(parseJSON('{"a":[1,{"b":"a,b:c"}],"z":null}'), { a: [1, { b: 'a,b:c' }], z: null }); });
test('Unsafe numbers, malformed JSON, lone surrogates and excessive nesting fail', () => { assert.throws(() => parseJSON('{"n":9007199254740993}')); assert.throws(() => parseJSON('{"n":1e400}')); assert.throws(() => parseJSON('null trailing')); assert.throws(() => parseJSON('"\\ud800"')); assert.throws(() => parseJSON('['.repeat(40) + '0' + ']'.repeat(40))); });
test('Artifact identities cannot contain paths, traversal or unsigned queries', () => { assert.equal(parseArtifact('artifact://com.example.ffmpeg/art_example01').artifact_id, 'art_example01'); for (const bad of ['/tmp/a', 'file:///tmp/a', 'artifact://com.example.ffmpeg/../../secret', 'artifact://com.example.ffmpeg/art_example01?download=1']) assert.throws(() => parseArtifact(bad)); });
test('Exact eligibility accepts the valid contract', () => assert.equal(baseMatch().eligible, true));
for (const [name, change, reason] of [
 ['oversize', (c, a) => a.size_bytes = c.constraints.max_input_bytes + 1, 'input_size'],
 ['unsupported media', (c, a) => a.media_type = 'application/pdf', 'input_media_type'],
 ['privacy downgrade', (c, a, p) => { a.privacy = 'confidential'; p.privacy = 'private'; }, 'privacy_downgrade'],
 ['LOCAL_ONLY remote', (c, a, p) => { c.constraints.privacy_levels.push('local_only'); p.privacy = 'local_only'; }, 'local_only'],
 ['region mismatch', (c, a, p) => p.data_region = 'other', 'data_region'],
 ['training prohibited', c => c.constraints.training_use = true, 'training_use'],
 ['retention upper bound', c => c.constraints.retention_seconds = 4000, 'retention'],
 ['logging prohibited', c => c.constraints.content_logging = true, 'content_logging'],
 ['missing permission', (c, a, p) => p.granted_permissions = [], 'permissions'],
 ['approval pending', (c, a, p) => p.human_approval = 'pending', 'human_approval'],
 ['stale health', (c, a, p, h) => h.valid_until = new Date(Date.now() - 1).toISOString(), 'health'],
 ['provider spoofing', (c, a, p, h) => h.provider_id = 'com.other.provider', 'provider_identity'],
]) test(`Hard rejection: ${name}`, () => assert.ok(baseMatch(change).reasons.includes(reason)));
test('Terminal job states never transition, cancellation does not complete', () => { const j = { status: 'queued' }; transition(j, 'running'); transition(j, 'canceled'); assert.throws(() => transition(j, 'completed')); assert.throws(() => transition({ status: 'completed' }, 'running')); });
test('Completed job requires receipt and output', () => { const j = { job_id: 'job_example01', provider_id: 'com.example.ffmpeg', caller_id: 'agent://example', capability: 'video.transcode', capability_version: '1.0.0', status: 'completed', input: { artifact: example('artifact').ref }, parameters: {}, policy: example('policy'), created_at: new Date().toISOString() }; assert.throws(() => validate('job', j)); });
test('JCS parameter hash ignores property order', () => assert.equal(canonicalHash({ a: 1, b: 2 }), canonicalHash({ b: 2, a: 1 })));
function signedReceipt() {
 const keys = generateKeyPairSync('ed25519');
 const document = { sppa: '0.1.0', receipt_id: 'receipt_example01', job_id: 'job_example01', caller_id: 'agent://example', provider_id: 'com.example.ffmpeg', capability: 'video.transcode', capability_version: '1.0.0', parameters_sha256: canonicalHash({ codec: 'h264', crf: 24 }), input: { artifact: example('artifact').ref, sha256: example('artifact').sha256 }, output: { artifact: 'artifact://com.example.ffmpeg/art_example02', sha256: 'sha256:' + 'b'.repeat(64) }, started_at: '2026-10-03T05:00:00Z', finished_at: '2026-10-03T05:00:02Z', status: 'completed' };
 return { ...keys, receipt: signDocument(document, keys.privateKey, 'key01') };
}
test('Ed25519 receipt verifies and rejects tampering/wrong keys/context', () => { const { receipt, publicKey } = signedReceipt(); validate('receipt', receipt); assert.equal(verifyDocument(receipt, publicKey), true); assert.equal(verifyDocument(receipt, generateKeyPairSync('ed25519').publicKey), false); assert.equal(verifyDocument(receipt, publicKey, 'REQUEST'), false); receipt.output.sha256 = 'sha256:' + 'c'.repeat(64); assert.equal(verifyDocument(receipt, publicKey), false); });
test('Receipt verification binds caller/provider/job/hash/key identity', () => { const { receipt, publicKey } = signedReceipt(); const expected = { publicKey, keyId: 'key01', providerId: receipt.provider_id, callerId: receipt.caller_id, jobId: receipt.job_id, capabilityId: receipt.capability, capabilityVersion: receipt.capability_version, parametersHash: receipt.parameters_sha256, inputRef: receipt.input.artifact, outputRef: receipt.output.artifact, inputHash: receipt.input.sha256, outputHash: receipt.output.sha256, now: Date.parse('2026-10-03T05:01:00Z') }; assert.equal(verifyReceipt(receipt, expected), true); assert.equal(verifyReceipt(receipt, { ...expected, jobId: 'job_different01' }), false); assert.equal(verifyReceipt({}, expected), false); });
test('Signed request rejects replay, expiry and wrong provider binding', () => { const { publicKey, privateKey } = generateKeyPairSync('ed25519'); const e = envelope('health.get', {}, 'agent://example', { provider_id: 'com.example.ffmpeg', nonce: '0123456789abcdef', expires_at: new Date(Date.now() + 60000).toISOString() }); const signed = signDocument(e, privateKey, 'key01', 'REQUEST'); const guard = new ReplayGuard(); assert.equal(guard.verify(signed, publicKey, 'key01', 'com.example.ffmpeg'), true); assert.throws(() => guard.verify(signed, publicKey, 'key01', 'com.example.ffmpeg')); assert.throws(() => new ReplayGuard().verify(signed, publicKey, 'key01', 'com.other.provider')); assert.throws(() => new ReplayGuard().verify(signed, publicKey, 'key01', 'com.example.ffmpeg', Date.now() + 120000)); });
test('HTTPS and explicit loopback development rules', () => { checkEndpoint('https://provider.example/v1'); checkEndpoint('http://127.0.0.1:9000/v1', { allowLoopback: true }); for (const u of ['http://provider.example/v1', 'file:///tmp/a', 'https://user:pass@example.org/v1']) assert.throws(() => checkEndpoint(u, { allowLoopback: true })); });

test('Expired artifacts and forged artifact identities are ineligible', () => { assert.ok(baseMatch((c,a) => a.retention_until = new Date(Date.now()-1).toISOString()).reasons.includes('artifact_expired')); assert.ok(baseMatch((c,a) => a.artifact_id = 'art_another01').reasons.includes('artifact_identity')); });
