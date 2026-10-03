import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import { resolve, join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked, Renderer } from 'marked';
import { templates, escape } from '../site/templates.mjs';
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
 ['jobs','Invocation & jobs','Admission, deadlines, cancellation and retries.'],
 ['artifacts','Artifacts & transfer','Immutable references and verified data movement.'],
 ['security','Security & receipts','Identity, canonical signatures and execution evidence.'],
 ['errors','Errors & monitoring','Structured failure and truthful provider health.'],
 ['quickstart','Implementation guide','Build and run one working reference SPPA.'],
 ['conformance','Conformance','Check shape, behavior and interoperability.'],
 ['governance','Status & governance','Draft process, contribution and staged roadmap.'],
];
const { page, sidebar, home, link, repository, origin } = templates(B, docs);
await rm(out,{recursive:true,force:true}); await mkdir(out,{recursive:true});
async function put(path, body) { const target=join(out,path); await mkdir(dirname(target),{recursive:true});await writeFile(target,body); }
const entries=[];
for(const [i,[slug,title]] of docs.entries()) {
 const text=await readFile(join(root,`spec/0.1.0/${slug}.md`),'utf8');
 const headings=[],seen=new Map(),renderer=new Renderer();
 renderer.heading=token=>{const clean=token.text.replaceAll('`','').replaceAll('*','');let id=clean.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const times=seen.get(id)??0;seen.set(id,times+1);if(times)id+='-'+times;if(token.depth===2)headings.push([id,clean]);return `<h${token.depth} id="${id}">${escape(clean)}</h${token.depth}>`;};
 renderer.code=token=>`<div class="code-block"><div class="code-label">${escape(token.lang||'EXAMPLE')}</div><button type="button" class="copy" aria-label="Copy code example">Copy</button><pre><code>${escape(token.text)}</code></pre></div>`;
 let html=marked.parse(text,{renderer});html=html.replaceAll('<table>','<div class="table-wrap"><table>').replaceAll('</table>','</table></div>');
 const turns=`<div class="page-turn">${i?`<a href="${link(docs[i-1][0])}">← ${escape(docs[i-1][1])}</a>`:'<span></span>'}${i<docs.length-1?`<a href="${link(docs[i+1][0])}">${escape(docs[i+1][1])} →</a>`:`<a href="${B}schemas/">Schemas & API →</a>`}</div>`;
 const body=`<div class="doc-layout">${sidebar(slug)}<main class="doc-body" id="main"><div class="breadcrumb">Specification / Core 0.1.0</div><span class="doc-status">WORKING DRAFT</span><article class="prose">${html}</article>${turns}</main><aside class="toc" aria-label="On this page"><strong>ON THIS PAGE</strong>${headings.map(([id,label])=>`<a href="#${id}">${escape(label)}</a>`).join('')}</aside></div>`;
 const path=`spec/0.1.0/${slug}/`;await put(path+'index.html',page(title,body,slug==='conformance'?'conformance':'spec',path));
 entries.push({title,path,text:text.replace(/[#*`>|]/g,'').replace(/\s+/g,' ').trim()});
}
await put('index.html',page('Open contracts for specialized software',home(),'home'));
const files=(await readdir(join(root,'schemas/0.1.0'))).filter(x=>x.endsWith('.json')).sort();
const rows=files.map(file=>`<div class="schema-row"><div><strong>${escape(file)}</strong><small>JSON Schema 2020-12 · Draft 0.1.0</small></div><a href="${B}schemas/0.1.0/${file}" download>Download JSON ↓</a></div>`).join('');
const schemaBody=`<div class="doc-layout">${sidebar('schemas')}<main class="doc-body" id="main"><div class="breadcrumb">Machine contracts / Core 0.1.0</div><span class="doc-status">WORKING DRAFT</span><article class="prose"><h1>Schemas & API</h1><p>Versioned contracts for validation and interoperability. Use the schemas with the normative chapters; a schema alone cannot prove authorization or execution semantics.</p><div class="actions"><a class="button primary" href="${B}schemas/0.1.0/bundle.json" download>Download schema bundle ↓</a><a class="button" href="${B}openapi/0.1.0.json" download>OpenAPI 3.1.1 ↓</a></div><div class="note">Draft snapshot: pin a repository commit during review. Later protocol families and advanced transfer profiles are not implemented.</div><h2>Core schemas</h2><div class="schema-list">${rows}</div><h2>Examples and discovery</h2><p><a href="${B}examples/manifest.json">Provider manifest</a> · <a href="${B}examples/job-create.json">Typed invocation</a> · <a href="${B}examples/artifact.json">Artifact metadata</a> · <a href="${B}.well-known/sppa.json">Specification catalog</a> · <a href="${B}schemas/index.json">Schema index</a></p><h2>Offline validation</h2><div class="code-block"><div class="code-label">SHELL</div><button type="button" class="copy" aria-label="Copy validation command">Copy</button><pre><code>npm ci\nnpm run validate -- manifest examples/manifest.json</code></pre></div><p>The validator loads local schemas. No remote fetch is needed. The bundle embeds schema resources with their canonical IDs.</p></article></main></div>`;
await put('schemas/index.html',page('Schemas & API',schemaBody,'schemas','schemas/'));
entries.push({title:'Schemas & API',path:'schemas/',text:'Download JSON Schema 2020-12 bundle, OpenAPI 3.1.1, examples, manifest, artifact and protocol catalog.'});
await cp(join(root,'schemas/0.1.0'),join(out,'schemas/0.1.0'),{recursive:true});
const bundle={$schema:'https://json-schema.org/draft/2020-12/schema',$id:origin+B+'schemas/0.1.0/bundle.json',title:'SPPA Core schema bundle',$defs:{}};
for(const file of files)bundle.$defs[file.replace('.schema.json','')]=JSON.parse(await readFile(join(root,'schemas/0.1.0',file)));
await put('schemas/0.1.0/bundle.json',JSON.stringify(bundle,null,2));
await put('schemas/index.json',JSON.stringify({sppa:'0.1.0',status:'working-draft',schemas:files.map(file=>({name:file,url:origin+B+'schemas/0.1.0/'+file})),bundle:origin+B+'schemas/0.1.0/bundle.json'},null,2));
await cp(join(root,'openapi'),join(out,'openapi'),{recursive:true});await cp(join(root,'examples'),join(out,'examples'),{recursive:true});
await mkdir(join(out,'assets'));await cp(join(root,'site/style.css'),join(out,'assets/style.css'));await cp(join(root,'site/site.mjs'),join(out,'assets/site.mjs'));
await put('.well-known/sppa.json',JSON.stringify({sppa:'0.1.0',kind:'specification',status:'working-draft',title:'SPPA Core',specification:origin+link('overview'),schemas:origin+B+'schemas/index.json',openapi:origin+B+'openapi/0.1.0.json',conformance:origin+link('conformance'),repository},null,2));
await put('search-index.json',JSON.stringify(entries));
await put('favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#f2f6ed"/><path d="M8 8h6v6H8zm10 0h6v6h-6zM8 18h6v6H8z" fill="#17281e"/><path d="M18 18h6v6h-6z" fill="#3b9b6b"/></svg>');
await put('.nojekyll','');await put('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin+B}sitemap.xml\n`);
await put('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['',...entries.map(x=>x.path)].map(path=>`<url><loc>${origin+B+path}</loc></url>`).join('')}</urlset>`);
await put('404.html',page('Page not found',`<main id="main" class="wrap section"><h1>Page not found</h1><p>This chapter may have moved. Browse the current draft or search the documentation.</p><a class="button" href="${link('overview')}">Read Core 0.1.0 →</a></main>`,'','404.html'));
console.log(`Built ${docs.length+2} pages, ${files.length} schemas, OpenAPI, search and discovery at ${B}`);
