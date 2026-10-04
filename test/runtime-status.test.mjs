import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateRuntimeSnapshot,assessRuntime,RuntimeCache,probeCoreRuntime,assessHeartbeat} from '../src/runtime-status.mjs';
import {createProvider} from '../reference/ffmpeg/server.mjs';
import {Client} from '../src/client.mjs';
const fixture=JSON.parse(readFileSync(new URL('../examples/runtime-status/queue-only.json',import.meta.url)));
const now=Date.parse(fixture.observed_at),identity={providerId:fixture.provider_id,capabilityId:fixture.capability_ref.id,capabilityVersion:fixture.capability_ref.version,publisherId:fixture.publisher_id};
const fresh=()=>structuredClone(fixture);
test('Healthy saturated provider remains a queue candidate only with caller consent',()=>{
 assert.equal(assessRuntime(fixture,{...identity,now,allowQueue:true}).action,'request_job_bound_eta');
 assert.equal(assessRuntime(fixture,{...identity,now}).state,'unavailable');
 const full=fresh();full.capacity.waiting_jobs=20;assert.throws(()=>validateRuntimeSnapshot(full));full.admission_state='rejecting';assert.equal(assessRuntime(full,{...identity,now,allowQueue:true}).state,'unavailable');
});
test('Expired, future, wrong identity and hidden observations never imply free capacity',()=>{
 assert.equal(assessRuntime(fixture,{...identity,now:now+15000}).state,'unknown');
 assert.equal(assessRuntime(fixture,{...identity,now:now-1}).state,'unknown');
 assert.equal(assessRuntime(fixture,{...identity,publisherId:'wrong',now}).state,'unknown');
 const hidden=fresh();hidden.capacity=null;hidden.admission_state='unknown';hidden.reason_codes=['not_disclosed'];assert.equal(assessRuntime(hidden,{...identity,now}).state,'unknown');
 const wrongSource=fresh();wrongSource.source.id='wrong';assert.throws(()=>validateRuntimeSnapshot(wrongSource));
 const invalid=fresh();invalid.capacity.available_slots=1;assert.throws(()=>validateRuntimeSnapshot(invalid));
});
test('Sequence replay, gaps, epoch restart and delayed retired epochs require safe resync',()=>{
 const cache=new RuntimeCache(identity);assert.equal(cache.accept(fixture,{now}).accepted,true);
 assert.equal(cache.accept(fixture,{now}).reason,'out_of_order');
 const gap=fresh();gap.sequence+=2;assert.equal(cache.accept(gap,{now}).reason,'sequence_gap_requires_resync');assert.equal(cache.accept(gap,{now,resync:true}).accepted,true);
 const restart=fresh();restart.publisher_epoch='epoch-8';restart.sequence=0;assert.equal(cache.accept(restart,{now}).reason,'epoch_change_requires_resync');assert.equal(cache.accept(restart,{now,resync:true}).accepted,true);
 assert.equal(cache.accept(gap,{now,resync:true}).reason,'retired_epoch');
 fixture.capacity.waiting_jobs=8;assert.equal(cache.snapshot.capacity.waiting_jobs,7);fixture.capacity.waiting_jobs=7;
});
test('Fresh endpoint heartbeat never refreshes a stale queue or proves worker health',()=>{
 const cache=new RuntimeCache(identity);cache.accept(fixture,{now});
 const observation={profile:fixture.profile,provider_id:fixture.provider_id,observer_id:'observer.example',subject_ref:'control.example',subject_kind:'control_endpoint',observed_at:new Date(now+20000).toISOString(),received_at:new Date(now+20000).toISOString(),expires_at:new Date(now+30000).toISOString(),heartbeat_interval_ms:5000};
 const context={providerId:fixture.provider_id,observerId:'observer.example',subjectRef:'control.example',subjectKind:'control_endpoint',now:now+20000};
 assert.equal(assessHeartbeat(observation,context).liveness,'observed');
 assert.equal(cache.decision({now:now+20000}).reason,'stale_or_clock_uncertain');
 assert.equal(assessHeartbeat(observation,{...context,subjectKind:'capability_worker_pool'}).liveness,'unknown');
 assert.equal(assessHeartbeat(observation,{...context,now:now+30000}).liveness,'unknown');
});
test('Degraded and unavailable service states remain distinct from endpoint reachability',()=>{
 const degraded=fresh();degraded.health='degraded';assert.equal(assessRuntime(degraded,{...identity,now,allowQueue:true}).action,'inspect');
 const offline=fresh();offline.health='unavailable';offline.admission_state='rejecting';assert.equal(assessRuntime(offline,{...identity,now}).state,'unavailable');
 const unknown=fresh();unknown.reachability='unknown';assert.equal(assessRuntime(unknown,{...identity,now}).state,'unknown');
});
test('Authorized direct provider probe produces an agent-readable snapshot without Hub',async()=>{
 const provider=await createProvider({tokens:{runtime_test:'agent://runtime'}});
 try {
  const client=new Client(provider.url+'/v1',{token:'runtime_test',callerId:'agent://runtime',providerId:'com.example.ffmpeg',allowLoopback:true});
  const capability=JSON.parse(readFileSync(new URL('../reference/ffmpeg/capability.json',import.meta.url)));
  const snapshot=await probeCoreRuntime(client,capability,{publisherId:'observer.example',publisherEpoch:'test-epoch',sequence:0});
  assert.equal(snapshot.admission_state,'accepting');assert.equal(snapshot.source.kind,'observer_probe');
  assert.equal(assessRuntime(snapshot,{...identity,now:Date.now()}).action,'check_offer_and_authority');
  const denied=new Client(provider.url+'/v1',{token:'denied',callerId:'agent://runtime',providerId:'com.example.ffmpeg',allowLoopback:true});
  await assert.rejects(probeCoreRuntime(denied,capability,{publisherId:'observer.example',publisherEpoch:'test-epoch',sequence:1}));
 }finally{await provider.close();}
});
