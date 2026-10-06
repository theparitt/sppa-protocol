// Optional, exact draft profile. Core 0.1.1 snapshots remain unchanged.
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {validate,checkEndpoint,ProtocolError,parseJSON} from './core.mjs';
export const NOTIFICATION_PROFILE='sppa.job_notifications';
export const NOTIFICATION_VERSION='0.1.0-draft.1';
export const JOB_STATES=['queued','running','completed','failed','canceled','expired'];
const MAX_CURSOR=9223372036854775807n;
const ajv=new Ajv2020({strict:true,allErrors:true});addFormats(ajv);
const checks={};
for(const name of ['event','batch','descriptor','capability']){
 const schema=JSON.parse(readFileSync(new URL(`../schemas/job-notifications/${NOTIFICATION_VERSION}/${name}.schema.json`,import.meta.url)));
 ajv.addSchema(schema);checks[name]=schema.$id;
}
function check(name,value){
 const verify=ajv.getSchema(checks[name]);
 if(!verify(value))throw new ProtocolError('invalid_request',`Invalid notification ${name}`,{errors:structuredClone(verify.errors)});
 return value;
}
export function notificationCursor(value='0'){
 if(typeof value!=='string'||!/^(0|[1-9][0-9]{0,18})$/.test(value)||BigInt(value)>MAX_CURSOR)throw new ProtocolError('invalid_request','Invalid notification cursor');
 return BigInt(value);
}
function retention(value){if(value.max_days!==Math.ceil(value.max_age_seconds/86400))throw new ProtocolError('invalid_request','Inconsistent notification retention');}
export function validateNotificationDescriptor(value){
 check('descriptor',value);retention(value.retention);
 if(value.delivery.max_streams_per_owner>value.delivery.max_streams)throw new ProtocolError('invalid_request','Inconsistent stream budget');
 const job=value.job_observation;
 if((job.binding==='sppa_core_http'&&(job.method!=='POST'||job.message_type!=='job.get'))||(job.binding==='hub_http'&&(job.method!=='GET'||job.message_type!==null)))throw new ProtocolError('invalid_request','Inconsistent job observation binding');
 return value;
}
export function validateCapabilityNotifications(value){return check('capability',value);}
export function enableCapabilityNotifications(capability){
 return {...structuredClone(capability),extensions:{...capability.extensions,[NOTIFICATION_PROFILE]:{version:NOTIFICATION_VERSION,events:'job_lifecycle',discovery:'provider_manifest.extensions.sppa.job_notifications'}}};
}
export function validateNotificationEvent(value){
 check('event',value);notificationCursor(value.id);
 if(value.event_type!==`job.${value.status}`||((value.status==='completed')!==(value.receipt_url!==null))||Date.parse(value.occurred_at)>Date.parse(value.recorded_at)+1000)throw new ProtocolError('invalid_request','Inconsistent notification event');
 return value;
}
export function validateNotificationBatch(value,{descriptor,after='0'}={}){
 check('batch',value);retention(value.retention);
 const cursor=notificationCursor(value.next_cursor),head=notificationCursor(value.latest_cursor);let previous=notificationCursor(after);
 if(cursor<previous||head<cursor)throw new ProtocolError('invalid_request','Notification cursor regressed');
 if(descriptor){
  validateNotificationDescriptor(descriptor);
  if(value.journal_id!==descriptor.journal_id)throw new ProtocolError('state_conflict','Notification journal changed; reconcile owned jobs before resetting the cursor');
  if(JSON.stringify(value.retention)!==JSON.stringify(descriptor.retention)){
   for(const key of Object.keys(descriptor.retention))if(value.retention[key]!==descriptor.retention[key])throw new ProtocolError('invalid_request','Notification retention differs from discovery');
  }
 }
 for(const event of value.items){
  validateNotificationEvent(event);const id=notificationCursor(event.id);
  if(id<=previous||id>cursor)throw new ProtocolError('invalid_request','Notification events are out of order');previous=id;
  if(descriptor?.authority.kind==='provider'&&event.provider_id!==descriptor.authority.id)throw new ProtocolError('forbidden','Notification belongs to another provider');
 }
 if(value.has_more&&(!value.items.length||value.items.at(-1).id!==value.next_cursor))throw new ProtocolError('invalid_request','Invalid notification pagination');
 return value;
}
export function notificationDescriptor({baseUrl,inboxPath='/v1/job-notifications',eventsPath=inboxPath+'/events',journalId,authority,durability='process',maxEvents=10000,maxAgeSeconds=3600,maxStreams=64,maxStreamsPerOwner=2,requiredScope=null,jobBinding='sppa_core_http',jobPath='/v1/jobs/get'}){
 return validateNotificationDescriptor({profile:NOTIFICATION_PROFILE,version:NOTIFICATION_VERSION,core_version:'0.1.1',journal_id:journalId,authority,events:JOB_STATES.map(s=>'job.'+s),http:{inbox_url:new URL(inboxPath,baseUrl).href,events_url:new URL(eventsPath,baseUrl).href,authentication:'bearer',required_scope:requiredScope},job_observation:{binding:jobBinding,method:jobBinding==='sppa_core_http'?'POST':'GET',url_template:new URL(jobPath,baseUrl).href,message_type:jobBinding==='sppa_core_http'?'job.get':null},retention:{max_days:Math.ceil(maxAgeSeconds/86400),max_events:maxEvents,max_age_seconds:maxAgeSeconds,durability},delivery:{mode:'at_least_once',ordering:'journal_commit',max_batch_size:50,max_streams:maxStreams,max_streams_per_owner:maxStreamsPerOwner,heartbeat_seconds:1},webhooks:false});
}

