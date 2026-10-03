const base = document.documentElement.dataset.base;
const decisionControls = document.querySelector('#decision-controls');
if (decisionControls) {
  const offers = [
    { id: 'A', cost: 0.18, wait: 38, run: 70, quality: 0.96, samples: 400, privacy: 'confidential', commercial: 'allowed' },
    { id: 'B', cost: 0.04, wait: 2, run: 90, quality: 0.90, samples: 800, privacy: 'confidential', commercial: 'allowed' },
    { id: 'C', cost: 0.01, wait: 0, run: 15, quality: 0.98, samples: 5, privacy: 'public', commercial: 'unknown' },
  ];
  function compareOffers() {
    const budget = Number(document.querySelector('#decision-budget').value);
    const privacy = document.querySelector('#decision-privacy').value;
    const priority = document.querySelector('#decision-priority').value;
    const candidates = offers.map(offer => {
      const reasons = [];
      if (offer.cost > budget) reasons.push('over budget');
      if (privacy === 'confidential' && offer.privacy !== 'confidential') reasons.push('privacy');
      if (offer.commercial !== 'allowed') reasons.push('commercial rights unknown');
      return { ...offer, reasons };
    });
    const metric = o => priority === 'quality' ? -o.quality : priority === 'cost' ? o.cost : o.wait + o.run;
    candidates.sort((a, b) => Number(!!a.reasons.length) - Number(!!b.reasons.length) || metric(a) - metric(b) || a.id.localeCompare(b.id));
    const body = document.querySelector('#decision-offers');
    body.replaceChildren();
    for (const offer of candidates) {
      const row = document.createElement('tr');
      row.dataset.excluded = String(offer.reasons.length > 0);
      const values = [offer.id, `$${offer.cost.toFixed(2)}`, `${offer.wait}s + ${offer.run}s = ${offer.wait + offer.run}s`, `${offer.quality.toFixed(2)} / ${offer.samples} samples`, `${offer.privacy} / commercial ${offer.commercial}`, offer.reasons.length ? 'Excluded: ' + offer.reasons.join('; ') : 'Eligible'];
      values.forEach((value, i) => { const cell = document.createElement(i ? 'td' : 'th'); if (!i) cell.scope = 'row'; cell.textContent = value; row.append(cell); });
      body.append(row);
    }
    const eligible = candidates.filter(o => !o.reasons.length);
    const dimension = priority === 'quality' ? 'highest measured quality' : priority === 'cost' ? 'lowest total cost' : 'shortest estimated completion time';
    document.querySelector('#decision-summary').textContent = eligible.length
      ? `${eligible.length} eligible offer${eligible.length === 1 ? '' : 's'}. ${eligible[0].id} has the ${dimension} among eligible offers. This orders candidates; the main AI makes the final choice.`
      : 'No eligible offers. Relaxing a preference cannot override a failed hard requirement. The agent must change its requirements or find another provider.';
  }
  decisionControls.addEventListener('submit', event => event.preventDefault());
  decisionControls.addEventListener('change', compareOffers);
  compareOffers();
}
document.querySelectorAll('.print-button').forEach(button => button.addEventListener('click', () => window.print()));
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
