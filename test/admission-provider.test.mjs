import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createProvider } from '../reference/ffmpeg/server.mjs';
import { Client } from '../src/client.mjs';
import { envelope } from '../src/core.mjs';
const capability=JSON.parse(await readFile(new URL('../reference/ffmpeg/capability.json',import.meta.url)));
const policy=JSON.parse(await readFile(new URL('../examples/policy.json',import.meta.url)));
const bytes=await readFile(new URL('./fixtures/input.mp4',import.meta.url));
async function setup(change=()=>{}) {
 const execution=structuredClone(capability.execution);change(execution);
 const provider=await createProvider({tokens:{fixture:'agent://one'},execution,ffmpeg:fileURLToPath(new URL('./fixtures/delay-worker.mjs',import.meta.url))});
 const client=new Client(provider.url+'/v1',{token:'fixture',callerId:'agent://one',providerId:'com.example.ffmpeg',allowLoopback:true});
 const a=await client.upload(bytes,{mediaType:'video/mp4'});
 const payload={capability:capability.id,capability_version:capability.version,input:{artifact:a.ref},parameters:{codec:'h264',crf:24},policy,deadline:new Date(Date.now()+30000).toISOString()};
 const create=(key=randomUUID())=>client.request('/jobs','job.create',payload,{idempotency_key:key});
 return {provider,client,create,payload};
}
async function waitTerminal(client,id) {
 for(let i=0;i<100;i++) {
  const job=await client.request('/jobs/get','job.get',{job_id:id});
  if(!['queued','running'].includes(job.status))return job;
  await new Promise(resolve=>setTimeout(resolve,25));
 }
 throw new Error('Controlled worker did not terminate');
}
test('Accepted FIFO jobs actually run in admission order',async()=>{
 const s=await setup(e=>{e.max_concurrency=1;e.queue.max_depth=2});
 try {
  const first=await s.create(),second=await s.create(),third=await s.create();
  assert.equal(second.status,'queued');assert.equal(third.status,'queued');
  const results=await Promise.all([first,second,third].map(j=>waitTerminal(s.client,j.job_id)));
  assert.ok(results.every(j=>j.status==='completed'));
  assert.ok(Date.parse(results[0].finished_at)<=Date.parse(results[1].started_at));
  assert.ok(Date.parse(results[1].finished_at)<=Date.parse(results[2].started_at));
 }finally{await s.provider.close()}
});
test('Waiting jobs expire without starting or receiving output',async()=>{
 const s=await setup(e=>{e.max_concurrency=1;e.queue.max_depth=1});
 try {
  await s.create();
  const waiting=await s.client.request('/jobs','job.create',{...s.payload,deadline:new Date(Date.now()+100).toISOString()},{idempotency_key:randomUUID()});
  assert.equal(waiting.status,'queued');const expired=await waitTerminal(s.client,waiting.job_id);
  assert.equal(expired.status,'expired');assert.equal(expired.error.code,'deadline_exceeded');assert.equal(expired.started_at,undefined);assert.equal(expired.output,undefined);
 }finally{await s.provider.close()}
});
test('HTTP admission queues while busy, reports live counts and enforces full queue', async()=>{
 const s=await setup(e=>{e.max_concurrency=1;e.queue.max_depth=1});
 try {
  const key=randomUUID(),first=await s.create(key),waiting=await s.create();assert.equal(first.status,'running');assert.equal(waiting.status,'queued');
  const h=await s.client.request('/health','health.get',{});assert.equal(h.status,'healthy');assert.equal(h.capabilities[0].capacity.available,0);assert.equal(h.capabilities[0].queue.depth,1);assert.equal(h.capabilities[0].accepting_jobs,false);
  assert.equal((await s.create(key)).job_id,first.job_id);
  await assert.rejects(s.create(),e=>e.code==='queue_full' && e.retryable);
  await s.client.request('/jobs/cancel','job.cancel',{job_id:waiting.job_id});
  const after=await s.client.request('/health','health.get',{});assert.equal(after.capabilities[0].queue.depth,0);
  assert.equal((await s.create()).status,'queued');
 } finally {await s.provider.close()}
});
test('Rate-limit errors preserve millisecond guidance, header and idempotent replay',async()=>{
 const s=await setup(e=>{e.rate_limit.requests=1});
 try {
  const key=randomUUID(),first=await s.create(key);assert.equal((await s.create(key)).job_id,first.job_id);
  await assert.rejects(s.create(),e=>e.code==='rate_limited' && e.retryAfterMs>0 && e.retryAfterMs<=60000);
  const request=envelope('job.create',s.payload,'agent://one',{idempotency_key:randomUUID()});
  const r=await fetch(s.provider.url+'/v1/jobs',{method:'POST',headers:{authorization:'Bearer fixture','content-type':'application/json'},body:JSON.stringify(request)});
  const body=await r.json();assert.equal(r.status,429);assert.equal(Number(r.headers.get('retry-after')),Math.ceil(body.payload.retry_after_ms/1000));
 } finally {await s.provider.close()}
});
test('Fresh-key branching retries share their root budget',async()=>{
 const s=await setup();
 try {
  const first=await s.create();await s.client.request('/jobs/cancel','job.cancel',{job_id:first.job_id});
  const retry=(key=randomUUID())=>s.client.request('/jobs/retry','job.retry',{job_id:first.job_id,deadline:s.payload.deadline},{idempotency_key:key});
  const key=randomUUID(),second=await retry(key);assert.equal(second.attempt,2);assert.equal((await retry(key)).job_id,second.job_id);
  const third=await retry();assert.equal(third.attempt,3);assert.equal(third.root_job_id,first.job_id);
  await assert.rejects(retry(),e=>e.code==='retry_exhausted' && !e.retryable);
 } finally {await s.provider.close()}
});