// Reference storage adapter: process-local and explicitly advertised as such.
// Persistent deployments may replace it while keeping the same profile.
export class JobNotificationJournal {
 constructor({providerId,maxEvents=10000,maxAgeSeconds=3600,maxStreams=64,maxStreamsPerOwner=2,inboxPath='/v1/job-notifications'}={}){
  if(!/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/.test(providerId)||!Number.isInteger(maxEvents)||maxEvents<1||maxEvents>100000||!Number.isInteger(maxAgeSeconds)||maxAgeSeconds<1||maxAgeSeconds>2592000||!Number.isInteger(maxStreams)||maxStreams<1||maxStreams>128||![1,2].includes(maxStreamsPerOwner)||maxStreamsPerOwner>maxStreams)throw new Error('Invalid notification journal limits');
  Object.assign(this,{providerId,maxEvents,maxAgeSeconds,maxStreams,maxStreamsPerOwner,inboxPath,journalId:randomUUID(),sequence:0n,floor:0n,records:new Map(),owners:new Map(),states:new Map(),streams:new Map(),closed:false});
 }
 descriptor(baseUrl){return notificationDescriptor({baseUrl,inboxPath:this.inboxPath,journalId:this.journalId,authority:{kind:'provider',id:this.providerId},maxEvents:this.maxEvents,maxAgeSeconds:this.maxAgeSeconds,maxStreams:this.maxStreams,maxStreamsPerOwner:this.maxStreamsPerOwner});}
 record(job){
  validate('job',job);if(job.provider_id!==this.providerId)throw new ProtocolError('forbidden','Job belongs to another provider');
  if(this.closed)throw new Error('Notification journal closed');
  const key=job.caller_id+'\0'+job.job_id,previous=this.states.get(key);
  if(previous&&!['queued','running'].includes(previous))return false;
  const phases=[['queued',job.created_at],...(job.started_at?[['running',job.started_at]]:[]),...(job.finished_at?[[job.status,job.finished_at]]:[])];
  let changed=false;
  for(const [status,at] of phases){
   if(previous===status||(previous==='running'&&status==='queued'))continue;
   if(this.sequence===MAX_CURSOR)throw new Error('Notification cursor exhausted');
   const id=String(++this.sequence),recorded=new Date().toISOString();
   const event=validateNotificationEvent({id,event_type:'job.'+status,provider_id:this.providerId,job_id:job.job_id,capability:job.capability,capability_version:job.capability_version,status,occurred_at:at,recorded_at:recorded,source:'provider_journal',status_url:'/v1/jobs/get',receipt_url:status==='completed'?'/v1/receipts/get':null,result_verified:false});
   let owned=this.owners.get(job.caller_id);if(!owned){owned=new Map();this.owners.set(job.caller_id,owned);}
   this.records.set(id,{owner:job.caller_id,event});owned.set(id,event);changed=true;
  }
  this.states.set(key,job.status);if(this.states.size>10000)this.states.delete(this.states.keys().next().value);
  this.prune();if(changed)for(const stream of this.streams.get(job.caller_id)||[])stream.changed();return changed;
 }
 prune(){
  const cutoff=Date.now()-this.maxAgeSeconds*1000;
  for(const [id,record] of this.records){
   if(this.records.size<=this.maxEvents&&Date.parse(record.event.recorded_at)>=cutoff)break;
   this.records.delete(id);const owned=this.owners.get(record.owner);owned.delete(id);if(!owned.size)this.owners.delete(record.owner);this.floor=BigInt(id);
  }
 }
 read(owner,{after='0',limit=50,journalId=this.journalId}={}){
  const cursor=notificationCursor(after);
  if(journalId!==this.journalId)throw Object.assign(new ProtocolError('state_conflict','Notification journal changed; reconcile owned job IDs'),{status:409});
  if(cursor>this.sequence)throw Object.assign(new ProtocolError('state_conflict','Cursor is ahead of this journal'),{status:409});
  if(!Number.isInteger(limit)||limit<1||limit>50)throw new ProtocolError('invalid_request','Use 1-50 events per page');
  this.prune();const items=[];
  for(const [id,event] of this.owners.get(owner)||[]){if(BigInt(id)<=cursor)continue;items.push(event);if(items.length>limit)break;}
  const more=items.length>limit;items.length=Math.min(items.length,limit);
  return validateNotificationBatch({profile:NOTIFICATION_PROFILE,version:NOTIFICATION_VERSION,journal_id:this.journalId,items:structuredClone(items),next_cursor:more?items.at(-1).id:String(this.sequence),latest_cursor:String(this.sequence),has_more:more,resync_required:cursor<this.floor,reconcile_url:'/v1/jobs/get',retention:{max_days:Math.ceil(this.maxAgeSeconds/86400),max_events:this.maxEvents,max_age_seconds:this.maxAgeSeconds,durability:'process'},delivery:'at_least_once_with_cursor; deduplicate event IDs',checked_at:new Date().toISOString(),result_verification:'Read owned job, download/hash-check output and verify its receipt'},{after});
 }
 handles(path){return path===this.inboxPath||path===this.inboxPath+'/events';}
 handle(req,res,{caller,authorized=()=>true}={}){
  const json=(status,value)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store',...(status===401?{'www-authenticate':'Bearer'}:{})});res.end(JSON.stringify(value));};
  try{
   if(!caller)throw Object.assign(new ProtocolError('unauthenticated','Caller bearer authentication required'),{status:401});
   if(this.closed)throw Object.assign(new ProtocolError('provider_unavailable','Notification journal closed',{},true),{status:503});
   const url=new URL(req.url,'http://local.invalid'),stream=url.pathname===this.inboxPath+'/events';
   if(req.method!=='GET')throw Object.assign(new ProtocolError('invalid_request','Notification routes require GET'),{status:405});
   if([...url.searchParams.keys()].some(k=>!['after','limit','journal_id'].includes(k))||[...new Set(url.searchParams.keys())].some(k=>url.searchParams.getAll(k).length>1)||stream&&url.searchParams.has('limit'))throw new ProtocolError('invalid_request','Invalid notification query');
   const header=req.headers['last-event-id'],query=url.searchParams.get('after');
   if(header&&query&&header!==query)throw new ProtocolError('invalid_request','Conflicting notification cursors');
   let cursor=header??query??'0';const options={after:cursor,limit:Number(url.searchParams.get('limit')??50),journalId:url.searchParams.get('journal_id')??this.journalId};
   const initial=this.read(caller,options);if(!stream)return json(200,initial);
   const count=[...this.streams.values()].reduce((sum,set)=>sum+set.size,0);
   if(count>=this.maxStreams||(this.streams.get(caller)?.size??0)>=this.maxStreamsPerOwner)throw Object.assign(new ProtocolError('rate_limited','Notification stream budget reached',{},true,1000),{status:503});
   res.writeHead(200,{'content-type':'text/event-stream','cache-control':'no-store','x-accel-buffering':'no'});res.flushHeaders();
   let stopped=false,blocked=false,timer,dirty=true;const started=Date.now();
   const cleanup=()=>{if(stopped)return;stopped=true;clearInterval(heartbeat);clearTimeout(timer);res.off('drain',flush);const set=this.streams.get(caller);set?.delete(connection);if(!set?.size)this.streams.delete(caller);};
   const stop=()=>{cleanup();res.end();};
   const flush=()=>{
    if(stopped||res.destroyed){cleanup();return;}
    if(!authorized()){if(!blocked)res.write('event: auth_expired\ndata: {"action":"renew_token_and_resume_from_last_event_id"}\n\n');stop();return;}
    if(blocked)return;
    try{
     const batch=this.read(caller,{...options,after:cursor});dirty=false;
     blocked=!res.write(`retry: 1000\nid: ${batch.next_cursor}\nevent: inbox\ndata: ${JSON.stringify(batch)}\n\n`);cursor=batch.next_cursor;
     if(blocked)res.once('drain',()=>{blocked=false;flush();});
     else if(batch.has_more){dirty=true;timer=setTimeout(()=>{timer=null;flush();},0);}
    }catch{stop();}
   };
   const connection={stop,changed:()=>{dirty=true;if(!timer&&!blocked)timer=setTimeout(()=>{timer=null;flush();},250);}};
   let set=this.streams.get(caller);if(!set){set=new Set();this.streams.set(caller,set);}set.add(connection);
   const heartbeat=setInterval(()=>{if(Date.now()-started>1800000)return stop();if(!authorized())return flush();if(!blocked&&!dirty){blocked=!res.write(': keepalive\n\n');if(blocked)res.once('drain',()=>{blocked=false;flush();});}},1000);heartbeat.unref();
   req.once('aborted',cleanup);res.once('close',cleanup);flush();
  }catch(error){json(error.status??400,{code:error.code??'invalid_request',message:error.message,retryable:error.retryable??false,...(error.retryAfterMs?{retry_after_ms:error.retryAfterMs}:{})});}
 }
 close(){this.closed=true;for(const set of [...this.streams.values()])for(const stream of [...set])stream.stop();this.streams.clear();}
}

