import {fork} from 'node:child_process';
import {randomBytes,randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {Client} from '../src/client.mjs';
import {validateManifest} from '../src/core.mjs';
import {probeCoreRuntime,RuntimeCache} from '../src/runtime-status.mjs';
const token=randomBytes(32).toString('hex'),callerId='agent://runtime-demo';
const child=fork(fileURLToPath(new URL('../reference/ffmpeg/server.mjs',import.meta.url)),[],{env:{...process.env,SPPA_TOKEN:token,SPPA_CALLER_ID:callerId},stdio:['ignore','ignore','inherit','ipc']});
try {
 const info=await Promise.race([once(child,'message').then(([m])=>m),once(child,'exit').then(()=>{throw new Error('Provider failed to start');})]);
 validateManifest(info.manifest,{allowLoopback:true});
 const client=new Client(info.endpoint,{token,callerId,providerId:info.manifest.provider_id,allowLoopback:true});
 const capability=info.manifest.capabilities[0],publisherId='observer.runtime-demo',publisherEpoch=randomUUID();
 const cache=new RuntimeCache({providerId:client.providerId,capabilityId:capability.id,capabilityVersion:capability.version,publisherId});
 for(let sequence=0;sequence<3;sequence++) {
  const snapshot=await probeCoreRuntime(client,capability,{publisherId,publisherEpoch,sequence});
  const accepted=cache.accept(snapshot);if(!accepted.accepted)throw new Error(accepted.reason);
  console.log(JSON.stringify({sequence,source:snapshot.source.kind,health:snapshot.health,admission:snapshot.admission_state,decision:cache.decision()}));
  if(sequence<2)await new Promise(resolve=>setTimeout(resolve,100));
 }
 console.log(JSON.stringify({at_expiry:cache.decision({now:Date.parse(cache.snapshot.expires_at)}),reservation:false,heartbeat_publisher:'not implemented',live_binding:'authorized HTTP polling'}));
}finally{if(child.exitCode===null){const stopped=once(child,'exit');child.kill('SIGTERM');await stopped;}}
