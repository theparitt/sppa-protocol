// Native SVG characters and HTML dialogue keep the illustration readable,
// searchable, and responsive without baking text into an image.
const avatar = kind => {
  const drawings = {
    human: '<path d="M16 27c0-14 32-14 32 0v9c0 12-8 19-16 19s-16-7-16-19z"/><path d="M16 29c4-2 8-7 10-12 5 7 12 10 22 11M10 70c0-11 10-17 22-17s22 6 22 17"/><path d="M24 43c5 4 11 4 16 0"/><circle cx="24" cy="34" r="1.5"/><circle cx="40" cy="34" r="1.5"/>',
    ai: '<rect x="11" y="18" width="42" height="35" rx="10"/><path d="M32 18V9M7 29v12m50-12v12M20 53v7m24-7v7M13 70v-4c0-5 8-7 19-7s19 2 19 7v4"/><circle cx="32" cy="7" r="3"/><circle cx="23" cy="32" r="3"/><circle cx="41" cy="32" r="3"/><path d="M24 43c5 4 11 4 16 0"/>',
    mcp: '<rect x="12" y="20" width="40" height="34" rx="9"/><path d="M22 20V9m20 11V9M32 54v10c0 4 4 6 10 6"/><circle cx="23" cy="33" r="2"/><circle cx="41" cy="33" r="2"/><path d="M24 43c5 4 11 4 16 0"/>',
    sppa: '<rect x="12" y="15" width="40" height="45" rx="7"/><rect x="23" y="10" width="18" height="10" rx="3"/><circle cx="24" cy="32" r="2"/><circle cx="40" cy="32" r="2"/><path d="M24 41c5 4 11 4 16 0M21 51l4 4 8-8m5 5h6M20 60v10m24-10v10"/>',
  };
  return `<span class="comic-avatar comic-avatar-${kind}" aria-hidden="true"><svg viewBox="0 0 64 80" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" focusable="false">${drawings[kind]}</svg></span>`;
};
const dialogue = (kind, name, text, extra = '') => `<li class="comic-line">${avatar(kind)}<div class="comic-speech"><span class="comic-speaker">${name}</span><p>${text}</p>${extra}</div></li>`;

export function comic() {
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
