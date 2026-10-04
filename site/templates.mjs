import { landing } from './landing.mjs';
export const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function templates(B, docs, version = '0.1.1', assetVersion = '') {
  const assetQuery = assetVersion ? `?v=${assetVersion}` : '';
  const repository = 'https://github.com/theparitt/sppa-protocol';
  const origin = 'https://theparitt.github.io';
  const link = slug => B + `spec/${version}/${slug}/`;
  const nav = active => [
    ['About SPPA', B, 'home'],
    ['Features', B + 'features/', 'features'],
    ['Concept', B + 'design/concept/', 'concept'],
    ['Architecture', B + 'design/architecture/', 'design'],
    ['Documents', B + 'documents/', 'documents'],
    ['Specification', link('overview'), 'spec'],
    ['Schemas', B + 'schemas/', 'schemas'],
    ['Conformance', link('conformance'), 'conformance'],
  ].map(([label, url, id]) => `<a href="${url}" ${active === id ? 'aria-current="page"' : ''}>${label}</a>`).join('');

  function page(title, body, active = 'spec', path = '') {
    return `<!doctype html>
<html lang="en" data-base="${B}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="SPPA is a machine-first semantic capability and decision standard for AI agents to discover, compare, select and compose software capabilities across providers, independently of transport.">
  <meta name="theme-color" content="#ffffff">
  <meta property="og:title" content="${escape(title)} · SPPA Protocol">
  <meta property="og:description" content="Start with the goal, not the app. Discover capabilities, compare providers and let AI choose.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${origin + B + path}">
  <title>${escape(title)} · SPPA Protocol</title>
  <link rel="canonical" href="${origin + B + path}">
  <link rel="icon" href="${B}favicon.svg${assetQuery}" type="image/svg+xml">
  <link rel="alternate" type="application/json" href="${B}.well-known/sppa.json" title="SPPA specification catalog">
  <link rel="stylesheet" href="${B}assets/style.css${assetQuery}">
  <script type="module" src="${B}assets/site.mjs${assetQuery}"></script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="header">
    <div class="topbar">
      <a class="brand" href="${B}" aria-label="SPPA Protocol home"><span class="mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>SPPA <small>Protocol</small></a>
      <nav class="nav" id="main-navigation" aria-label="Main navigation">${nav(active)}</nav>
      <div class="tools">
        <button type="button" class="search-open" aria-label="Search documentation">Search docs <kbd>/</kbd></button>
        <a class="github-link" href="${repository}">GitHub</a>
        <button type="button" class="menu-button" aria-controls="main-navigation" aria-expanded="false">Menu</button>
      </div>
    </div>
  </header>
  ${version === '0.1.0' ? `<div class="wrap note archive-note">Archived 0.1.0 draft. <a href="${B}spec/0.1.1/overview/">Read the current 0.1.1 draft</a>.</div>` : ''}
  ${version === '0.1.1' && ['spec','schemas','conformance','documents'].includes(active) ? `<div class="wrap note archive-note">Published HTTP reference · Core 0.1.1. The <a href="${B}design/architecture/">semantic decision standard is transport independent</a>; these resources remain available to reproduce the earlier proof.</div>` : ''}
  ${body}
  <footer class="footer">
    <div class="wrap footer-inner">
      <span><b>SPPA Protocol</b> · Specific Purpose Platform/App</span>
      <div class="footer-links"><span>${['design','concept','features'].includes(active) ? 'Design draft' : `Reference draft ${version}`}</span><a href="${link('governance')}">Governance</a><a href="${repository}/blob/main/LICENSE">Apache-2.0</a><a href="${repository}">Source</a><button type="button" class="print-button">Print document</button></div>
    </div>
  </footer>
  <dialog class="search-dialog" id="search-dialog" aria-label="Search documentation">
    <div class="search-bar"><input id="search-input" type="search" placeholder="Search the documents…" autocomplete="off" aria-label="Search the specification"><button type="button" class="search-close" aria-label="Close search">Esc</button></div>
    <div class="search-results" id="search-results" aria-live="polite"></div>
    <div class="search-footer">Search the published specification</div>
  </dialog>
</body>
</html>`;
  }

  function sidebar(current) {
    const group = items => items.map(([slug, title]) => `<a href="${link(slug)}" ${current === slug ? 'aria-current="page"' : ''}>${escape(title)}</a>`).join('');
    const implementation = docs.findIndex(item => item[0] === 'quickstart');
    return `<details open class="sidebar"><summary>CONTENTS</summary><a href="${B}documents/" ${current === 'documents' ? 'aria-current="page"' : ''}>Document index</a><a href="${B}features/">All protocol features</a><div class="side-group">Concept & design</div><a href="${B}design/concept/" ${current === 'concept' ? 'aria-current="page"' : ''}>SPPA Concept</a><a href="${B}design/architecture/" ${current === 'architecture' ? 'aria-current="page"' : ''}>Architecture & execution bindings</a><a href="${B}design/decision-contract/" ${current === 'decision-contract' ? 'aria-current="page"' : ''}>AI Decision Contract</a><div class="side-group">Core ${version}</div>${group(docs.slice(0, implementation))}<div class="side-group">Implementation</div>${group(docs.slice(implementation))}<a href="${B}schemas/" ${current === 'schemas' ? 'aria-current="page"' : ''}>Schemas & API</a><div class="side-group">Project</div><a href="${repository}">Source repository</a></details>`;
  }

  function documents() {
    const contents = docs.map(([slug, title, description], index) => `<li><a href="${link(slug)}"><span class="contents-number">${String(index + 1).padStart(2, '0')}.</span><span><strong>${escape(title)}</strong><span class="contents-description">${escape(description)}</span></span></a></li>`).join('');
    return `<div class="doc-layout">
      ${sidebar('documents')}
      <main class="doc-body publication" id="main">
        <article class="prose">
          <header class="publication-header">
            <p class="publication-label">Protocol specification</p>
            <h1>SPPA Protocol Suite</h1>
            <p class="publication-subtitle">Core specification and supporting documents</p>
            <dl class="publication-meta"><dt>Version</dt><dd>${version}</dd><dt>Status</dt><dd>Working draft</dd><dt>License</dt><dd><a href="${repository}/blob/main/LICENSE">Apache-2.0</a></dd></dl>
          </header>
          <h2 id="abstract">Abstract</h2>
          <p>SPPA (Specific Purpose Platform/App) defines a common contract for specialized software used by AI agents. The <a href="${B}design/architecture/">new architecture direction</a> centers on Semantic Capability and AI Decision Contract, independently of execution transport. The published Core ${version} below documents the HTTP reference experiment; it is retained for reproducibility and does not yet implement the full decision standard.</p>
          <p>The protocol supports direct providers and private registries. SPPA Hub is a separate reference service. Providers choose their own software, runtime and infrastructure.</p>
          <p><a href="${B}features/">Browse all protocol features</a> for responsibilities, reference coverage and planned work across the ecosystem.</p>
          <h2 id="concept-and-design">Concept and design direction</h2>
          <p>Start with the <a href="${B}design/concept/">SPPA Concept</a> for purpose, the two core contracts, the AI lifecycle, and a provider-selection example. Continue with <a href="${B}design/architecture/">Architecture & execution bindings</a> and the <a href="${B}design/decision-contract/">AI Decision Contract</a> for detailed design requirements.</p>
          <h2 id="contents">Contents</h2>
          <ol class="contents-list">${contents}</ol>
          <h2 id="machine-contracts">Machine contracts</h2>
          <p>Versioned resources accompany the specification. Read the normative chapters alongside the schemas and API binding.</p>
          <ul class="resource-links"><li><a href="${B}schemas/">JSON schemas and API reference</a></li><li><a href="${B}schemas/${version}/bundle.json" download>Download the schema bundle</a></li><li><a href="${B}openapi/${version}.json" download>Download the OpenAPI binding</a></li><li><a href="${B}.well-known/sppa.json">Specification catalog</a></li></ul>
          <h2 id="version-history">Versions and status</h2>
          <p>Core ${version} is the current working draft. It is open for review; implementation limits and the contribution process are described in <a href="${link('conformance')}">Conformance</a> and <a href="${link('governance')}">Status & governance</a>.</p>
          <p>Previous publication: <a href="${B}spec/0.1.0/overview/">Core 0.1.0</a>. Its versioned specification, schemas and API binding remain available.</p>
        </article>
      </main>
      <aside class="toc" aria-label="On this page"><strong>ON THIS PAGE</strong><a href="#abstract">Abstract</a><a href="#concept-and-design">Concept and design</a><a href="#contents">Contents</a><a href="#machine-contracts">Machine contracts</a><a href="#version-history">Versions and status</a></aside>
    </div>`;
  }
  const home = () => landing(B, link, repository);
  return { page, sidebar, home, documents, link, repository, origin };
}
