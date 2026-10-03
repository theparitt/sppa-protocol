import { readFileSync, readdirSync } from 'node:fs';
import { createHash, createPublicKey, sign, verify } from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import canonicalize from 'canonicalize';

export const VERSION = '0.1.0';
export class ProtocolError extends Error {
  constructor(code, message, details = {}, retryable = false) {
    super(message); this.code = code; this.details = details; this.retryable = retryable;
  }
  toJSON() { return { code: this.code, message: this.message, retryable: this.retryable, details: this.details }; }
}
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
addFormats(ajv);
const directory = new URL('../schemas/0.1.0/', import.meta.url);
const schemas = new Map();
for (const name of readdirSync(directory).filter(n => n.endsWith('.json'))) {
  const schema = JSON.parse(readFileSync(new URL(name, directory), 'utf8'));
  ajv.addSchema(schema); schemas.set(name.replace('.schema.json', ''), schema);
}
export function validate(name, value) {
  assertIJSON(value);
  const schema = schemas.get(name); if (!schema) throw new Error(`Unknown schema ${name}`);
  const check = ajv.getSchema(schema.$id);
  if (!check(value)) throw new ProtocolError('invalid_request', `Invalid ${name}`, { errors: structuredClone(check.errors) });
  return value;
}
export function validateParameters(schema, value) {
  // A provider advertises an offline, self-contained schema, never arbitrary network refs.
  const walk = x => {
    if (!x || typeof x !== 'object') return;
    for (const [k, v] of Object.entries(x)) {
      if ((k === '$ref' || k === '$dynamicRef') && (typeof v !== 'string' || !v.startsWith('#'))) {
        throw new ProtocolError('invalid_request', 'Capability schema must be self-contained');
      }
      walk(v);
    }
  };
  walk(schema);
  let check;
  try { check = ajv.compile(schema); } catch { throw new ProtocolError('invalid_request', 'Invalid capability parameter schema'); }
  if (!check(value)) throw new ProtocolError('constraint_violation', 'Parameters violate the capability schema', { errors: structuredClone(check.errors) });
}
export function assertIJSON(value, depth = 0) {
  if (depth > 32) throw new ProtocolError('invalid_request', 'JSON nesting exceeds 32 levels');
  if (typeof value === 'number' && (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value)))) {
    throw new ProtocolError('invalid_request', 'Numbers must be finite and integers exactly representable');
  }
  if (typeof value === 'string' && /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)) {
    throw new ProtocolError('invalid_request', 'Unpaired Unicode surrogate');
  }
  if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) { assertIJSON(k, depth + 1); assertIJSON(v, depth + 1); }
}
export function parseJSON(text) {
  if (typeof text !== 'string') {
    if (!(text instanceof Uint8Array)) throw new ProtocolError('invalid_request', 'JSON input must be text or UTF-8 bytes');
    if (text.byteLength > 1048576) throw new ProtocolError('invalid_request', 'Control message exceeds 1 MiB');
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(text); }
    catch { throw new ProtocolError('invalid_request', 'Malformed UTF-8'); }
  }
  if (Buffer.byteLength(text, 'utf8') > 1048576) throw new ProtocolError('invalid_request', 'Control message exceeds 1 MiB');
  let value;
  try { value = JSON.parse(text); } catch { throw new ProtocolError('invalid_request', 'Malformed JSON'); }
  const token = /\s*("(?:[^"\\]|\\.)*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\],:])/gy;
  const tokens = []; let m;
  while ((m = token.exec(text))) tokens.push(m[1]);
  let i = 0;
  const scan = (depth = 0) => {
    if (depth > 32) throw new ProtocolError('invalid_request', 'JSON nesting exceeds 32 levels');
    const t = tokens[i++];
    if (t === '{') {
      const keys = new Set();
      if (tokens[i] === '}') { i++; return; }
      while (true) {
        const key = JSON.parse(tokens[i++]);
        if (keys.has(key)) throw new ProtocolError('invalid_request', 'Duplicate JSON object member');
        keys.add(key); i++; scan(depth + 1);
        if (tokens[i++] === '}') break;
      }
    } else if (t === '[') {
      if (tokens[i] === ']') { i++; return; }
      while (true) { scan(depth + 1); if (tokens[i++] === ']') break; }
    }
  };
  scan(); assertIJSON(value); return value;
}
export const sha256 = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
export function canonicalHash(value) { assertIJSON(value); return sha256(Buffer.from(canonicalize(value))); }
export function parseArtifact(ref) {
  if (typeof ref !== 'string' || !/^artifact:\/\/[a-z0-9]+(?:[.-][a-z0-9]+)+\/art_[A-Za-z0-9_-]{8,64}$/.test(ref)) {
    throw new ProtocolError('invalid_request', 'Invalid artifact reference');
  }
  const u = new URL(ref); return { provider_id: u.hostname, artifact_id: u.pathname.slice(1) };
}
export const TRANSITIONS = Object.freeze({
  queued: ['running', 'failed', 'canceled', 'expired'],
  running: ['completed', 'failed', 'canceled', 'expired'],
  completed: [], failed: [], canceled: [], expired: [],
});
export function transition(job, next, now = new Date().toISOString()) {
  if (!TRANSITIONS[job.status]?.includes(next)) throw new ProtocolError('state_conflict', `Cannot transition ${job.status} to ${next}`);
  job.status = next;
  if (next === 'running') job.started_at = now;
  if (!['running', 'queued'].includes(next)) job.finished_at = now;
  return job;
}
export function checkEligibility(capability, artifact, policy, health, now = Date.now()) {
  validate('capability', capability); validate('artifact', artifact); validate('policy', policy); validate('health', health);
  const c = capability.constraints; const reasons = [];
  const fail = (condition, code) => { if (!condition) reasons.push(code); };
  fail(artifact.size_bytes <= c.max_input_bytes, 'input_size');
  const identity = parseArtifact(artifact.ref);
  fail(identity.provider_id === artifact.provider_id && identity.artifact_id === artifact.artifact_id, 'artifact_identity');
  fail(Date.parse(artifact.retention_until) > now, 'artifact_expired');
  fail(c.input_media_types.includes(artifact.media_type), 'input_media_type');
  fail(c.privacy_levels.includes(policy.privacy), 'privacy');
  const levels = ['public', 'private', 'confidential', 'local_only'];
  fail(levels.indexOf(policy.privacy) >= levels.indexOf(artifact.privacy), 'privacy_downgrade');
  fail(c.execution_locations.includes(policy.execution_location), 'execution_location');
  fail(policy.privacy !== 'local_only' || policy.execution_location === 'local', 'local_only');
  fail(c.data_regions.includes(policy.data_region), 'data_region');
  fail(policy.training_use || !c.training_use, 'training_use');
  fail(c.retention_seconds <= policy.max_retention_seconds, 'retention');
  fail(policy.allow_content_logging || !c.content_logging, 'content_logging');
  fail(c.required_permissions.every(p => policy.granted_permissions.includes(p)), 'permissions');
  fail(policy.human_approval !== 'pending' && (!c.human_approval_required || policy.human_approval === 'approved'), 'human_approval');
  fail(health.provider_id === artifact.provider_id, 'provider_identity');
  fail(health.status === 'healthy' && Date.parse(health.observed_at) <= now + 30000 && Date.parse(health.valid_until) > now && Date.parse(health.valid_until) > Date.parse(health.observed_at), 'health');
  return { eligible: reasons.length === 0, reasons };
}
function signingBytes(document, context) {
  assertIJSON(document);
  const unsigned = { ...document, signature: { algorithm: document.signature.algorithm, key_id: document.signature.key_id } };
  return Buffer.from(`SPPA-${context}-${VERSION}\n` + canonicalize(unsigned));
}
export function signDocument(document, privateKey, keyId, context = 'RECEIPT') {
  const prepared = { ...document, signature: { algorithm: 'Ed25519', key_id: keyId } };
  return { ...prepared, signature: { ...prepared.signature, value: sign(null, signingBytes(prepared, context), privateKey).toString('base64url') } };
}
export function verifyDocument(document, trustedKey, context = 'RECEIPT') {
  try {
    validate(context === 'RECEIPT' ? 'receipt' : 'envelope', document);
    const k = trustedKey instanceof Object && trustedKey.type === 'public' ? trustedKey : createPublicKey(trustedKey);
    if (k.asymmetricKeyType !== 'ed25519') return false;
    return verify(null, signingBytes(document, context), k, Buffer.from(document.signature.value, 'base64url'));
  } catch { return false; }
}
export function verifyReceipt(receipt, { publicKey, keyId, providerId, callerId, jobId, capabilityId, capabilityVersion, parametersHash, inputRef, outputRef, inputHash, outputHash, now = Date.now() }) {
  try {
    validate('receipt', receipt);
    return receipt.signature.key_id === keyId && receipt.provider_id === providerId && receipt.caller_id === callerId && receipt.job_id === jobId && receipt.capability === capabilityId && receipt.capability_version === capabilityVersion && receipt.parameters_sha256 === parametersHash && receipt.input.artifact === inputRef && receipt.output.artifact === outputRef && receipt.input.sha256 === inputHash && receipt.output.sha256 === outputHash && Date.parse(receipt.started_at) <= Date.parse(receipt.finished_at) && Date.parse(receipt.finished_at) <= now + 30000 && verifyDocument(receipt, publicKey);
  } catch { return false; }
}
export class ReplayGuard {
  constructor() { this.nonces = new Map(); }
  verify(envelope, publicKey, keyId, providerId, now = Date.now()) {
    validate('envelope', envelope);
    for (const [n, expires] of this.nonces) if (expires <= now) this.nonces.delete(n);
    const expires = Date.parse(envelope.expires_at);
    if (envelope.provider_id !== providerId || envelope.signature?.key_id !== keyId || !envelope.nonce || !Number.isFinite(expires) || expires <= now || expires > now + 300000 || Math.abs(Date.parse(envelope.timestamp) - now) > 300000 || this.nonces.has(`${envelope.caller.id}:${envelope.nonce}`) || !verifyDocument(envelope, publicKey, 'REQUEST')) {
      throw new ProtocolError('unauthenticated', 'Invalid, expired, or replayed request signature');
    }
    this.nonces.set(`${envelope.caller.id}:${envelope.nonce}`, expires); return true;
  }
}
export function checkEndpoint(endpoint, { allowLoopback = false } = {}) {
  let u; try { u = new URL(endpoint); } catch { throw new ProtocolError('invalid_request', 'Invalid endpoint'); }
  if (u.username || u.password || u.hash || !['https:', 'http:'].includes(u.protocol) || (u.protocol === 'http:' && !(allowLoopback && ['127.0.0.1', '[::1]', 'localhost'].includes(u.hostname)))) throw new ProtocolError('invalid_request', 'HTTPS is required; HTTP is allowed only for explicit loopback development');
  return u;
}
export function envelope(type, payload, caller = 'agent://example', extra = {}) {
  return { sppa: VERSION, type, request_id: 'req_' + crypto.randomUUID(), timestamp: new Date().toISOString(), caller: { id: caller }, payload, ...extra };
}

export function validateManifest(manifest, options = {}) {
  validate('manifest', manifest); checkEndpoint(manifest.endpoint, options); checkEndpoint(manifest.security.keys_uri, options);
  const ids = new Set();
  for (const capability of manifest.capabilities) {
    const id = capability.id + '@' + capability.version;
    if (ids.has(id)) throw new ProtocolError('invalid_request', 'Duplicate capability/version');
    ids.add(id);
    try { validateParameters(capability.parameters_schema, {}); } catch (e) { if (e.code !== 'constraint_violation') throw e; }
    try { validateParameters(capability.result_schema, {}); } catch (e) { if (e.code !== 'constraint_violation') throw e; }
  }
  return manifest;
}
