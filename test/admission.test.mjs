import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AdmissionGate } from '../src/admission.mjs';
import { validate, validateCapacity, checkEligibility } from '../src/core.mjs';
const example = n => JSON.parse(readFileSync(new URL(`../examples/${n}.json`, import.meta.url)));
const execution = () => structuredClone(example('capability').execution);
const accept = (gate, extra={}) => gate.admit({ caller:'agent://one', running:0, queued:0, ...extra });

test('Execution rejects impossible disabled queue and retry declarations', () => {
 const e=execution(); e.queue.enabled=false; assert.throws(()=>validate('execution',e)); e.queue.max_depth=0; validate('execution',e);
 e.retry.supported=false; assert.throws(()=>validate('execution',e)); e.retry.max_attempts=1; validate('execution',e);
});
test('Saturation can queue; full and disabled queues have distinct retryable errors', () => {
 const e=execution(), gate=new AdmissionGate(e); accept(gate,{running:2,queued:63});
 assert.throws(()=>accept(gate,{running:2,queued:64}), x=>x.code==='queue_full' && x.retryable);
 e.queue={enabled:false,max_depth:0,policy:'fifo'};
 assert.throws(()=>accept(new AdmissionGate(e),{running:2}), x=>x.code==='capacity_exhausted' && x.retryable);
});
test('Rolling rate windows isolate caller and capability, and expose exact backoff', () => {
 let now=100000; const e=execution(); e.rate_limit={requests:1,window_seconds:1,scope:'caller'};
 const a=new AdmissionGate(e,{clock:()=>now}), b=new AdmissionGate(e,{clock:()=>now}); accept(a);
 assert.throws(()=>accept(a), x=>x.code==='rate_limited' && x.toJSON().retry_after_ms===1000);
 accept(a,{caller:'agent://two'}); accept(b); now+=999;
 assert.throws(()=>accept(a), x=>x.retryAfterMs===1); now++; accept(a);
});
test('Rejected capacity does not consume rate and retries cannot exceed budget', () => {
 const e=execution(); e.rate_limit.requests=1; const gate=new AdmissionGate(e);
 assert.throws(()=>accept(gate,{running:2,queued:64})); accept(gate);
 assert.throws(()=>accept(new AdmissionGate(e),{attempt:4}), x=>x.code==='retry_exhausted' && !x.retryable);
});
test('Capacity checks arithmetic, declaration binding and FIFO queue availability', () => {
 const e=execution(), h=example('health').capabilities[0]; validateCapacity(h,e);
 h.capacity.available=1; assert.throws(()=>validateCapacity(h,e)); h.capacity={max_concurrency:2,running:2,available:0}; h.queue.depth=1; validateCapacity(h,e);
 h.queue.depth=64; h.accepting_jobs=false; validateCapacity(h,e); h.accepting_jobs=true; assert.throws(()=>validateCapacity(h,e));
});
test('Fresh busy health is distinct from outage and from capacity admission', () => {
 const c=example('capability'),a=example('artifact'),p=example('policy'),h=example('health');
 a.retention_until=new Date(Date.now()+60000).toISOString(); h.observed_at=new Date().toISOString();h.valid_until=a.retention_until;
 h.active_jobs=2;h.capabilities[0].capacity={max_concurrency:2,running:2,available:0};h.capabilities[0].queue.depth=64;h.capabilities[0].accepting_jobs=false;
 const result=checkEligibility(c,a,p,h);assert.equal(result.eligible,true);assert.equal(result.accepting_jobs,false);
 h.status='unavailable';assert.ok(checkEligibility(c,a,p,h).reasons.includes('health'));
});