async function boundedJSON(response){
 let size=0;const chunks=[];
 for await(const chunk of response.body){size+=chunk.length;if(size>1048576)throw new ProtocolError('invalid_request','Notification response exceeds limit');chunks.push(chunk);}
 const data=parseJSON(Buffer.concat(chunks));if(!response.ok)throw Object.assign(new Error(data.message??data.payload?.message??'Notification request failed'),data,{status:response.status});return data;
}
const pause=(ms,signal)=>new Promise(done=>{const timer=setTimeout(finish,ms);function finish(){clearTimeout(timer);signal?.removeEventListener('abort',finish);done();}if(signal?.aborted)finish();else signal?.addEventListener('abort',finish,{once:true});});
export class NotificationClient {
 constructor(descriptor,{token,getToken,renewToken,allowLoopback=false,origin}={}){
  this.descriptor=structuredClone(validateNotificationDescriptor(descriptor));this.getToken=getToken??(()=>token);this.renewToken=renewToken;
  for(const key of ['inbox_url','events_url']){const endpoint=checkEndpoint(descriptor.http[key],{allowLoopback});if(endpoint.origin!==(origin??new URL(descriptor.http.inbox_url).origin))throw new ProtocolError('forbidden','Notification endpoint changes the authorized origin');}
 }
 async snapshot({after='0',limit=50,journalId=this.descriptor.journal_id,signal}={}){
  notificationCursor(after);const url=new URL(this.descriptor.http.inbox_url);url.search=new URLSearchParams({after,limit:String(limit),journal_id:journalId});
  const data=await boundedJSON(await fetch(url,{headers:{authorization:'Bearer '+await this.getToken()},redirect:'error',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(10000)]):AbortSignal.timeout(10000)}));
  return validateNotificationBatch(data,{descriptor:this.descriptor,after});
 }
 async *subscribe({after='0',journalId=this.descriptor.journal_id,signal}={}){
  notificationCursor(after);if(journalId!==this.descriptor.journal_id)throw new ProtocolError('state_conflict','Saved journal differs from discovery; reconcile before resetting');
  let cursor=after,delay=500;
  while(!signal?.aborted){
   const controller=new AbortController(),combined=signal?AbortSignal.any([signal,controller.signal]):controller.signal;
   let reader,timer=setTimeout(()=>controller.abort(),10000);
   try{
    const url=new URL(this.descriptor.http.events_url);url.search=new URLSearchParams({journal_id:journalId});
    const response=await fetch(url,{headers:{authorization:'Bearer '+await this.getToken(),'last-event-id':cursor,accept:'text/event-stream'},redirect:'error',signal:combined});clearTimeout(timer);
    if(!response.ok)await boundedJSON(response);
    if(!response.headers.get('content-type')?.startsWith('text/event-stream'))throw new ProtocolError('invalid_request','Expected notification SSE');
    reader=response.body.getReader();const decoder=new TextDecoder();let buffer='';
    while(!combined.aborted){
     timer=setTimeout(()=>controller.abort(),45000);const {value,done}=await reader.read();clearTimeout(timer);if(done)break;
     buffer=(buffer+decoder.decode(value,{stream:true})).replaceAll('\r\n','\n');if(buffer.length>1048576)throw new ProtocolError('invalid_request','Notification frame exceeds limit');
     let end;
     while((end=buffer.indexOf('\n\n'))>=0){
      const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);const fields=Object.fromEntries(frame.split('\n').filter(l=>!l.startsWith(':')&&l.includes(':')).map(l=>{const i=l.indexOf(':');return [l.slice(0,i),l.slice(i+1).trimStart()];}));
      if(fields.event==='auth_expired'){if(!this.renewToken)throw Object.assign(new Error('Token expired; runtime must renew and reconnect'),{status:401});await this.renewToken();controller.abort();break;}
      if(fields.event!=='inbox')continue;
      const batch=validateNotificationBatch(parseJSON(fields.data),{descriptor:this.descriptor,after:cursor});if(fields.id!==batch.next_cursor)throw new ProtocolError('invalid_request','SSE ID differs from batch cursor');
      delay=500;yield {...batch,transport:'sse'};cursor=batch.next_cursor;
     }
    }
   }catch(error){
    if(signal?.aborted)break;
    if(error instanceof ProtocolError)throw error;
    if(error.status===401&&this.renewToken)await this.renewToken();
    else if(error.status&&![429,502,503,504].includes(error.status))throw error;
    else if(!error.status&&!['AbortError','TimeoutError'].includes(error.name)&&!(error instanceof TypeError))throw error;
    try{const batch=await this.snapshot({after:cursor,journalId,signal});yield {...batch,transport:'snapshot'};cursor=batch.next_cursor;}
    catch(fallback){if(fallback instanceof ProtocolError||fallback.status&&![429,502,503,504].includes(fallback.status))throw fallback;}
   }finally{clearTimeout(timer);controller.abort();await reader?.cancel().catch(()=>{});reader?.releaseLock();}
   if(signal?.aborted)break;await pause(delay,signal);delay=Math.min(10000,delay*2);
  }
 }
}
