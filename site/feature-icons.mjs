// Small, local SVG illustrations; decorative because adjacent headings name each feature.
const drawings = {
 catalog: ['blue','<rect x="7" y="7" width="11" height="11" rx="2"/><rect x="24" y="7" width="11" height="11" rx="2"/><rect x="7" y="24" width="11" height="11" rx="2"/><path d="M25 29h10m-5-5v10"/>'],
 search: ['blue','<rect x="5" y="8" width="22" height="26" rx="3"/><path d="M10 14h10m-10 6h7"/><circle cx="26" cy="26" r="8" fill="var(--icon-paper)"/><path d="m32 32 6 6"/>'],
 decision: ['violet','<rect x="5" y="8" width="13" height="25" rx="3"/><rect x="24" y="8" width="13" height="25" rx="3"/><path d="M9 14h5m14 0h5M9 19h5m14 0h5M9 26l2 2 4-5m13 3h5"/>'],
 pricing: ['amber','<path d="M7 7h21l9 14-16 16L7 23Z"/><circle cx="14" cy="14" r="2"/><path d="M21 17v13m4-11h-5a3 3 0 0 0 0 6h2a3 3 0 0 1 0 6h-5"/>'],
 payment: ['amber','<rect x="5" y="9" width="32" height="24" rx="4"/><path d="M5 17h32m-26 9h6"/><circle cx="33" cy="32" r="8" fill="var(--icon-paper)"/><path d="m29 32 3 3 5-6"/>'],
 identity: ['green','<path d="m21 5 14 5v11c0 9-14 16-14 16S7 30 7 21V10Z"/><circle cx="21" cy="17" r="4"/><path d="M14 28c0-8 14-8 14 0"/>'],
 execution: ['green','<path d="m21 5 14 5v11c0 9-14 16-14 16S7 30 7 21V10Z"/><path d="m18 15 9 6-9 6Z" fill="currentColor" stroke="none"/>'],
 artifacts: ['blue','<path d="M7 7h17l7 7v21H7Z"/><path d="M24 7v8h7m-18 7h10m-10 6h6m10 1h11m-4-4 4 4-4 4"/>'],
 reuse: ['blue','<path d="M10 15a14 14 0 0 1 24-4l3 5m0-9v9h-9M32 27a14 14 0 0 1-24 4l-3-5m0 9v-9h9"/><path d="m15 17 6-3 6 3v8l-6 3-6-3Z"/><path d="m15 17 6 3 6-3m-6 3v8"/>'],
 review: ['violet','<path d="M7 6h23v29H7Zm6 8h11m-11 7h7m-7 7h6"/><path d="m23 29 10-10 5 5-10 10-7 2Z" fill="var(--icon-paper)"/><path d="m30 22 5 5"/>'],
 validation: ['green','<path d="M9 7h23v29H9Z"/><path d="m14 17 3 3 6-7m-9 14 3 3 6-7m3-6h3m-3 10h3"/>'],
 reputation: ['amber','<path d="M6 7h30v23H19l-9 7v-7H6Z"/><path d="m21 11 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="currentColor" stroke="none"/>'],
 monitoring: ['green','<rect x="5" y="8" width="32" height="24" rx="3"/><path d="M9 21h5l4-7 6 13 4-6h5m-18 16h12m-6-5v5"/>'],
 composition: ['violet','<rect x="4" y="15" width="10" height="12" rx="2"/><rect x="28" y="4" width="10" height="12" rx="2"/><rect x="28" y="27" width="10" height="12" rx="2"/><path d="M14 21h7V10h7M21 21v12h7m-4-26 4 3-4 3m0 17 4 3-4 3"/>'],
 realtime: ['blue','<path d="M6 17v8m6-14v20m6-24v28m6-23v18m6-14v8m6-11v16"/>'],
 developer: ['violet','<rect x="4" y="7" width="34" height="28" rx="3"/><path d="M4 14h34m-24 6-5 5 5 5m14-10 5 5-5 5m-5-11-4 12"/><path d="M9 10h1m4 0h1"/>'],
};
export function featureIcon(id) {
 const [color, drawing] = drawings[id] ?? drawings.catalog;
 return `<span class="feature-icon icon-${color}" aria-hidden="true"><svg viewBox="0 0 42 42" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false">${drawing}</svg></span>`;
}
