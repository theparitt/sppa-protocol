// Experimental profile, independent of the exact Core 0.1.1 wire snapshots.
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { validate, validateCapacity } from './core.mjs';
const ajv = new Ajv2020({strict:true,allErrors:true});addFormats(ajv);
const check = ajv.compile(JSON.parse(readFileSync(new URL('../schemas/runtime-status/0.1.0-draft.1/snapshot.schema.json',import.meta.url))));
export function validateRuntimeSnapshot(snapshot) {
 if (!check(snapshot)) throw new Error('Invalid runtime snapshot shape');
 if ((snapshot.source.kind==='provider_report' && (snapshot.source.id!==snapshot.provider_id || snapshot.publisher_id!==snapshot.provider_id)) || (snapshot.source.kind==='observer_probe' && snapshot.source.id!==snapshot.publisher_id)) throw new Error('Inconsistent observation source');
 const observed=Date.parse(snapshot.observed_at),expires=Date.parse(snapshot.expires_at);
 if (expires<=observed || expires-observed>60000) throw new Error('Invalid runtime validity interval');
 const c=snapshot.capacity;
 if (c && (c.running_jobs>c.max_concurrency || c.available_slots!==c.max_concurrency-c.running_jobs || c.waiting_jobs>c.max_waiting_jobs || (!c.queue_enabled && (c.waiting_jobs!==0 || c.max_waiting_jobs!==0)))) throw new Error('Inconsistent runtime capacity');
 if (!c && snapshot.reason_codes.length===0) throw new Error('Missing capacity needs an explicit reason');
 if (snapshot.admission_state==='accepting' && (!c || c.available_slots===0)) throw new Error('No immediate execution capacity');
 if (snapshot.admission_state==='queue_only' && (!c || c.available_slots!==0 || !c.queue_enabled || c.waiting_jobs>=c.max_waiting_jobs)) throw new Error('No queue capacity');
 if ((snapshot.health==='unavailable' || snapshot.reachability==='unreachable') && ['accepting','queue_only'].includes(snapshot.admission_state)) throw new Error('Unavailable provider cannot advertise admission');
 return snapshot;
}
export function assessRuntime(snapshot,{providerId,capabilityId,capabilityVersion,publisherId,now=Date.now(),maxAgeMs=15000,allowQueue=false}={}) {
 if (![now,maxAgeMs].every(Number.isFinite) || maxAgeMs<=0 || maxAgeMs>60000) throw new Error('Invalid receiver clock policy');
 const unknown=reason=>({state:'unknown',action:'refresh',reason});
 try {validateRuntimeSnapshot(snapshot);} catch {return unknown('invalid_snapshot');}
 if (!providerId || !capabilityId || !capabilityVersion || !publisherId || snapshot.provider_id!==providerId || snapshot.capability_ref.id!==capabilityId || snapshot.capability_ref.version!==capabilityVersion || snapshot.publisher_id!==publisherId) return unknown('identity_or_scope_mismatch');
 const observed=Date.parse(snapshot.observed_at),received=Date.parse(snapshot.received_at);
 if (observed>now || received>now || received<observed || Date.parse(snapshot.expires_at)<=now || now-observed>=maxAgeMs) return unknown('stale_or_clock_uncertain');
 if (snapshot.reachability!=='reachable' || snapshot.health==='unknown') return unknown('insufficient_observation');
 if (snapshot.health==='unavailable' || snapshot.admission_state==='rejecting') return {state:'unavailable',action:'consider_alternative',reason:'not_accepting'};
 if (snapshot.health==='degraded') return {state:'unknown',action:'inspect',reason:'degraded_service'};
 if (snapshot.admission_state==='accepting') return {state:'candidate',action:'check_offer_and_authority',reason:'execution_capacity_reported'};
 if (snapshot.admission_state==='queue_only') return {state:allowQueue?'candidate':'unavailable',action:allowQueue?'request_job_bound_eta':'consider_alternative',reason:'queue_only'};
 return unknown('admission_unknown');
}
// One cache per authenticated publisher + provider/capability/version scope.
export class RuntimeCache {
 constructor(identity){this.identity=identity;this.snapshot=null;this.retiredEpochs=new Set();}
 accept(snapshot,{now=Date.now(),resync=false}={}) {
  const assessment=assessRuntime(snapshot,{...this.identity,now});
  if (['invalid_snapshot','identity_or_scope_mismatch','stale_or_clock_uncertain'].includes(assessment.reason)) return {accepted:false,reason:assessment.reason};
  if (this.retiredEpochs.has(snapshot.publisher_epoch)) return {accepted:false,reason:'retired_epoch'};
  const previous=this.snapshot;
  if (previous && previous.publisher_epoch!==snapshot.publisher_epoch) {
   if (!resync) return {accepted:false,reason:'epoch_change_requires_resync'};
   if (this.retiredEpochs.size>=128) return {accepted:false,reason:'cache_rebind_required'};
   this.retiredEpochs.add(previous.publisher_epoch);
  } else if (previous && (snapshot.sequence<=previous.sequence || Date.parse(snapshot.observed_at)<Date.parse(previous.observed_at))) return {accepted:false,reason:'out_of_order'};
  if (previous && previous.publisher_epoch===snapshot.publisher_epoch && snapshot.sequence!==previous.sequence+1 && !resync) return {accepted:false,reason:'sequence_gap_requires_resync'};
  this.snapshot=structuredClone(snapshot);return {accepted:true,reason:'snapshot_accepted'};
 }
 decision(options={}){return assessRuntime(this.snapshot,{...options,...this.identity});}
}
// Poll the existing authorized Core endpoint. This is an observer's normalized
// full snapshot, not a provider-native heartbeat or a reservation.
export async function probeCoreRuntime(client,capability,{publisherId,publisherEpoch,sequence,now=()=>Date.now()}={}) {
 const health=await client.request('/health','health.get',{});validate('health',health);
 if (health.provider_id!==client.providerId) throw new Error('Wrong health issuer');
 const observations=health.capabilities.filter(x=>x.capability===capability.id && x.capability_version===capability.version);
 if (observations.length!==1) throw new Error('Missing or duplicate capability observation');
 const item=observations[0];validateCapacity(item,capability.execution);
 const observed=Date.parse(health.observed_at),received=now();
 const snapshot={profile:'runtime-status/0.1.0-draft.1',provider_id:client.providerId,capability_ref:{id:capability.id,version:capability.version},scope:'provider_capability',publisher_id:publisherId,publisher_epoch:publisherEpoch,sequence,source:{kind:'observer_probe',id:publisherId},observed_at:health.observed_at,expires_at:new Date(Math.min(Date.parse(health.valid_until),observed+15000)).toISOString(),received_at:new Date(received).toISOString(),reachability:'reachable',health:health.status,admission_state:health.status==='unavailable'?'rejecting':item.accepting_jobs?(item.capacity.available>0?'accepting':'queue_only'):'rejecting',reason_codes:[],capacity:{max_concurrency:item.capacity.max_concurrency,running_jobs:item.capacity.running,available_slots:item.capacity.available,waiting_jobs:item.queue.depth,max_waiting_jobs:item.queue.max_depth,queue_enabled:capability.execution.queue.enabled,queue_policy:'fifo'}};
 return validateRuntimeSnapshot(snapshot);
}

const checkHeartbeat=ajv.compile(JSON.parse(readFileSync(new URL('../schemas/runtime-status/0.1.0-draft.1/heartbeat.schema.json',import.meta.url))));
export function assessHeartbeat(observation,{providerId,observerId,subjectRef,subjectKind,now=Date.now()}={}) {
 if (!Number.isFinite(now)) throw new Error('Invalid receiver clock');
 if (!checkHeartbeat(observation) || !providerId || !observerId || !subjectRef || !subjectKind || observation.provider_id!==providerId || observation.observer_id!==observerId || observation.subject_ref!==subjectRef || observation.subject_kind!==subjectKind) return {liveness:'unknown',reason:'identity_or_scope_mismatch'};
 const observed=Date.parse(observation.observed_at),received=Date.parse(observation.received_at),expires=Date.parse(observation.expires_at);
 if (received<observed || received>now || observed>now || expires<=observed || expires-observed>60000 || expires<=now) return {liveness:'unknown',reason:'missing_or_stale_heartbeat'};
 return {liveness:'observed',reason:'scoped_response_observed'};
}
