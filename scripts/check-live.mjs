import { readdir } from 'node:fs/promises';
const base = 'https://theparitt.github.io/sppa-protocol/';
const chapters = (await readdir(new URL('../spec/0.1.1/', import.meta.url))).filter(f => f.endsWith('.md')).map(f => `spec/0.1.1/${f.slice(0,-3)}/`);
const schemas = (await readdir(new URL('../schemas/0.1.1/', import.meta.url))).filter(f => f.endsWith('.json')).map(f => 'schemas/0.1.1/' + f);
const paths = ['', 'features/', 'documents/', 'design/concept/', 'design/architecture/', 'design/decision-contract/', 'design/runtime-status/', 'spec/decision-layers/0.1.0-draft.1/', 'schemas/runtime-status/0.1.0-draft.1/snapshot.schema.json', 'schemas/runtime-status/0.1.0-draft.1/heartbeat.schema.json', ...chapters, 'schemas/', ...schemas, 'schemas/0.1.1/bundle.json', 'schemas/index.json', 'openapi/0.1.1.json', '.well-known/sppa.json', 'search-index.json', 'assets/style.css', 'assets/site.mjs', 'favicon.svg', 'sitemap.xml', 'spec/0.1.0/overview/', 'schemas/0.1.0/bundle.json', 'openapi/0.1.0.json'];
async function check(path) {
 for (let attempt = 0; attempt < 5; attempt++) {
  try {
   const response = await fetch(base + path + '?verify=' + Date.now(), { signal: AbortSignal.timeout(15000) });
   if (!response.ok) throw new Error(`HTTP ${response.status}`);
   const text = await response.text();
   if (path === '' && !text.includes('Software capabilities')) throw new Error('Old landing page still published');
   if (path === 'features/' && (!text.includes('96 curated entries') || !text.includes('Planned'))) throw new Error('Feature catalog missing');
   if (path === 'design/architecture/' && !text.includes('Transport-independent semantics')) throw new Error('Architecture missing');
   if (path.endsWith('.json')) {
    const value = JSON.parse(text);
    if (path === '.well-known/sppa.json' && (value.kind !== 'specification' || value.sppa !== '0.1.1')) throw new Error('Invalid specification catalog');
    if (path === 'openapi/0.1.1.json' && value.openapi !== '3.1.1') throw new Error('Invalid API binding');
   } else if ((!path || path.endsWith('/')) && !text.includes('<main')) throw new Error('Missing documentation landmark');
   return;
  } catch (error) {
   if (attempt === 4) throw new Error(`${path || '/'}: ${error.message}`);
   await new Promise(resolve => setTimeout(resolve, 3000));
  }
 }
}
for (let i = 0; i < paths.length; i += 6) await Promise.all(paths.slice(i,i+6).map(check));
console.log(`PASS: ${paths.length} public pages, schemas, APIs, discovery and assets`);
