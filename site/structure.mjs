export function structure() {
  return `<figure class="structure" id="structure" aria-labelledby="structure-title">
    <figcaption><h3 id="structure-title">One goal. A clear path to the result.</h3><p>An illustrative video job, from human intent to the next capability.</p></figcaption>
    <div class="structure-stage">
      <p class="structure-label">01 / Intent</p>
      <div class="structure-row">
        <div class="structure-node structure-human"><span class="structure-role">Human</span><h4>Give the goal and authority</h4><p>“Convert my video. Keep it confidential. Spend at most $0.05.”</p></div>
        <span class="structure-arrow" aria-hidden="true">→</span>
        <div class="structure-node structure-ai"><span class="structure-role">Main AI</span><h4>Turn intent into requirements</h4><p><code>video.transcode</code><br>Confidential input · budget ≤ $0.05</p></div>
      </div>
    </div>
    <div class="structure-connector"><span aria-hidden="true">↓</span><span>Discover the capability and request comparable offers</span></div>
    <div class="structure-stage structure-decision">
      <p class="structure-label">02 / SPPA semantic decision layer</p>
      <div class="structure-row">
        <div class="structure-node structure-data"><span class="structure-role">SPPA contracts</span><h4>Describe meaning and choices</h4><p><strong>Semantic Capability</strong> + <strong>AI Decision Contract</strong></p><div class="structure-offers"><span>A · $0.18 · confidential</span><span>B · $0.04 · confidential</span></div><p class="structure-small">Features · cost · timing · policy · evidence</p></div>
        <span class="structure-arrow" aria-hidden="true">→</span>
        <div class="structure-node structure-ai"><span class="structure-role">Main AI</span><h4>Filter, compare, choose</h4><p>A exceeds the budget. B meets this example’s requirements.</p><p><strong>Choose provider B.</strong></p></div>
      </div>
      <p class="structure-source">Offers can come from a Hub, a private registry, or a provider directly. The AI makes the choice.</p>
    </div>
    <div class="structure-connector"><span aria-hidden="true">↓</span><span>Invoke the selected provider — selection does not reserve capacity</span></div>
    <div class="structure-stage">
      <p class="structure-label">03 / Execution and result</p>
      <div class="structure-row structure-row-three">
        <div class="structure-node structure-transport"><span class="structure-role">Execution binding</span><h4>Carry the call</h4><p>MCP / HTTP / other transport</p><p class="structure-small">Use the declared binding.</p></div>
        <span class="structure-arrow" aria-hidden="true">→</span>
        <div class="structure-node structure-provider"><span class="structure-role">Provider B</span><h4>Admit and run the job</h4><p>Check policy and capacity, then execute the transcode.</p><p class="structure-small">Ordinary software can be the provider.</p></div>
        <span class="structure-arrow" aria-hidden="true">→</span>
        <div class="structure-node structure-result"><span class="structure-role">Result</span><h4>Return usable output</h4><p>Video artifact + execution evidence</p><p class="structure-small">Execution evidence does not prove quality.</p></div>
      </div>
    </div>
    <div class="structure-connector"><span aria-hidden="true">↓</span><span>The main AI monitors execution and evaluates the returned result</span></div>
    <div class="structure-outcome"><strong>Deliver the result, or compose the next step.</strong><span>The AI checks the output against the goal, then delivers it or passes a compatible artifact to another capability.</span></div>
    <p class="caption">Conceptual structure, not a live Hub trace. Full offers, evaluation, feedback, and composition are proposed; the runnable reference demonstrates the HTTP execution path.</p>
  </figure>`;
}
