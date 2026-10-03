import { envelope, validate, ProtocolError, checkEndpoint, parseJSON } from './core.mjs';
async function boundedBytes(response, limit) {
  const chunks = []; let received = 0;
  for await (const chunk of response.body) {
    received += chunk.length;
    if (received > limit) throw new ProtocolError('integrity_mismatch', 'Download exceeds declared size');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, received);
}
export class Client {
  constructor(endpoint, { token, callerId, providerId, allowLoopback = false, timeoutMs = 10000, maxDownloadBytes = 67108864 }) {
    this.endpoint = checkEndpoint(endpoint, { allowLoopback }).href.replace(/\/$/, '');
    if (!providerId || !callerId || !token) throw new Error('providerId, callerId and token are required');
    this.providerId = providerId; this.token = token; this.callerId = callerId; this.timeoutMs = timeoutMs;
    if (!Number.isSafeInteger(maxDownloadBytes) || maxDownloadBytes < 0) throw new Error('maxDownloadBytes must be a nonnegative safe integer');
    this.maxDownloadBytes = maxDownloadBytes;
  }
  async request(path, type, payload, extra = {}) {
    const body = envelope(type, payload, this.callerId, extra); validate('envelope', body);
    const response = await fetch(this.endpoint + path, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${this.token}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(this.timeoutMs), redirect: 'error' });
    if (response.headers.get('content-type')?.split(';')[0] !== 'application/json') throw new ProtocolError('invalid_request', 'Expected a JSON control response');
    const data = parseJSON(await boundedBytes(response, 1048576)); validate('envelope', data);
    if (Math.abs(Date.parse(data.timestamp) - Date.now()) > 300000) throw new ProtocolError('invalid_request', 'Stale response timestamp');
    if (data.request_id !== body.request_id || data.caller.id !== body.caller.id) throw new ProtocolError('invalid_request', 'Response correlation mismatch');
    if (data.provider_id !== this.providerId) throw new ProtocolError('invalid_request', 'Provider identity mismatch');
    if (!response.ok || data.type === 'error') throw new ProtocolError(data.payload.code ?? 'internal_error', data.payload.message ?? 'Request failed', data.payload.details, data.payload.retryable, data.payload.retry_after_ms);
    const expected = { 'job.create': 'job.created', 'job.retry': 'job.created', 'job.get': 'job.snapshot', 'job.cancel': 'job.snapshot', 'artifact.get': 'artifact.metadata', 'transfer.prepare_upload': 'transfer.prepared', 'transfer.prepare_download': 'transfer.prepared', 'transfer.complete': 'artifact.metadata', 'transfer.abort': 'transfer.prepared', 'health.get': 'health.snapshot', 'receipt.get': 'receipt.result' };
    if (data.provider_id !== this.providerId || data.type !== expected[type]) throw new ProtocolError('invalid_request', 'Provider identity or response type mismatch');
    return data.payload;
  }
  async upload(bytes, { mediaType, privacy = 'private', retentionSeconds = 3600 }) {
    const { sha256 } = await import('./core.mjs');
    const t = await this.request('/transfers/uploads', 'transfer.prepare_upload', { media_type: mediaType, size_bytes: bytes.length, sha256: sha256(bytes), privacy, retention_seconds: retentionSeconds });
    // The reference client delegates credentials only to the configured provider origin.
    if (t.method !== 'PUT' || t.direction !== 'upload' || t.authorization !== 'caller_bearer' || t.sha256 !== sha256(bytes) || t.size_bytes !== bytes.length) throw new ProtocolError('invalid_request', 'Invalid upload descriptor');
    if (t.status !== 'prepared' || Date.parse(t.expires_at) <= Date.now()) throw new ProtocolError('transfer_expired', 'Upload is not prepared and live');
    const u = checkEndpoint(t.url, { allowLoopback: new URL(this.endpoint).protocol === 'http:' }); if (u.origin !== new URL(this.endpoint).origin) throw new ProtocolError('forbidden', 'Cross-origin upload requires explicit storage authorization');
    const r = await fetch(u, { method: 'PUT', headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/octet-stream' }, body: bytes, signal: AbortSignal.timeout(this.timeoutMs), redirect: 'error' });
    if (!r.ok) throw new ProtocolError('integrity_mismatch', 'Upload failed');
    return this.request('/transfers/complete', 'transfer.complete', { transfer_id: t.transfer_id });
  }
  async download(ref) {
    const t = await this.request('/transfers/downloads', 'transfer.prepare_download', { artifact: ref });
    if (t.method !== 'GET' || t.direction !== 'download' || t.authorization !== 'caller_bearer' || t.artifact !== ref) throw new ProtocolError('invalid_request', 'Invalid download descriptor');
    if (t.status !== 'prepared' || Date.parse(t.expires_at) <= Date.now()) throw new ProtocolError('transfer_expired', 'Download is not prepared and live');
    if (t.size_bytes > this.maxDownloadBytes) throw new ProtocolError('constraint_violation', 'Download exceeds client memory limit');
    checkEndpoint(t.url, { allowLoopback: new URL(this.endpoint).protocol === 'http:' });
    if (new URL(t.url).origin !== new URL(this.endpoint).origin) throw new ProtocolError('forbidden', 'Cross-origin download requires explicit storage authorization');
    const r = await fetch(t.url, { headers: { authorization: `Bearer ${this.token}` }, signal: AbortSignal.timeout(this.timeoutMs), redirect: 'error' });
    if (!r.ok) throw new ProtocolError('not_found', 'Download failed');
    const bytes = await boundedBytes(r, t.size_bytes); const { sha256 } = await import('./core.mjs');
    if (bytes.length !== t.size_bytes || sha256(bytes) !== t.sha256) throw new ProtocolError('integrity_mismatch', 'Downloaded artifact integrity mismatch');
    return bytes;
  }
}
