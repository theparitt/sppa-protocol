// Flat 2D faces; dialogue stays accessible HTML.
export function comic() {
  const faces = {
    human: '<circle cx="32" cy="34" r="25" fill="#efc49f"/><path d="M7 31C5 12 17 5 32 5s27 10 25 28l-7-10c-11 2-19-1-26-7l-10 15z" fill="#584a40"/><circle cx="23" cy="34" r="2.5" fill="#333"/><circle cx="41" cy="34" r="2.5" fill="#333"/><path d="M24 45q8 5 16 0" fill="none" stroke="#584a40" stroke-width="2.5" stroke-linecap="round"/>',
    ai: '<path d="M32 5v8" stroke="#55799e" stroke-width="3"/><circle cx="32" cy="5" r="4" fill="#55799e"/><rect x="1" y="26" width="8" height="19" rx="3" fill="#55799e"/><rect x="55" y="26" width="8" height="19" rx="3" fill="#55799e"/><rect x="7" y="13" width="50" height="44" rx="10" fill="#99bfdf"/><rect x="13" y="21" width="38" height="27" rx="7" fill="#364d63"/><circle cx="23" cy="31" r="3" fill="#fff"/><circle cx="41" cy="31" r="3" fill="#fff"/><path d="M25 40h14" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>',
    mcp: '<path d="M22 6v14m20-14v14" stroke="#79688d" stroke-width="6" stroke-linecap="round"/><rect x="9" y="17" width="46" height="40" rx="10" fill="#b8a5cf"/><circle cx="23" cy="33" r="3" fill="#3e344a"/><circle cx="41" cy="33" r="3" fill="#3e344a"/><path d="M24 44q8 4 16 0" fill="none" stroke="#3e344a" stroke-width="2.5" stroke-linecap="round"/>',
    sppa: '<rect x="9" y="8" width="46" height="50" rx="8" fill="#9fc6ae"/><path d="M17 8v50" stroke="#6d9980" stroke-width="5"/><circle cx="28" cy="29" r="3" fill="#344e3e"/><circle cx="43" cy="29" r="3" fill="#344e3e"/><path d="M29 41h12" stroke="#344e3e" stroke-width="2.5" stroke-linecap="round"/>',
  };
  const avatar = kind => `<span class="comic-avatar comic-avatar-${kind}" aria-hidden="true"><svg viewBox="0 0 64 64" focusable="false">${faces[kind]}</svg></span>`;
  const dialogue = (kind, name, text, extra = '') => `<li class="comic-line">${avatar(kind)}<div class="comic-speech"><span class="comic-speaker">${name}</span><p>${text}</p>${extra}</div></li>`;
  return `<section class="landing-section comic-section" id="sppa-in-a-picture" aria-labelledby="comic-title">
    <div class="section-heading"><p class="eyebrow">An illustrated example</p><h2 id="comic-title">Same goal.<br>More context for the AI.</h2><p>MCP helps an agent discover and call tools. SPPA supplies standardized capability and provider information so the agent can compare offers before deciding.</p></div>
    <figure class="sppa-comic" aria-labelledby="comic-title" aria-describedby="comic-caption">
      <div class="comic-goal">${avatar('human')}<div><span class="comic-speaker">Human → AI</span><p>“Convert this video for my client.<br>Keep it confidential and spend no more than $0.05.”</p></div></div>
      <div class="comic-panels">
        <section class="comic-panel" aria-labelledby="comic-mcp-title">
          <header><span class="comic-panel-number">A</span><div><h3 id="comic-mcp-title">MCP on its own</h3><p>Connect to tools and call them.</p></div></header>
          <ol class="comic-dialogue">
            ${dialogue('ai', 'AI agent', 'What video tools can I use?')}
            ${dialogue('mcp', 'MCP connection', 'Here are tools from providers A and B, with descriptions and input schemas.', '<div class="comic-tool-tags"><code>A.convert_video</code><code>B.encode_video</code></div>')}
            ${dialogue('ai', 'AI agent', 'I can call either tool. I still need to compare their price, privacy terms, and current load for this job.')}
            ${dialogue('mcp', 'MCP connection', 'Once you choose a provider, I can carry the tool call and return its result.')}
          </ol>
          <p class="comic-takeaway">Tool access. The application assembles the provider comparison.</p>
        </section>
        <section class="comic-panel comic-panel-sppa" aria-labelledby="comic-sppa-title">
          <header><span class="comic-panel-number">B</span><div><h3 id="comic-sppa-title">MCP + SPPA</h3><p>Compare capabilities and offers, then call.</p></div></header>
          <ol class="comic-dialogue">
            ${dialogue('ai', 'AI agent', 'I need <code>video.transcode</code> with confidential input and a $0.05 spending cap.')}
            ${dialogue('sppa', 'SPPA decision data', 'Here are comparable offers for that capability.', '<div class="comic-offers"><div><strong>Provider A</strong><span>$0.18 · 108s ETA</span><span>Confidential input</span><small>Above your budget</small></div><div><strong>Provider B</strong><span>$0.04 · 92s ETA</span><span>Confidential input</span><small>Fits the example requirements</small></div></div>')}
            ${dialogue('ai', 'AI agent', 'B fits this job’s requirements. I choose B. Call its video tool.')}
            ${dialogue('mcp', 'MCP connection', 'Calling provider B with the selected inputs. The provider returns the result.')}
          </ol>
          <p class="comic-takeaway">A decision surface. The AI chooses; the provider executes.</p>
        </section>
      </div>
      <div class="comic-result"><span aria-hidden="true">↓</span><strong>Result artifact → AI checks it → human gets the outcome</strong></div>
      <figcaption id="comic-caption">Illustration of the proposed design, not a live Hub or MCP integration. Prices and ETA are example data; assume authorized inputs, allowed commercial use, verified policy terms, and enforceable spending caps. Offers do not reserve capacity: the provider checks admission again.</figcaption>
    </figure>
    <p class="caption">MCP can already carry rich descriptions and structured data; an application can build comparisons using it. SPPA’s contribution is a shared semantic and decision contract across providers. See the <a href="https://modelcontextprotocol.io/specification/2025-11-25/server/tools">MCP tool specification</a>.</p>
    <p class="comic-independent">MCP is one way to execute. The same SPPA decision layer can work with HTTP or another declared binding.</p>
  </section>`;
}
