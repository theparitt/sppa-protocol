import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createProvider} from '../reference/ffmpeg/server.mjs';
import {Client} from '../src/client.mjs';
import {sha256,canonicalHash,verifyReceipt} from '../src/core.mjs';
import {JobNotificationJournal,NotificationClient,NOTIFICATION_PROFILE,validateNotificationDescriptor,validateNotificationBatch,notificationCursor} from '../src/job-notifications.mjs';

test('Direct provider: discover, stream a real job, replay, isolate owners and verify its receipt',async()=>{
 const provider=await createProvider({tokens:{first:'agent://one',second:'agent://two'}});
 try{
  const manifest=await (await fetch(provider.url+'/.well-known/sppa.json')).json();
  const descriptor=validateNotificationDescriptor(manifest.extensions[NOTIFICATION_PROFILE]);
  assert.equal(descriptor.retention.durability,'process');
  const notifications=new NotificationClient(descriptor,{token:'first',allowLoopback:true,origin:provider.url});
  const cursor=(await notifications.snapshot()).latest_cursor;
  const client=new Client(manifest.endpoint,{token:'first',callerId:'agent://one',providerId:manifest.provider_id,allowLoopback:true});
  const bytes=await readFile(new URL('./fixtures/input.mp4',import.meta.url));
  const input=await client.upload(bytes,{mediaType:'video/mp4'});
  const parameters={codec:'h264',crf:24};
  const policy=JSON.parse(await readFile(new URL('../examples/policy.json',import.meta.url)));
  const job=await client.request('/jobs','job.create',{capability:'video.transcode',capability_version:'1.0.0',input:{artifact:input.ref},parameters,policy,deadline:new Date(Date.now()+30000).toISOString()},{idempotency_key:randomUUID()});
  let events=[];
  for await(const batch of notifications.subscribe({after:cursor,signal:AbortSignal.timeout(10000)})){
   events.push(...batch.items);if(events.some(e=>e.job_id===job.job_id&&e.status==='completed'))break;
  }
  assert.deepEqual(events.filter(e=>e.job_id===job.job_id).map(e=>e.status),['queued','running','completed']);
  const replay=await notifications.snapshot({after:cursor});assert.deepEqual(replay.items,events);
  const other=new NotificationClient(descriptor,{token:'second',allowLoopback:true});
  assert.deepEqual((await other.snapshot()).items,[]);
  const result=await client.request('/jobs/get','job.get',{job_id:job.job_id});
  const output=await client.download(result.output.artifact);
  const receipt=await client.request('/receipts/get','receipt.get',{receipt_id:result.receipt_id});
  assert.equal(verifyReceipt(receipt,{publicKey:provider.publicKey,keyId:provider.keyId,providerId:manifest.provider_id,callerId:'agent://one',jobId:job.job_id,capabilityId:'video.transcode',capabilityVersion:'1.0.0',parametersHash:canonicalHash(parameters),inputRef:input.ref,outputRef:result.output.artifact,inputHash:sha256(bytes),outputHash:sha256(output)}),true);
  const unauth=await fetch(descriptor.http.inbox_url);assert.equal(unauth.status,401);
  await assert.rejects(notifications.snapshot({journalId:randomUUID()}),e=>e.status===409);
  for(const query of ['after=01','after=1&after=2','limit=51','token=first'])assert.equal((await fetch(descriptor.http.inbox_url+'?'+query,{headers:{authorization:'Bearer first'}})).status,400);
 }finally{await provider.close();}
});

test('Journal identity, bounded retention, gaps and schema rejection',async()=>{
 const journal=new JobNotificationJournal({providerId:'com.example.ffmpeg',maxEvents:1});
 const provider=await createProvider({tokens:{first:'agent://one'}});
 try{
  const client=new Client(provider.url+'/v1',{token:'first',callerId:'agent://one',providerId:'com.example.ffmpeg',allowLoopback:true});
  const input=await client.upload(Buffer.from('invalid video'),{mediaType:'video/mp4'});
  const policy=JSON.parse(await readFile(new URL('../examples/policy.json',import.meta.url)));
  const job=await client.request('/jobs','job.create',{capability:'video.transcode',capability_version:'1.0.0',input:{artifact:input.ref},parameters:{codec:'h264',crf:24},policy,deadline:new Date(Date.now()+30000).toISOString()},{idempotency_key:randomUUID()});
  journal.record(job);journal.record(job);
  assert.equal(journal.records.size,1);assert.equal(journal.read('agent://one').resync_required,true);
  assert.equal(journal.read('agent://two').items.length,0);
  const batch=journal.read('agent://one');assert.throws(()=>validateNotificationBatch({...batch,version:'next'}));
  assert.throws(()=>notificationCursor('9223372036854775808'));
  const fresh=new JobNotificationJournal({providerId:'com.example.ffmpeg'});
  assert.notEqual(fresh.journalId,journal.journalId);
  assert.throws(()=>fresh.read('agent://one',{journalId:journal.journalId}),e=>e.status===409);
 }finally{journal.close();await provider.close();}
});

test('Disabled optional profile preserves Core-only discovery',async()=>{
 const provider=await createProvider({tokens:{first:'agent://one'},notifications:false});
 try{assert.equal(provider.manifest.extensions,undefined);assert.equal((await fetch(provider.url+'/v1/job-notifications',{headers:{authorization:'Bearer first'}})).status,404);}
 finally{await provider.close();}
});

test('SSE pages a backlog then wakes for later jobs; per-owner streams are bounded',async()=>{
 const provider=await createProvider({tokens:{first:'agent://one'}});
 const abort=new AbortController();
 try{
  const descriptor=provider.manifest.extensions[NOTIFICATION_PROFILE];
  const notifications=new NotificationClient(descriptor,{token:'first',allowLoopback:true});
  const client=new Client(provider.url+'/v1',{token:'first',callerId:'agent://one',providerId:provider.manifest.provider_id,allowLoopback:true});
  const input=await client.upload(Buffer.from('invalid'),{mediaType:'video/mp4'});
  const policy=JSON.parse(await readFile(new URL('../examples/policy.json',import.meta.url)));
  const run=()=>client.request('/jobs','job.create',{capability:'video.transcode',capability_version:'1.0.0',input:{artifact:input.ref},parameters:{codec:'h264',crf:24},policy,deadline:new Date(Date.now()+30000).toISOString()},{idempotency_key:randomUUID()});
  for(let i=0;i<18;i++){
   const job=await run();
   for await(const batch of notifications.subscribe({after:(BigInt((await notifications.snapshot()).latest_cursor)-2n).toString(),signal:AbortSignal.timeout(5000)}))if(batch.items.some(e=>e.job_id===job.job_id&&e.status==='failed'))break;
  }
  const stream=notifications.subscribe({signal:AbortSignal.any([abort.signal,AbortSignal.timeout(10000)])});
  let first=await stream.next();assert.equal(first.value.items.length,50);assert.equal(first.value.has_more,true);
  const rest=await stream.next();assert.equal(rest.value.has_more,false);
  const later=await run();let found=false;
  while(!found){const next=await stream.next();assert.equal(next.done,false);found=next.value.items.some(e=>e.job_id===later.job_id&&e.status==='failed');}
  const another=new AbortController();
  const headers={authorization:'Bearer first'};
  const second=await fetch(descriptor.http.events_url,{headers,signal:another.signal});assert.equal(second.status,200);
  const third=await fetch(descriptor.http.events_url,{headers});assert.equal(third.status,503);
  another.abort();abort.abort();await stream.return();
 }finally{abort.abort();await provider.close();}
});
