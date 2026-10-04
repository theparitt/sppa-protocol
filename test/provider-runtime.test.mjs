import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createArtifactProvider } from '../reference/provider/server.mjs';
import { Client } from '../src/client.mjs';
import { verifyReceipt, canonicalHash, sha256 } from '../src/core.mjs';
const capability=JSON.parse(await readFile(new URL('../reference/background/capability.json',import.meta.url)));
const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
const policy={privacy:'private',execution_location:'remote',data_region:'unspecified',training_use:false,max_retention_seconds:3600,allow_content_logging:false,granted_permissions:['artifact.read','artifact.write'],human_approval:'not_required'};
test('Capability runtime hook binds PNG artifacts and receipts to a distinct provider; failed probes exclude admission',async()=>{
 let ready=true;
 const provider=await createArtifactProvider({capability,providerId:'com.example.background',name:'Test image runtime',tokens:{test_token:'agent://test'},outputExtension:'png',probeRuntime:async()=>ready,runTask:async({source,outputFile})=>{await writeFile(outputFile,await readFile(source));return {media_type:'image/png',width:1,height:1,alpha_channel:true};}});
 try {
  assert.equal(provider.manifest.provider_id,'com.example.background');
  const client=new Client(provider.url+'/v1',{providerId:provider.manifest.provider_id,callerId:'agent://test',token:'test_token',allowLoopback:true});
  const input=await client.upload(pixel,{mediaType:'image/png',privacy:'private',retentionSeconds:60});
  const payload={capability:capability.id,capability_version:capability.version,input:{artifact:input.ref},parameters:{},policy,deadline:new Date(Date.now()+30000).toISOString()};
  const job=await client.request('/jobs','job.create',payload,{idempotency_key:'runtime-test-001'});
  let done=job;
  while(['queued','running'].includes(done.status)){await new Promise(r=>setTimeout(r,10));done=await client.request('/jobs/get','job.get',{job_id:job.job_id});}
  assert.equal(done.status,'completed');assert.equal(done.output.metadata.media_type,'image/png');
  const output=await client.download(done.output.artifact);assert.deepEqual(output,pixel);
  const receipt=await client.request('/receipts/get','receipt.get',{receipt_id:done.receipt_id});
  assert.equal(verifyReceipt(receipt,{publicKey:provider.publicKey,keyId:provider.keyId,providerId:'com.example.background',callerId:'agent://test',jobId:job.job_id,capabilityId:capability.id,capabilityVersion:capability.version,parametersHash:canonicalHash({}),inputRef:input.ref,inputHash:input.sha256,outputHash:sha256(output),outputRef:done.output.artifact}),true);
  ready=false;
  const health=await client.request('/health','health.get',{});
  assert.equal(health.status,'unavailable');assert.equal(health.capabilities[0].accepting_jobs,false);
  await assert.rejects(()=>client.request('/jobs','job.create',payload,{idempotency_key:'runtime-test-002'}));
  const replay=await client.request('/jobs','job.create',payload,{idempotency_key:'runtime-test-001'});
  assert.equal(replay.job_id,job.job_id);
 }finally{await provider.close();}
});

