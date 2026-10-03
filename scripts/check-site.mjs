import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { validate, validateManifest } from '../src/core.mjs';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const base=process.env.BASE_PATH??'/sppa-protocol/';
let checked=0;
async function walk(dir){const files=[];for(const n of await readdir(dir)){const p=join(dir,n);if((await stat(p)).isDirectory())files.push(...await walk(p));else files.push(p);}return files;}
for(const file of (await walk(root)).filter(x=>x.endsWith('.html'))){
 const html=await readFile(file,'utf8');
 if((html.match(/<h1\b/g)||[]).length!==1)throw new Error(`Expected one H1: ${file}`);
 if(!html.includes('id="main"')||!html.includes('lang="en"'))throw new Error(`Missing document landmarks: ${file}`);
 for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const value=m[1];if(value.startsWith('http')||value.startsWith('data:'))continue;
  const u=new URL(value,'https://example.invalid'+base+relative(root,file).replaceAll('\\','/'));
  if(!u.pathname.startsWith(base))throw new Error(`Link escapes site base: ${value}`);
  let target=join(root,decodeURIComponent(u.pathname.slice(base.length)));
  try{if((await stat(target)).isDirectory())target=join(target,'index.html');await stat(target);}catch{throw new Error(`Broken internal link ${value} in ${file}`);}
  if(u.hash){const linked=await readFile(target,'utf8');if(!linked.includes(`id="${decodeURIComponent(u.hash.slice(1))}"`))throw new Error(`Broken anchor ${value} in ${file}`);}
  checked++;
 }
}
const bundle=JSON.parse(await readFile(join(root,'schemas/0.1.1/bundle.json')));
const ajv=new Ajv2020({strict:true,strictRequired:false});addFormats(ajv);ajv.addSchema(bundle);
const invocation=JSON.parse(await readFile(join(root,'examples/job-create.json')));
if(!ajv.getSchema('https://theparitt.github.io/sppa-protocol/schemas/0.1.1/envelope.schema.json')(invocation))throw new Error('Offline schema bundle does not validate the invocation');
const oldBundle=JSON.parse(await readFile(join(root,'schemas/0.1.0/bundle.json')));
const oldAjv=new Ajv2020({strict:true,strictRequired:false});addFormats(oldAjv);oldAjv.addSchema(oldBundle);
const oldInvocation=JSON.parse(await readFile(join(root,'examples/0.1.0/job-create.json')));
if(!oldAjv.getSchema('https://theparitt.github.io/sppa-protocol/schemas/0.1.0/envelope.schema.json')(oldInvocation))throw new Error('Archived bundle no longer validates its original invocation');
if(ajv.getSchema('https://theparitt.github.io/sppa-protocol/schemas/0.1.1/envelope.schema.json')(oldInvocation))throw new Error('Old wire version was silently accepted as 0.1.1');
validate('envelope',invocation);validateManifest(JSON.parse(await readFile(join(root,'examples/manifest.json'))));
const api=JSON.parse(await readFile(join(root,'openapi/0.1.1.json')));
for(const [path,methods] of Object.entries(api.paths))for(const [method,operation] of Object.entries(methods)){
 if(!operation.responses||!operation.operationId)throw new Error(`Incomplete OpenAPI operation ${method} ${path}`);
 if(method==='post'&&!operation.requestBody)throw new Error(`Missing typed request ${path}`);
}
const schemas=new Set(Object.values(bundle.$defs).map(x=>x.$id));
function checkRefs(value){if(!value||typeof value!=='object')return;for(const [k,v]of Object.entries(value)){if(k==='$ref'&&!schemas.has(v.split('#')[0]))throw new Error(`Unknown published OpenAPI reference ${v}`);checkRefs(v);}}
checkRefs(api);
for(const item of JSON.parse(await readFile(join(root,'search-index.json'))))await stat(join(root,item.path,'index.html'));
validate('protocol-catalog',JSON.parse(await readFile(join(root,'.well-known/sppa.json'))));
console.log(`PASS: ${checked} internal links/assets/anchors, page landmarks, offline schema bundle, examples, OpenAPI references and search index`);
