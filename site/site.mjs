const base = document.documentElement.dataset.base;
const dialog = document.querySelector('#search-dialog');
const input = document.querySelector('#search-input');
const results = document.querySelector('#search-results');
let index;
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
async function search() {
  try {
    index ??= await fetch(base + 'search-index.json').then(r => { if (!r.ok) throw new Error(); return r.json(); });
    const words = input.value.trim().toLowerCase().split(' ').filter(Boolean);
    if (!words.length) { results.innerHTML = '<div class="search-hint">Search the specification, implementation guide, and contracts.</div>'; return; }
    const found = index.filter(item => words.every(w => (item.title + ' ' + item.text).toLowerCase().includes(w))).sort((a,b) => Number(b.title.toLowerCase().includes(words[0])) - Number(a.title.toLowerCase().includes(words[0]))).slice(0,8);
    results.innerHTML = found.length ? found.map(item => `<a href="${escape(base + item.path)}"><strong>${escape(item.title)}</strong><p>${escape(item.text.slice(0,130))}…</p></a>`).join('') : '<div class="search-hint">No chapters match. Try an operation name such as artifact, receipt, or policy.</div>';
  } catch { results.innerHTML = '<div class="search-hint">Search could not load. Use the specification navigation to browse.</div>'; }
}
function openSearch() { if (!dialog.open) dialog.showModal(); input.focus(); search(); }
document.querySelectorAll('.search-open').forEach(button => button.addEventListener('click', openSearch));
document.querySelector('.search-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
input.addEventListener('input', search);
document.addEventListener('keydown', e => { if (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); openSearch(); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && dialog.open) { e.preventDefault(); dialog.close(); } });
const nav = document.querySelector('.nav'), menu = document.querySelector('.menu-button');
menu.addEventListener('click', () => { const opened = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(opened)); });
const side = document.querySelector('.sidebar'); if (side && window.matchMedia('(max-width:800px)').matches) side.removeAttribute('open');
document.querySelectorAll('.copy').forEach(button => button.addEventListener('click', async () => { try { await navigator.clipboard.writeText(button.parentElement.querySelector('code').textContent); button.textContent = 'Copied'; } catch { button.textContent = 'Select code'; } setTimeout(() => button.textContent = 'Copy', 1500); }));
