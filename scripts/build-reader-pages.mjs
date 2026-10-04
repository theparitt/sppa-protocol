import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { marked, Renderer } from 'marked';
import { escape } from '../site/templates.mjs';
export async function readerPages({ root, B, page, put, entries }) {
 const routes=[
  ['why','Why SPPA?','why.md'],
  ['paper','SPPA Position Paper','position-paper.md'],
  ['paper/0.1-draft.1','SPPA Position Paper · 0.1-draft.1','position-paper.md'],
  ['spec','SPPA Specification','specification-index.md'],
  ['architecture','SPPA and Hub architecture','architecture-overview.md'],
  ['examples','Examples and implementation evidence','examples.md'],
  ['conformance','Conformance and tests','conformance-index.md'],
  ['github','Source and discussions','source-index.md'],
 ];
 const mapping=Object.fromEntries(routes.map(([path,,file])=>[file,path+'/']));
 mapping['position-paper.md']='paper/';
 const links={
  '../design/concept.md':'design/concept/',
  '../design/architecture.md':'design/architecture/',
  '../design/decision-contract.md':'design/decision-contract/',
  '../design/runtime-status.md':'design/runtime-status/',
  '../spec/feature-groups/0.1.0-draft.1.md':'spec/feature-groups/0.1.0-draft.1/',
 };
 for(const [slug,title,file] of routes){
  const text=await readFile(join(root,'docs',file),'utf8');
  const headings=[],seen=new Map(),renderer=new Renderer();
  renderer.heading=token=>{const label=token.text.replace(/[`*]/g,'');let id=label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const n=seen.get(id)??0;seen.set(id,n+1);if(n)id+='-'+n;if(token.depth===2)headings.push([id,label]);return `<h${token.depth} id="${id}">${thisLabel(token)}</h${token.depth}>`;};
  const thisLabel=token=>escape(token.text.replace(/[`*]/g,''));
  renderer.link=function(token){let href=links[token.href]??mapping[token.href];if(!href && token.href.startsWith('../spec/0.1.1/'))href=token.href.slice(3).replace(/\.md$/,'/');if(href)href=B+href;else href=token.href==='private-launch-plan.md'?'https://github.com/theparitt/sppa-protocol/blob/main/docs/private-launch-plan.md':token.href;return `<a href="${escape(href)}">${this.parser.parseInline(token.tokens)}</a>`;};
  renderer.code=token=>`<div class="code-block"><div class="code-label">${escape(token.lang||'EXAMPLE')}</div><button type="button" class="copy" aria-label="Copy code example">Copy</button><pre><code>${escape(token.text)}</code></pre></div>`;
  const html=marked.parse(text,{renderer}).replaceAll('<table>','<div class="table-wrap"><table>').replaceAll('</table>','</table></div>');
  const paper=slug.startsWith('paper'),path=slug+'/';
  const body=`<div class="reader-layout"><main id="main" class="reader-body"><div class="breadcrumb">${paper?'Position Paper / 0.1-draft.1':escape(title)}</div><article class="prose">${html}</article><div class="reader-next"><a href="${B}why/">Why SPPA?</a><a href="${B}paper/">Read the Paper</a><a href="${B}spec/">Specification</a></div>${paper?`<p class="caption">Edition 0.1-draft.1 · <a href="${B}paper/0.1-draft.1/">Versioned page</a> · <a href="${B}paper/0.1-draft.1.md" download>Markdown source</a></p>`:''}</main><aside class="toc" aria-label="On this page"><strong>ON THIS PAGE</strong>${headings.map(([id,label])=>`<a href="#${id}">${escape(label)}</a>`).join('')}</aside></div>`;
  await put(path+'index.html',page(title,body,paper?'paper':slug==='architecture'?'design':slug,path));
  if(slug==='paper')await put('paper/0.1-draft.1.md',text);
  if(!slug.includes('/'))entries.push({title,path,text:text.replace(/[#*`>|]/g,'').replace(/\s+/g,' ').trim()});
 }
}

