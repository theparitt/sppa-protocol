import { readerPages } from './build-reader-pages.mjs';
import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import { resolve, join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked, Renderer } from 'marked';
import { templates, escape } from '../site/templates.mjs';
import { createHash } from 'node:crypto';
import { featureCatalog, categories } from '../site/features.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'dist');
if (resolve(dirname(out)) !== resolve(root) || basename(out) !== 'dist') throw new Error('Unsafe build output path');
const B = process.env.BASE_PATH ?? '/sppa-protocol/';
if (!B.startsWith('/') || !B.endsWith('/') || B.includes('..')) throw new Error('BASE_PATH must start/end with /');
const docs = [
 ['overview','Core overview','The model, requirements and release scope.'],
 ['messages','Messages & versions','A typed envelope and exact compatibility rules.'],
 ['discovery','Discovery & capabilities','Find providers and understand their contracts.'],
 ['policy','Policy & eligibility','Hard rules before ranking or execution.'],
 ['admission','Capacity & admission','Provider-owned limits, live load and backpressure.'],
 ['jobs','Invocation & jobs','Admission, deadlines, cancellation and retries.'],
 ['artifacts','Artifacts & transfer','Immutable references and verified data movement.'],
 ['security','Security & receipts','Identity, canonical signatures and execution evidence.'],
 ['errors','Errors & monitoring','Structured failure and truthful provider health.'],
 ['quickstart','Implementation guide','Build and run one working reference SPPA.'],
 ['conformance','Conformance','Check shape, behavior and interoperability.'],
 ['governance','Status & governance','Draft process, contribution and staged roadmap.'],
];
const assetSources = await Promise.all(['site/style.css', 'site/site.mjs'].map(path => readFile(join(root,path))));
const assetVersion = createHash('sha256').update(Buffer.concat(assetSources)).digest('hex').slice(0,12);
const { page, sidebar, home, documents, link, repository, origin } = templates(B, docs, '0.1.1', assetVersion);
await rm(out,{recursive:true,force:true}); await mkdir(out,{recursive:true});
async function put(path, body) { const target=join(out,path); await mkdir(dirname(target),{recursive:true});if(path.endsWith('.html'))body=body.replaceAll('href="/sppa-protocol/','href="'+B).replaceAll('src="/sppa-protocol/','src="'+B);await writeFile(target,body); }
const entries=[],archivePaths=[];
for (const V of ['0.1.0','0.1.1']) {
 const sourceNames = new Set(await readdir(join(root,`spec/${V}`)));
 const versionDocs = docs.filter(([slug])=>sourceNames.has(slug+'.md'));
 const { page, sidebar, link } = templates(B, versionDocs, V, assetVersion);
 for(const [i,[slug,title]] of versionDocs.entries()) {
 const text=await readFile(join(root,`spec/${V}/${slug}.md`),'utf8');
 const headings=[],seen=new Map(),renderer=new Renderer();
 renderer.heading=token=>{const clean=token.text.replaceAll('`','').replaceAll('*','');let id=clean.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const times=seen.get(id)??0;seen.set(id,times+1);if(times)id+='-'+times;if(token.depth===2)headings.push([id,clean]);return `<h${token.depth} id="${id}">${escape(clean)}</h${token.depth}>`;};
 renderer.code=token=>`<div class="code-block"><div class="code-label">${escape(token.lang||'EXAMPLE')}</div><button type="button" class="copy" aria-label="Copy code example">Copy</button><pre><code>${escape(token.text)}</code></pre></div>`;
 let html=marked.parse(text,{renderer});html=html.replaceAll('<table>','<div class="table-wrap"><table>').replaceAll('</table>','</table></div>');
 const turns=`<div class="page-turn">${i?`<a href="${link(versionDocs[i-1][0])}">← ${escape(versionDocs[i-1][1])}</a>`:'<span></span>'}${i<versionDocs.length-1?`<a href="${link(versionDocs[i+1][0])}">${escape(versionDocs[i+1][1])} →</a>`:`<a href="${B}schemas/">Schemas & API →</a>`}</div>`;
 const body=`<div class="doc-layout">${sidebar(slug)}<main class="doc-body" id="main"><div class="breadcrumb">Specification / Core ${V}</div><span class="doc-status">WORKING DRAFT</span><article class="prose">${html}</article>${turns}</main><aside class="toc" aria-label="On this page"><strong>ON THIS PAGE</strong>${headings.map(([id,label])=>`<a href="#${id}">${escape(label)}</a>`).join('')}</aside></div>`;
 const path=`spec/${V}/${slug}/`;await put(path+'index.html',page(title,body,slug==='conformance'?'conformance':'spec',path));
 if(V==='0.1.1') entries.push({title,path,text:text.replace(/[#*`>|]/g,'').replace(/\s+/g,' ').trim()}); else archivePaths.push(path);
 }
}
await put('index.html',page('Software capabilities for AI',home(),'home'));
await put('features/index.html',page('Protocol features',featureCatalog(B),'features','features/'));
entries.push({title:'Protocol features',path:'features/',text:categories.map(g=>[g.title,g.owner,...g.items.map(x=>x.name+' '+x.description+' '+(x.reference?'Reference':x.experimental?'Experimental':'Planned'))].join(' ')).join(' ')});
await put('documents/index.html',page('SPPA Protocol Suite',documents(),'documents','documents/'));
entries.push({title:'SPPA Protocol Suite',path:'documents/',text:'Published Core 0.1.1 reference document index, specifications, schemas and version history. Earlier HTTP proof; semantic decision standard is transport independent.'});
for (const [slug,title] of [['concept','SPPA Concept'],['architecture','Architecture & execution bindings'],['decision-contract','AI Decision Contract'],['runtime-status','Runtime Status & Capacity'],['decision-layers','Decision Information Layers (historical)'],['feature-groups','SPPA Feature Groups'],['job-notifications','Job Notifications']]) {
 const notified=slug==='job-notifications',layered=slug==='decision-layers',grouped=slug==='feature-groups';
 const text = await readFile(join(root,notified?'spec/job-notifications/0.1.0-draft.1.md':grouped?'spec/feature-groups/0.1.0-draft.1.md':layered?'spec/decision-layers/0.1.0-draft.1.md':`design/${slug}.md`),'utf8');
 const renderer = new Renderer();
 const headings = [];
 renderer.heading = token => { const label=token.text.replaceAll('`','').replaceAll('*','');const id=label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');if(token.depth===2)headings.push([id,label]);return `<h${token.depth} id="${id}">${escape(label)}</h${token.depth}>`; };
 renderer.code = token => `<div class="code-block"><div class="code-label">${escape(token.lang||'EXAMPLE')}</div><button type="button" class="copy" aria-label="Copy code example">Copy</button><pre><code>${escape(token.text)}</code></pre></div>`;
 const html=marked.parse(text,{renderer}).replaceAll('<table>','<div class="table-wrap"><table>').replaceAll('</table>','</table></div>');
 const path=notified?'spec/job-notifications/0.1.0-draft.1/':grouped?'spec/feature-groups/0.1.0-draft.1/':layered?'spec/decision-layers/0.1.0-draft.1/':`design/${slug}/`;
 const body=`<div class="doc-layout">${sidebar(slug)}<main class="doc-body" id="main"><div class="breadcrumb">${notified?'Optional extension / Job Notifications 0.1.0-draft.1':grouped?'Proposed specification / Eight Feature Groups 0.1.0-draft.1':layered?'Historical specification / Decision Information Layers 0.1.0-draft.1':'Design direction / Transport-independent semantic and decision contracts'}</div><article class="prose">${layered?`<div class="note">Historical six-layer model. The current <a href="${B}spec/feature-groups/0.1.0-draft.1/">eight-group specification</a> supersedes this classification; the original document is retained.</div>`:''}${html}</article></main><aside class="toc" aria-label="On this page"><strong>ON THIS PAGE</strong>${headings.map(([id,label])=>`<a href="#${id}">${escape(label)}</a>`).join('')}</aside></div>`;
 await put(path+'index.html',page(title,body,grouped?'groups':layered?'layers':slug==='concept'?'concept':'design',path));
 entries.push({title,path,text:text.replace(/[#*`>|]/g,'').replace(/\s+/g,' ').trim()});
}
const files=(await readdir(join(root,'schemas/0.1.1'))).filter(x=>x.endsWith('.json')).sort();
const rows=files.map(file=>`<div class="schema-row"><div><strong>${escape(file)}</strong><small>JSON Schema 2020-12 · Draft 0.1.1</small></div><a href="${B}schemas/0.1.1/${file}" download>Download JSON ↓</a></div>`).join('');
const schemaBody=`<div class="doc-layout">${sidebar('schemas')}<main class="doc-body" id="main"><div class="breadcrumb">Machine contracts / Core 0.1.1</div><span class="doc-status">WORKING DRAFT</span><article class="prose"><h1>Schemas & API</h1><p>Versioned contracts for validation and interoperability. Use the schemas with the normative chapters; a schema alone cannot prove authorization or execution semantics.</p><div class="actions"><a class="button primary" href="${B}schemas/0.1.1/bundle.json" download>Download schema bundle ↓</a><a class="button" href="${B}openapi/0.1.1.json" download>OpenAPI 3.1.1 ↓</a></div><div class="note">Draft snapshot: pin a repository commit during review. Later protocol families and advanced transfer profiles are not implemented.</div><h2>Optional extensions</h2><p><a href="${B}spec/job-notifications/0.1.0-draft.1/">Job notifications 0.1.0-draft.1</a> &middot; <a href="${B}openapi/job-notifications/0.1.0-draft.1.json">API binding</a> &middot; <a href="${B}schemas/job-notifications/0.1.0-draft.1/descriptor.schema.json">Discovery schema</a></p><h2>Core schemas</h2><div class="schema-list">${rows}</div><h2>Examples and discovery</h2><p><a href="${B}examples/manifest.json">Provider manifest</a> · <a href="${B}examples/job-create.json">Typed invocation</a> · <a href="${B}examples/artifact.json">Artifact metadata</a> · <a href="${B}.well-known/sppa.json">Specification catalog</a> · <a href="${B}schemas/index.json">Schema index</a></p><p>Previous draft: <a href="${B}spec/0.1.0/overview/">0.1.0 chapters</a> &middot; <a href="${B}schemas/0.1.0/bundle.json" download>0.1.0 schema bundle</a> &middot; <a href="${B}openapi/0.1.0.json" download>0.1.0 API binding</a></p><h2>Offline validation</h2><div class="code-block"><div class="code-label">SHELL</div><button type="button" class="copy" aria-label="Copy validation command">Copy</button><pre><code>npm ci\nnpm run validate -- manifest examples/manifest.json</code></pre></div><p>The validator loads local schemas. No remote fetch is needed. The bundle embeds schema resources with their canonical IDs.</p></article></main></div>`;
await put('schemas/index.html',page('Schemas & API',schemaBody,'schemas','schemas/'));
entries.push({title:'Schemas & API',path:'schemas/',text:'Download JSON Schema 2020-12 bundle, OpenAPI 3.1.1, examples, manifest, artifact and protocol catalog.'});
await cp(join(root,'schemas/0.1.0'),join(out,'schemas/0.1.0'),{recursive:true});
const oldFiles=(await readdir(join(root,'schemas/0.1.0'))).filter(x=>x.endsWith('.json')).sort();
const oldBundle={$schema:'https://json-schema.org/draft/2020-12/schema',$id:origin+B+'schemas/0.1.0/bundle.json',title:'SPPA Core schema bundle',$defs:{}};
for(const file of oldFiles)oldBundle.$defs[file.replace('.schema.json','')]=JSON.parse(await readFile(join(root,'schemas/0.1.0',file)));
await put('schemas/0.1.0/bundle.json',JSON.stringify(oldBundle,null,2));
await cp(join(root,'schemas/0.1.1'),join(out,'schemas/0.1.1'),{recursive:true});
const bundle={$schema:'https://json-schema.org/draft/2020-12/schema',$id:origin+B+'schemas/0.1.1/bundle.json',title:'SPPA Core schema bundle',$defs:{}};
for(const file of files)bundle.$defs[file.replace('.schema.json','')]=JSON.parse(await readFile(join(root,'schemas/0.1.1',file)));
await put('schemas/0.1.1/bundle.json',JSON.stringify(bundle,null,2));
await put('schemas/index.json',JSON.stringify({sppa:'0.1.1',status:'working-draft',extensions:[{profile:'sppa.job_notifications',version:'0.1.0-draft.1',descriptor:origin+B+'schemas/job-notifications/0.1.0-draft.1/descriptor.schema.json',specification:origin+B+'spec/job-notifications/0.1.0-draft.1/',openapi:origin+B+'openapi/job-notifications/0.1.0-draft.1.json'}],schemas:files.map(file=>({name:file,url:origin+B+'schemas/0.1.1/'+file})),bundle:origin+B+'schemas/0.1.1/bundle.json'},null,2));
await cp(join(root,'schemas/job-notifications'),join(out,'schemas/job-notifications'),{recursive:true});
await cp(join(root,'schemas/runtime-status'),join(out,'schemas/runtime-status'),{recursive:true});
await cp(join(root,'openapi'),join(out,'openapi'),{recursive:true});await cp(join(root,'examples'),join(out,'examples'),{recursive:true});
await mkdir(join(out,'assets'));await mkdir(join(out,'assets/illustrations'));for(const file of (await readdir(join(root,'site/illustrations'))).filter(file=>file.endsWith('.png')))await cp(join(root,'site/illustrations',file),join(out,'assets/illustrations',file));await cp(join(root,'site/style.css'),join(out,'assets/style.css'));await cp(join(root,'site/site.mjs'),join(out,'assets/site.mjs'));
await put('.well-known/sppa.json',JSON.stringify({sppa:'0.1.1',kind:'specification',status:'working-draft',title:'SPPA Core',specification:origin+link('overview'),schemas:origin+B+'schemas/index.json',openapi:origin+B+'openapi/0.1.1.json',conformance:origin+link('conformance'),repository},null,2));
await readerPages({root,B,page,put,entries});
await put('search-index.json',JSON.stringify(entries));
await put('favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#fff"/><path d="M8 8h6v6H8zm10 0h6v6h-6zM8 18h6v6H8zm10 0h6v6h-6z" fill="#333"/></svg>');
await put('.nojekyll','');await put('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin+B}sitemap.xml\n`);
await put('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['',...entries.map(x=>x.path),...archivePaths].map(path=>`<url><loc>${origin+B+path}</loc></url>`).join('')}</urlset>`);
await put('404.html',page('Page not found',`<main id="main" class="wrap section"><h1>Page not found</h1><p>This chapter may have moved. Browse the current draft or search the documentation.</p><a class="button" href="${link('overview')}">Read Core 0.1.1 →</a></main>`,'','404.html'));
console.log(`Built ${docs.length+18} current and ${archivePaths.length} archived pages, ${files.length} schemas, OpenAPI, search and discovery at ${B}`);
