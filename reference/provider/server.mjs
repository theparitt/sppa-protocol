import http from 'node:http';
import { readFile, writeFile, mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { validate, parseJSON, envelope, sha256, canonicalHash, checkEligibility, validateParameters, transition, signDocument, ProtocolError, parseArtifact } from '../../src/core.mjs';
import { JobNotificationJournal, enableCapabilityNotifications, NOTIFICATION_PROFILE } from '../../src/job-notifications.mjs';
import { AdmissionGate } from '../../src/admission.mjs';

const newId = prefix => prefix + '_' + randomUUID();
const now = () => new Date().toISOString();
const statusCodes = { queue_full: 429, capacity_exhausted: 429, retry_exhausted: 422, unauthenticated: 401, forbidden: 403, not_found: 404, unsupported_version: 400, constraint_violation: 422, policy_violation: 422, provider_unavailable: 503, idempotency_conflict: 409, state_conflict: 409, integrity_mismatch: 422, transfer_expired: 410, rate_limited: 429, deadline_exceeded: 422, internal_error: 500 };
async function collect(req, limit) {
  const parts = []; let size = 0;
  for await (const part of req) { size += part.length; if (size > limit) throw new ProtocolError('constraint_violation', 'Body exceeds limit'); parts.push(part); }
  return Buffer.concat(parts);
}

export async function createArtifactProvider({ tokens, port = 0, ffmpeg = 'ffmpeg', capability: definition, execution = definition.execution, providerId = 'com.example.ffmpeg', name = 'FFmpeg reference SPPA', runTask, probeRuntime, outputExtension = 'mp4', notifications = true } = {}) {
  if (!tokens || !Object.keys(tokens).length) throw new Error('An explicit token-to-caller map is required');
  const capability = { ...(notifications ? enableCapabilityNotifications(definition) : structuredClone(definition)), execution: structuredClone(execution) };
  const journal = notifications ? new JobNotificationJournal({providerId}) : null;
  const changeJob = (job, state, at) => { transition(job.data, state, at); journal?.record(job.data); };
  validate('capability', capability);
  if (!/^[a-z0-9]+$/.test(outputExtension)) throw new Error('Invalid output extension');
  const gate = new AdmissionGate(capability.execution);
  if (execution.max_concurrency > 2 || execution.queue.max_depth > 64 || execution.timeout_seconds > 60 || execution.retry.max_attempts > 3) throw new Error('Reference execution limits may only be lowered');
  const credentials = new Map(Object.entries(tokens));
  const directory = await mkdtemp(join(tmpdir(), 'sppa-ffmpeg-'));
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const keyId = 'reference-key-01';
  const artifacts = new Map(), transfers = new Map(), jobs = new Map(), receipts = new Map(), dedup = new Map();
  const queue = []; let active = 0, url;
  const cleanup = setInterval(() => {
    for (const [id, a] of artifacts) if (Date.parse(a.retention_until) <= Date.now()) {
      artifacts.delete(id); rm(a.file, { force: true }).catch(() => {});
    }
    for (const [id, t] of transfers) if (Date.parse(t.expires_at) <= Date.now() && !t.committing) { delete t.bytes; transfers.delete(id); }
  }, 250); cleanup.unref();
  let runtimeReady = true;
  async function probe() { runtimeReady = probeRuntime ? await Promise.resolve().then(probeRuntime).catch(()=>false) : true; }
  const queued = () => queue.filter(job => job.data.status === 'queued').length;
  const health = () => ({ provider_id: providerId, status: runtimeReady ? 'healthy' : 'unavailable', observed_at: now(), valid_until: new Date(Date.now() + 60000).toISOString(), queue_depth: queued(), active_jobs: active, max_concurrency: execution.max_concurrency, source: 'provider', capabilities: [{ capability: capability.id, capability_version: capability.version, accepting_jobs: runtimeReady && (active < execution.max_concurrency || (execution.queue.enabled && queued() < execution.queue.max_depth)), capacity: { max_concurrency: execution.max_concurrency, running: active, available: execution.max_concurrency - active }, queue: { depth: queued(), max_depth: execution.queue.max_depth } }] });
  const manifest = () => ({ sppa: '0.1.1', kind: 'provider', provider_id: providerId, name, provider_version: '0.1.1', endpoint: url + '/v1', capabilities: [capability], profiles: ['core.http-artifact'], security: { authentication: ['bearer'], receipt_algorithm: 'Ed25519', canonicalization: 'RFC8785', keys_uri: url + '/v1/keys' }, ...(journal ? {extensions:{[NOTIFICATION_PROFILE]:journal.descriptor(url)}} : {}) });
  const own = (item, caller) => { if (!item || item.owner !== caller) throw new ProtocolError('not_found', 'Resource not found'); return item; };
  const getArtifact = (ref, caller) => {
    const parsed = parseArtifact(ref);
    if (parsed.provider_id !== providerId) throw new ProtocolError('constraint_violation', 'Cross-provider transfer profile is not advertised');
    const a = own(artifacts.get(parsed.artifact_id), caller);
    if (Date.parse(a.retention_until) <= Date.now()) throw new ProtocolError('not_found', 'Artifact retention expired');
    return a;
  };
  const metadata = a => { const { file, ...data } = a; return data; };
  function getTransfer(id, caller) {
    const t = own(transfers.get(id), caller);
    if (Date.parse(t.expires_at) <= Date.now()) { t.status = 'expired'; throw new ProtocolError('transfer_expired', 'Transfer expired'); }
    return t;
  }
  function cleanDedup() { for (const [key, d] of dedup) if (d.until <= Date.now()) dedup.delete(key); }
  function stop(job, state) {
    if (['queued', 'running'].includes(job.data.status)) {
      if (state === 'expired') job.data.error = { code: 'deadline_exceeded', message: 'Execution deadline exceeded', retryable: true };
      changeJob(job, state); job.process?.kill('SIGKILL'); clearTimeout(job.timer);
    }
  }
  function drain() {
    while (active < execution.max_concurrency && queue.length) {
      const job = queue.shift(); if (job.data.status !== 'queued') continue;
      if (Date.now() >= job.deadline) { stop(job, 'expired'); continue; }
      execute(job);
    }
  }
  async function execute(job) {
    active++; changeJob(job, 'running');
    const outputFile = join(directory, newId('output') + '.' + outputExtension);
    let child;
    try {
      const source = getArtifact(job.data.input.artifact, job.owner);
      let taskResult;
      if (runTask) {
        taskResult = await runTask({ source: source.file, outputFile, parameters: job.data.parameters, registerProcess: process => { job.process = process; }, deadline: job.deadline });
      } else {
      const args = ['-nostdin', '-hide_banner', '-loglevel', 'error', '-protocol_whitelist', 'file,pipe', '-i', source.file, '-threads', '1', '-c:v', 'libx264', '-crf', String(job.data.parameters.crf), '-c:a', 'copy', '-fs', '16777216', outputFile];
      child = spawn(ffmpeg, args, { stdio: ['ignore', 'ignore', 'ignore'], shell: false }); job.process = child;
      const exit = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
      if (exit !== 0) throw new Error('FFmpeg failed');
      }
      if (job.data.status !== 'running') { await rm(outputFile, { force: true }); return; }
      const bytes = await readFile(outputFile);
      if (!bytes.length || bytes.length >= 16777216) throw new Error('Output limit exceeded');
      const outputId = newId('art');
      const output = { ref: `artifact://${providerId}/${outputId}`, artifact_id: outputId, provider_id: providerId, owner: job.owner, media_type: taskResult?.media_type ?? 'video/mp4', size_bytes: bytes.length, sha256: sha256(bytes), privacy: job.data.policy.privacy, created_at: now(), retention_until: new Date(Date.now() + capability.constraints.retention_seconds * 1000).toISOString(), created_by_job: job.data.job_id };
      const result = taskResult ? { ...taskResult, size_bytes: bytes.length } : { codec: 'h264', media_type: 'video/mp4', size_bytes: bytes.length };
      if (!capability.constraints.output_media_types.includes(result.media_type)) throw new Error('Unexpected output media type');
      validateParameters(capability.result_schema, result); validate('artifact', output);
      // Prepare all signed evidence before publishing the terminal job state.
      const receiptId = newId('receipt'), finishedAt = now();
      const receipt = signDocument({ sppa: '0.1.1', receipt_id: receiptId, job_id: job.data.job_id, caller_id: job.owner, provider_id: providerId, capability: capability.id, capability_version: capability.version, parameters_sha256: canonicalHash(job.data.parameters), input: { artifact: source.ref, sha256: source.sha256 }, output: { artifact: output.ref, sha256: output.sha256 }, started_at: job.data.started_at, finished_at: finishedAt, status: 'completed' }, privateKey, keyId);
      validate('receipt', receipt);
      // No await after this recheck: cancellation/expiry cannot race the commit.
      if (job.data.status !== 'running' || Date.now() >= job.deadline) { stop(job, 'expired'); await rm(outputFile, { force: true }); return; }
      artifacts.set(outputId, { ...output, file: outputFile }); receipts.set(receiptId, { owner: job.owner, data: receipt });
      job.data.output = { artifact: output.ref, metadata: result }; job.data.receipt_id = receiptId; job.data.progress = 1;
      changeJob(job, 'completed', finishedAt); clearTimeout(job.timer);
    } catch {
      await rm(outputFile, { force: true });
      if (job.data.status === 'running') { job.data.error = { code: 'execution_failed', message: 'Provider execution failed', retryable: false }; changeJob(job, 'failed'); clearTimeout(job.timer); }
    } finally { active--; drain(); }
  }
  function createJob(request, caller, retryOf) {
    cleanDedup();
    const scope = caller + ':' + request.idempotency_key;
    const digest = canonicalHash({ type: request.type, payload: request.payload });
    const existing = dedup.get(scope);
    if (existing) {
      if (existing.hash !== digest) throw new ProtocolError('idempotency_conflict', 'Idempotency key was reused with different content');
      return existing.job.data;
    }
    if (dedup.size >= 1024 || jobs.size >= 1024) throw new ProtocolError('rate_limited', 'Reference provider capacity reached', {}, true);
    const payload = retryOf ? { ...retryOf.data, deadline: request.payload.deadline } : request.payload;
    if (payload.capability !== capability.id || payload.capability_version !== capability.version) throw new ProtocolError('constraint_violation', 'Unsupported capability/version');
    validateParameters(capability.parameters_schema, payload.parameters);
    if (!payload.policy.granted_permissions.every(p => ['artifact.read', 'artifact.write'].includes(p))) throw new ProtocolError('forbidden', 'Requested permissions exceed the authenticated grant');
    const input = getArtifact(payload.input.artifact, caller);
    const match = checkEligibility(capability, metadata(input), payload.policy, health());
    if (!match.eligible) throw new ProtocolError('constraint_violation', 'Provider is ineligible', { reasons: match.reasons });
    const deadline = Date.parse(payload.deadline);
    if (!(deadline > Date.now() && deadline <= Date.now() + execution.timeout_seconds * 1000)) throw new ProtocolError('constraint_violation', 'Deadline exceeds the capability timeout');
    const attempt = retryOf ? retryOf.lineage.attempts + 1 : 1;
    gate.admit({ caller, running: active, queued: queued(), attempt });
    const jobId = newId('job');
    const lineage = retryOf?.lineage ?? { rootId: jobId, attempts: 0 };
    lineage.attempts = attempt;
    const data = { job_id: jobId, attempt, root_job_id: lineage.rootId, provider_id: providerId, caller_id: caller, capability: capability.id, capability_version: capability.version, input: payload.input, parameters: payload.parameters, policy: payload.policy, created_at: now(), deadline: payload.deadline, status: 'queued', progress: 0 };
    if (retryOf) data.retry_of = retryOf.data.job_id;
    const job = { owner: caller, data, deadline, lineage };
    job.timer = setTimeout(() => stop(job, 'expired'), deadline - Date.now());
    journal?.record(data); jobs.set(data.job_id, job); dedup.set(scope, { hash: digest, job, until: Date.now() + 86400000 }); queue.push(job); drain();
    return data;
  }
  const routes = { '/v1/jobs': 'job.create', '/v1/jobs/get': 'job.get', '/v1/jobs/cancel': 'job.cancel', '/v1/jobs/retry': 'job.retry', '/v1/artifacts/get': 'artifact.get', '/v1/transfers/uploads': 'transfer.prepare_upload', '/v1/transfers/downloads': 'transfer.prepare_download', '/v1/transfers/complete': 'transfer.complete', '/v1/transfers/abort': 'transfer.abort', '/v1/health': 'health.get', '/v1/receipts/get': 'receipt.get' };
  const server = http.createServer(async (req, res) => {
    let request, authenticatedCaller;
    const json = (status, value) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); res.end(JSON.stringify(value)); };
    const answer = (type, payload, status = 200) => { const data = envelope(type, payload, request.caller.id, { request_id: request.request_id, provider_id: providerId }); validate('envelope', data); json(status, data); };
    try {
      const pathname = new URL(req.url, url).pathname;
      if (req.method === 'GET' && pathname === '/.well-known/sppa.json') return json(200, manifest());
      if (req.method === 'GET' && pathname === '/v1/keys') return json(200, { provider_id: providerId, keys: [{ key_id: keyId, algorithm: 'Ed25519', public_key: publicKey.export({ format: 'jwk' }), valid_from: '2026-01-01T00:00:00Z', valid_until: '2100-01-01T00:00:00Z' }] });
      const header = req.headers.authorization ?? '';
      const caller = header.startsWith('Bearer ') ? credentials.get(header.slice(7)) : undefined;
      if (journal?.handles(pathname)) return journal.handle(req,res,{caller,authorized:()=>credentials.get(header.slice(7))===caller});
      if (!caller) throw new ProtocolError('unauthenticated', 'Bearer authentication required');
      authenticatedCaller = caller;
      const segments = pathname.split('/');
      if (segments.length === 5 && segments[1] === 'v1' && segments[2] === 'transfers' && segments[4] === 'bytes') {
        const t = getTransfer(segments[3], caller);
        if (req.method !== t.method) throw new ProtocolError('invalid_request', 'Wrong transfer method');
        if (t.status === 'aborted') throw new ProtocolError('state_conflict', 'Transfer was aborted');
        if (t.direction === 'upload') {
          if (t.status !== 'prepared') throw new ProtocolError('state_conflict', 'Upload is no longer writable');
          const bytes = await collect(req, t.size_bytes);
          if (bytes.length !== t.size_bytes || sha256(bytes) !== t.sha256) throw new ProtocolError('integrity_mismatch', 'Uploaded bytes do not match declared size/hash');
          // Recheck after asynchronous input to prevent abort/expiry races.
          getTransfer(t.transfer_id, caller);
          if (t.status !== 'prepared') throw new ProtocolError('state_conflict', 'Upload was aborted');
          t.bytes = bytes; t.status = 'uploaded'; return json(200, { received_bytes: bytes.length });
        }
        const a = getArtifact(t.artifact, caller); const bytes = await readFile(a.file);
        getTransfer(t.transfer_id, caller); getArtifact(t.artifact, caller);
        res.writeHead(200, { 'content-type': a.media_type, 'content-length': bytes.length, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); return res.end(bytes);
      }
      if (req.method !== 'POST' || !routes[pathname]) throw new ProtocolError('not_found', 'Resource not found');
      if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new ProtocolError('invalid_request', 'Use application/json');
      request = parseJSON(await collect(req, 1048576));
      if (request.sppa !== '0.1.1') throw new ProtocolError('unsupported_version', 'SPPA 0.1.1 is required');
      validate('envelope', request);
      if (request.caller.id !== caller) throw new ProtocolError('forbidden', 'Caller does not match authenticated identity');
      if (request.type !== routes[pathname]) throw new ProtocolError('invalid_request', 'Operation does not match route');
      if (Math.abs(Date.parse(request.timestamp) - Date.now()) > 300000) throw new ProtocolError('invalid_request', 'Request timestamp is outside the allowed window');
      if (request.signature) throw new ProtocolError('unsupported_operation', 'Signed-request profile is not advertised');
      const data = request.payload;
      if (request.type === 'health.get') { await probe(); return answer('health.snapshot', health()); }
      if (request.type === 'job.create') { await probe(); return answer('job.created', createJob(request, caller), 202); }
      if (request.type.startsWith('job.')) {
        const job = own(jobs.get(data.job_id), caller);
        if (request.type === 'job.cancel') { stop(job, 'canceled'); return answer('job.snapshot', job.data); }
        if (request.type === 'job.retry') {
          if (!['failed', 'expired', 'canceled'].includes(job.data.status)) throw new ProtocolError('state_conflict', 'Only unsuccessful terminal jobs can be retried');
          return answer('job.created', createJob(request, caller, job), 202);
        }
        return answer('job.snapshot', job.data);
      }
      if (request.type === 'artifact.get') return answer('artifact.metadata', metadata(getArtifact(data.artifact, caller)));
      if (request.type === 'receipt.get') return answer('receipt.result', own(receipts.get(data.receipt_id), caller).data);
      if (request.type === 'transfer.prepare_upload') {
        if (transfers.size >= 64) throw new ProtocolError('rate_limited', 'Transfer quota reached', {}, true);
        if (data.size_bytes > capability.constraints.max_input_bytes || !capability.constraints.input_media_types.includes(data.media_type) || !capability.constraints.privacy_levels.includes(data.privacy) || data.retention_seconds > 3600) throw new ProtocolError('constraint_violation', 'Upload exceeds provider constraints');
        const aid = newId('art'), tid = newId('transfer');
        const transfer = { transfer_id: tid, artifact: `artifact://${providerId}/${aid}`, direction: 'upload', status: 'prepared', expires_at: new Date(Date.now() + 300000).toISOString(), method: 'PUT', url: `${url}/v1/transfers/${tid}/bytes`, authorization: 'caller_bearer', sha256: data.sha256, size_bytes: data.size_bytes };
        transfers.set(tid, { ...transfer, owner: caller, artifact_id: aid, metadata: data });
        return answer('transfer.prepared', transfer, 201);
      }
      if (request.type === 'transfer.prepare_download') {
        if (transfers.size >= 64) throw new ProtocolError('rate_limited', 'Transfer quota reached', {}, true);
        const a = getArtifact(data.artifact, caller), tid = newId('transfer');
        const transfer = { transfer_id: tid, artifact: a.ref, direction: 'download', status: 'prepared', expires_at: new Date(Math.min(Date.now() + 300000, Date.parse(a.retention_until))).toISOString(), method: 'GET', url: `${url}/v1/transfers/${tid}/bytes`, authorization: 'caller_bearer', sha256: a.sha256, size_bytes: a.size_bytes };
        transfers.set(tid, { ...transfer, owner: caller }); return answer('transfer.prepared', transfer);
      }
      const t = getTransfer(data.transfer_id, caller);
      if (t.committing) throw new ProtocolError('state_conflict', 'Transfer completion is already in progress');
      if (request.type === 'transfer.abort') {
        if (t.status === 'complete') throw new ProtocolError('state_conflict', 'Committed artifacts cannot be aborted');
        t.status = 'aborted'; delete t.bytes; return answer('transfer.prepared', { ...Object.fromEntries(['transfer_id','artifact','direction','status','expires_at','method','url','authorization','sha256','size_bytes'].map(k => [k, t[k]])) });
      }
      if (t.direction !== 'upload' || !['uploaded', 'complete'].includes(t.status)) throw new ProtocolError('state_conflict', 'Upload must be verified before completion');
      if (t.status === 'complete') return answer('artifact.metadata', metadata(getArtifact(t.artifact, caller)));
      const file = join(directory, t.artifact_id + '.mp4');
      t.committing = true;
      try { await writeFile(file, t.bytes, { flag: 'wx' }); getTransfer(t.transfer_id, caller); } catch (e) { await rm(file, { force: true }); t.committing = false; throw e; }
      const a = { ref: t.artifact, artifact_id: t.artifact_id, provider_id: providerId, owner: caller, media_type: t.metadata.media_type, size_bytes: t.size_bytes, sha256: t.sha256, privacy: t.metadata.privacy, created_at: now(), retention_until: new Date(Date.now() + t.metadata.retention_seconds * 1000).toISOString(), file };
      artifacts.set(t.artifact_id, a); t.status = 'complete'; t.committing = false; delete t.bytes;
      return answer('artifact.metadata', metadata(a), 201);
    } catch (error) {
      const e = error instanceof ProtocolError ? error : new ProtocolError('internal_error', 'Provider internal error');
      const correlation = request && typeof request.request_id === 'string' && /^[a-z]+_[A-Za-z0-9_-]{8,64}$/.test(request.request_id) ? request.request_id : newId('req');
      if (e.retryAfterMs !== undefined) res.setHeader('retry-after', String(Math.ceil(e.retryAfterMs / 1000)));
      json(statusCodes[e.code] ?? 400, envelope('error', e.toJSON(), authenticatedCaller ?? 'agent://anonymous', { request_id: correlation, provider_id: providerId }));
    }
  });
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
  return { url, manifest: manifest(), publicKey, keyId, close: async () => { clearInterval(cleanup); for (const job of jobs.values()) stop(job, 'canceled'); journal?.close(); await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); } };
}
