import { fork } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { randomBytes, randomUUID, createPublicKey } from 'node:crypto';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { Client } from '../src/client.mjs';
import { validateManifest, verifyReceipt, sha256, canonicalHash } from '../src/core.mjs';
const token = randomBytes(32).toString('hex'), callerId = 'agent://demo';
const child = fork(fileURLToPath(new URL('../reference/ffmpeg/server.mjs', import.meta.url)), [], { env: { ...process.env, SPPA_TOKEN: token, SPPA_CALLER_ID: callerId }, stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
try {
 const info = await Promise.race([once(child, 'message').then(([m]) => m), once(child, 'exit').then(() => { throw new Error('Provider failed to start'); })]);
 validateManifest(info.manifest, { allowLoopback: true });
 // Provider has its original PATH; caller operations run without software lookup.
 process.env.PATH = '';
 const client = new Client(info.endpoint, { token, callerId, providerId: info.manifest.provider_id, allowLoopback: true });
 const bytes = await readFile(new URL('../test/fixtures/input.mp4', import.meta.url));
 const input = await client.upload(bytes, { mediaType: 'video/mp4' });
 const policy = JSON.parse(await readFile(new URL('../examples/policy.json', import.meta.url)));
 const job = await client.request('/jobs', 'job.create', { capability: 'video.transcode', capability_version: '1.0.0', input: { artifact: input.ref }, parameters: { codec: 'h264', crf: 24 }, policy, deadline: new Date(Date.now() + 30000).toISOString() }, { idempotency_key: randomUUID() });
 let result;
 for (let i = 0; i < 100; i++) { result = await client.request('/jobs/get', 'job.get', { job_id: job.job_id }); if (!['queued', 'running'].includes(result.status)) break; await new Promise(r => setTimeout(r, 50)); }
 if (result.status !== 'completed') throw new Error(`Demo failed: ${result.status}`);
 const output = await client.download(result.output.artifact);
 const receipt = await client.request('/receipts/get', 'receipt.get', { receipt_id: result.receipt_id });
 const publicKey = createPublicKey({ key: info.publicKey, format: 'jwk' });
 if (!verifyReceipt(receipt, { publicKey, keyId: info.keyId, providerId: info.manifest.provider_id, callerId, jobId: job.job_id, capabilityId: 'video.transcode', capabilityVersion: '1.0.0', parametersHash: canonicalHash({ codec: 'h264', crf: 24 }), inputRef: input.ref, outputRef: result.output.artifact, inputHash: input.sha256, outputHash: sha256(output) })) throw new Error('Receipt verification failed');
 console.log(JSON.stringify({ discovery: 'passed', upload_integrity: 'passed', job: result.status, output_bytes: output.length, receipt_signature: 'verified', caller_software_lookup: 'disabled', provider_process: 'separate', deployment: 'loopback demonstration; not a two-machine deployment' }, null, 2));
} finally { child.kill('SIGTERM'); await once(child, 'exit'); }
