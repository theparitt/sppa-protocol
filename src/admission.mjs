import { validate, ProtocolError } from './core.mjs';

// One gate per capability/version, inside the provider's atomic admission step.
export class AdmissionGate {
  constructor(execution, { clock = Date.now } = {}) {
    validate('execution', execution);
    this.execution = structuredClone(execution); this.clock = clock; this.buckets = new Map();
  }
  admit({ caller, running, queued, attempt = 1 }) {
    const e = this.execution, now = this.clock();
    if (typeof caller !== 'string' || !caller || ![running, queued].every(x => Number.isSafeInteger(x) && x >= 0) || !Number.isSafeInteger(attempt) || attempt < 1) throw new ProtocolError('invalid_request', 'Invalid admission context');
    if (attempt > e.retry.max_attempts || (attempt > 1 && !e.retry.supported)) throw new ProtocolError('retry_exhausted', 'Retry lineage attempt budget exhausted');
    const size = e.rate_limit.window_seconds * 1000;
    for (const [id, timestamps] of this.buckets) {
      const live = timestamps.filter(t => t > now - size);
      if (live.length) this.buckets.set(id, live); else this.buckets.delete(id);
    }
    const bucket = this.buckets.get(caller) ?? [];
    if (bucket.length >= e.rate_limit.requests) throw new ProtocolError('rate_limited', 'Capability caller admission rate exceeded', {}, true, Math.max(0, size - (now - bucket[0])));
    if (running >= e.max_concurrency) {
      if (!e.queue.enabled) throw new ProtocolError('capacity_exhausted', 'No execution slot is available', {}, true);
      if (queued >= e.queue.max_depth) throw new ProtocolError('queue_full', 'Capability queue is full', {}, true);
    }
    bucket.push(now); this.buckets.set(caller, bucket);
  }
}
