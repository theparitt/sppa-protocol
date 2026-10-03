export function landing(B, link, repository) {
  return `<main id="main" class="landing">
  <section class="landing-hero" aria-labelledby="intro-title">
    <p class="eyebrow">SPPA · Specific Purpose Platform/App</p>
    <h1 id="intro-title">Software capabilities<br>for AI.</h1>
    <p class="hero-definition">SPPA is an open capability and decision layer for specialized software that AI agents discover, select, and operate.</p>
    <p class="hero-detail">Humans give intent. AI chooses the capability. The provider does the specialized work.</p>
    <p class="agent-audience">The tools are for AI agents to operate, not for humans to operate directly. This website explains the design to people building and evaluating it.</p>
    <div class="actions"><a class="button primary" href="#how-it-works">Understand SPPA <span aria-hidden="true">↓</span></a><a class="button" href="#proof">See the working proof <span aria-hidden="true">↗</span></a><a class="text-link" href="${B}documents/">Read the documents →</a></div>
    <p class="landing-status">Open design · Working reference implementation · Built to work with MCP</p>
  </section>

  <section class="landing-section" id="how-it-works" aria-labelledby="goal-title">
    <div class="section-heading"><p class="eyebrow">01 / The idea</p><h2 id="goal-title">Start with the goal,<br>not the app.</h2><p>Agents should spend their reasoning on the goal, rather than repeatedly installing, learning, and operating every piece of software needed to reach it.</p></div>
    <div class="goal-flow" aria-label="From human intent to usable result">
      <div><span class="flow-label">Human intent</span><p>“Convert this video for delivery.”</p></div><span class="flow-arrow" aria-hidden="true">→</span>
      <div><span class="flow-label">AI finds a capability</span><p><code>video.transcode</code></p></div><span class="flow-arrow" aria-hidden="true">→</span>
      <div><span class="flow-label">AI selects a provider</span><p>Fit, policy, capacity, evidence</p></div><span class="flow-arrow" aria-hidden="true">→</span>
      <div><span class="flow-label">Usable result</span><p>Artifact + execution evidence</p></div>
    </div>
    <div class="two-columns"><div><h3>One capability. Different implementations.</h3><p>A semantic capability describes the job and its result. <code>video.transcode</code> can be offered by FFmpeg or another video engine, on a local computer, a private network, or a cloud server. The provider can be ordinary software; it does not need an LLM inside it.</p></div><div><h3>Less setup for the calling AI.</h3><p>For a remote provider, the agent does not need to install the underlying application or learn its command syntax. It reads the input, output, features, parameters, and constraints. Providers still install and maintain their own software.</p></div></div>
    <p class="caption">Implemented example: <code>video.transcode</code>. Audio separation, 3D rendering, and document extraction are possible future capabilities, not services currently offered here.</p>
  </section>

  <section class="landing-section" id="lifecycle" aria-labelledby="lifecycle-title">
    <div class="section-heading"><p class="eyebrow">02 / The whole lifecycle</p><h2 id="lifecycle-title">Built for AI, end to end.</h2><p>From discovery to execution, monitoring, evaluation, reputation, and composition — the entire SPPA lifecycle is designed for AI agents.</p></div>
    <ol class="lifecycle-list">
      <li><span>01</span><h3>Discover</h3><p>Find a capability that matches the goal.</p></li>
      <li><span>02</span><h3>Select</h3><p>Compare eligible providers. The main AI chooses.</p></li>
      <li><span>03</span><h3>Run</h3><p>Send structured inputs to the chosen provider.</p></li>
      <li><span>04</span><h3>Monitor</h3><p>Track progress, deadlines, and failures.</p></li>
      <li><span>05</span><h3>Evaluate</h3><p>Check whether the result satisfies the goal.</p></li>
      <li><span>06</span><h3>Rate</h3><p>Return structured feedback backed by execution evidence.</p></li>
      <li><span>07</span><h3>Compose</h3><p>Use the result as input to the next capability.</p></li>
    </ol>
    <p class="caption">Lifecycle design: evaluation, reputation, and cross-provider composition are planned. The current proof covers discovery, hard policy checks, jobs, artifacts, capacity, and signed execution receipts.</p>
  </section>

  <section class="landing-section" id="decisions" aria-labelledby="decision-title">
    <div class="section-heading"><p class="eyebrow">03 / Why selection matters</p><h2 id="decision-title">Give AI enough information<br>to make a choice.</h2><p>Finding a tool is only the beginning. When several providers offer the same capability, the agent needs comparable terms and evidence to decide which fits this job.</p></div>
    <div class="decision-demo" aria-labelledby="demo-title">
      <div class="demo-header"><div><h3 id="demo-title">Same capability. Different offers.</h3><p>Illustrative decision surface for <code>video.transcode</code></p></div><span class="example-label">Example data · no live providers</span></div>
      <form id="decision-controls" class="decision-controls">
        <div><label for="decision-budget">Maximum total cost (USD)</label><select id="decision-budget"><option value="0.20">$0.20</option><option value="0.05">$0.05</option><option value="0.02">$0.02</option></select></div>
        <div><label for="decision-privacy">Required privacy</label><select id="decision-privacy"><option value="confidential">Confidential</option><option value="public">Public</option></select></div>
        <div><label for="decision-priority">Compare by</label><select id="decision-priority"><option value="time">Completion time</option><option value="quality">Measured quality</option><option value="cost">Total cost</option></select></div>
      </form>
      <p class="demo-requirement">Required in this example: commercial use explicitly allowed. Quality values share one illustrative benchmark; execution signatures alone do not establish quality.</p>
      <div class="table-wrap"><table class="offer-table"><caption>Provider offers after hard requirements</caption><thead><tr><th scope="col">Provider</th><th scope="col">Total cost</th><th scope="col">Wait + run</th><th scope="col">Measured quality</th><th scope="col">Privacy / rights</th><th scope="col">Eligibility</th></tr></thead><tbody id="decision-offers">
        <tr><th scope="row">A</th><td>$0.18</td><td>38s + 70s = 108s</td><td>0.96 · 400 samples</td><td>Confidential / commercial allowed</td><td>Eligible</td></tr>
        <tr><th scope="row">B</th><td>$0.04</td><td>2s + 90s = 92s</td><td>0.90 · 800 samples</td><td>Confidential / commercial allowed</td><td>Eligible</td></tr>
        <tr><th scope="row">C</th><td>$0.01</td><td>0s + 15s = 15s</td><td>0.98 · 5 samples</td><td>Public / commercial unknown</td><td>Excluded: privacy; commercial rights unknown</td></tr>
      </tbody></table></div>
      <p id="decision-summary" class="decision-summary" role="status" aria-live="polite">Two eligible offers. B has the shorter estimated completion time; A has the higher measured quality. The main AI chooses.</p>
      <noscript><p>This example also works as a static comparison. Enable JavaScript to change requirements and comparison order.</p></noscript>
    </div>
    <div class="two-columns"><div><h3>Hard requirements come first.</h3><p>Privacy, residency, permissions, licensing, and spending limits decide whether a provider is eligible. A better quality score cannot override a failed requirement. Required rights that are unknown do not pass.</p></div><div><h3>Evidence stays attached to the claim.</h3><p>Cost and ETA are estimates, not guarantees. Quality needs a benchmark, sample size, and confidence. Provider declarations stay separate from independent measurements. Missing data stays unknown.</p></div></div>
    <p><a class="text-link" href="${B}design/decision-contract/">Read the proposed AI Decision Contract →</a></p>
  </section>

  <section class="landing-section" id="architecture" aria-labelledby="architecture-title">
    <div class="section-heading"><p class="eyebrow">04 / The boundary</p><h2 id="architecture-title">SPPA supplies the decision layer.<br>MCP connects the tools.</h2><p>The new architecture builds on existing execution plumbing. SPPA standardizes what a capability means and the information agents use to compare providers.</p></div>
    <div class="architecture-flow"><div><span class="flow-label">Main AI</span><strong>Sets requirements</strong><p>Goal, hard constraints, priorities</p></div><span aria-hidden="true">→</span><div><span class="flow-label">SPPA Hub / private registry</span><strong>Returns comparable candidates</strong><p>Capability, offers, policy, evidence</p></div><span aria-hidden="true">→</span><div><span class="flow-label">Main AI</span><strong>Chooses the provider</strong><p>Final decision stays with the caller</p></div><span aria-hidden="true">→</span><div><span class="flow-label">MCP → provider</span><strong>Executes the work</strong><p>Calls, tasks, results</p></div></div>
    <div class="two-columns"><div><h3>SPPA owns the meaning.</h3><p>Semantic capabilities, provider offers, cost and timing comparisons, privacy and license rules, evidence, reputation, reuse, and artifact composition.</p></div><div><h3>MCP owns the connection.</h3><p>Local and remote connections, structured tool calls, authentication, progress, and negotiated task support. SPPA will not define another RPC envelope, OAuth system, or task transport.</p></div></div>
    <p class="caption">MCP Tasks are experimental and must be negotiated. The existing HTTP demo predates this boundary; an MCP binding is not implemented yet. Direct providers and private registries remain possible without a public Hub.</p>
    <p><a class="text-link" href="${B}design/architecture/">Read the architecture and migration plan →</a></p>
  </section>

  <section class="landing-section" id="comparison" aria-labelledby="comparison-title">
    <div class="section-heading"><p class="eyebrow">05 / Where it fits</p><h2 id="comparison-title">A focused contribution<br>to an existing ecosystem.</h2><p>Remote tools, jobs, and artifacts already exist. SPPA's proposed contribution is a shared capability and provider decision contract across implementations.</p></div>
    <div class="table-wrap"><table class="comparison-table"><caption>Different starting points; systems can work together</caption><thead><tr><th scope="col">Approach</th><th scope="col">What it provides</th><th scope="col">Where SPPA fits</th></tr></thead><tbody>
      <tr><th scope="row">Local CLI / SDK</th><td>Direct control over installed software.</td><td>A remote capability can reduce caller setup and tool-specific knowledge. An already installed local tool may be faster and keep sensitive data on-device.</td></tr>
      <tr><th scope="row"><a href="https://modelcontextprotocol.io/specification/2025-11-25/server/tools">MCP</a></th><td>Structured tools and connections; its <a href="https://modelcontextprotocol.io/registry/about">Registry</a> supports server discovery.</td><td>SPPA is designed to add semantic capability matching and comparable provider offers above MCP. It uses MCP rather than replacing it.</td></tr>
      <tr><th scope="row"><a href="https://docs.apify.com/actors">Apify Actors</a></th><td>Cloud programs with structured inputs, outputs, storage, and execution lifecycle.</td><td>SPPA aims to compare the same capability across independent providers and infrastructure, including private and local deployments.</td></tr>
      <tr><th scope="row"><a href="https://docs.runpod.io/serverless/overview">Runpod Serverless</a></th><td>Workers and endpoints for running workloads on managed compute.</td><td>A Runpod deployment can host a provider. SPPA exposes the capability and its offer so the caller can focus on the result rather than the compute setup.</td></tr>
      <tr><th scope="row"><a href="https://a2a-protocol.org/latest/specification/">A2A</a></th><td>Agent interoperability with tasks and artifacts.</td><td>An SPPA provider can be ordinary software with no agent or reasoning inside it. The intelligence can live entirely in the caller.</td></tr>
    </tbody></table></div>
    <p class="caption">These are architectural comparisons, not speed benchmarks. Network transfer, discovery, authentication, and queueing add overhead. SPPA is most useful when an existing capability saves the agent substantial setup or integration work.</p>
  </section>

  <section class="landing-section" id="proof" aria-labelledby="proof-title">
    <div class="section-heading"><p class="eyebrow">06 / Working proof</p><h2 id="proof-title">A real transcode.<br>A verifiable result.</h2><p>The reference caller discovers an FFmpeg provider, checks policy, uploads a video, starts a job, polls its state, and downloads the result. It verifies the output hash and an Ed25519 execution receipt.</p></div>
    <div class="proof-grid"><div class="proof-steps"><h3>What the demo proves</h3><ul><li>The provider runs a real H.264 transcode.</li><li>The caller uses a declared capability without invoking FFmpeg itself.</li><li>Artifacts are ownership-bound and verified by size and SHA-256.</li><li>The signed receipt binds the provider, job, parameters, input, and output.</li><li>Provider admission enforces queue, rate, timeout, and retry limits.</li></ul><p>A receipt is execution evidence. Output quality still needs its own evaluation.</p></div><div><div class="code-block"><div class="code-label">RUN THE REFERENCE · NODE 22+ / FFMPEG</div><button type="button" class="copy" aria-label="Copy proof command">Copy</button><pre><code>git clone https://github.com/theparitt/sppa-protocol.git
cd sppa-protocol
npm ci
npm run demo</code></pre></div><p class="caption">Two processes on one machine, over loopback HTTP. This validates the earlier reference contract; it is not yet an MCP demonstration or a public provider network. No measured token, speed, or cost savings are claimed.</p><a class="text-link" href="${link('quickstart')}">Reproduce the proof →</a></div></div>
  </section>

  <section class="landing-section landing-next" id="documents" aria-labelledby="documents-title">
    <div class="section-heading"><p class="eyebrow">07 / Go deeper</p><h2 id="documents-title">Understand the idea.<br>Inspect the contracts.</h2><p>SPPA is a working draft. The decision layer is the new design direction; Core 0.1.1 remains the reproducible HTTP reference.</p></div>
    <div class="document-links"><a href="${B}design/architecture/"><span>Design direction</span><strong>Architecture & MCP boundaries →</strong></a><a href="${B}design/decision-contract/"><span>Proposed selection semantics</span><strong>AI Decision Contract →</strong></a><a href="${B}documents/"><span>Published reference</span><strong>Protocol suite & document index →</strong></a><a href="${B}schemas/"><span>Machine-readable reference</span><strong>Schemas & API →</strong></a></div>
    <p class="caption">Next: MCP binding, comparable offers, licensing declarations, evaluation, verified feedback, reputation, reuse, and semantic composition. No hosted Hub or marketplace is live here. <a href="${repository}">Review or contribute on GitHub.</a></p>
  </section>
  </main>`;
}
