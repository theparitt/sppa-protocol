import { featureIcon } from './feature-icons.mjs';
export const layerSpecification = 'spec/decision-layers/0.1.0-draft.1/';
const layers = [
 ['catalog','Capability & configuration','What can it do?','The provider declares its features and limits.','“I convert videos to H.264, with up to 4 jobs running at once.”','Core declarations work; full semantic contract proposed'],
 ['monitoring','Runtime status','Is it ready now?','Fresh observations describe health and current load.','“All 4 slots are occupied. Two jobs are waiting, but the queue has room.”','Core health works; richer runtime profile experimental'],
 ['pricing','Job-specific offer','What are the terms for my job?','An offer binds cost and timing to your inputs and requirements.','“Estimated wait: 20s. Run: 40s. My maximum total charge for this job: $0.05.”','Proposed offer contract'],
 ['validation','Execution & validation evidence','What actually happened?','Run records and checks describe the result, separately from promises.','“This run waited 25s and took 42s. The output passed the H.264 format check.”','Core receipts and integrity checks work; full validation contract planned'],
 ['review','Evaluation & feedback','Did the result meet the goal?','A caller or evaluator reviews the work using a stated rubric.','“The output fits the brief: 4/5 on this rubric. Improve the audio handling.”','Planned'],
 ['reputation','Aggregated reputation','What do past runs tell us?','Historical evidence keeps workload, sample size and unknown outcomes visible.','“97 of 100 resolved runs completed. Five more runs have unknown outcomes.”','Planned'],
];
export function decisionLayers(B) {
 return `<section class="landing-section" id="decision-layers" aria-labelledby="layers-title">
 <div class="section-heading"><p class="eyebrow">The protocol / Six information layers</p><h2 id="layers-title">Six layers of information.<br>So AI knows what it is choosing.</h2><p>SPPA keeps six kinds of information separate so an agent can see what is declared, what was measured recently, and what previous work tells it.</p></div>
 <div class="layer-example-intent"><strong>One simple example</strong><p>“Convert this confidential video to H.264. I can wait, and you may spend at most $0.05.”</p><span class="example-label">Illustrative data · proposed full lifecycle, not a live offer</span></div>
 <ol class="layer-grid">${layers.map(([icon,name,question,description,example,status],i)=>`<li><div class="layer-card-heading">${featureIcon(icon)}<span class="layer-number">L${i+1}</span></div><h3>${question}</h3><p class="layer-name">${name}</p><p>${description}</p><blockquote>${example}</blockquote><span class="feature-status">${status}</span></li>`).join('')}</ol>
 <div class="layer-policy">${featureIcon('identity')}<div><h3>Permissions and rules apply to every layer.</h3><p>Privacy, location, license and spending authority are hard requirements. A good review cannot override them. Another AI's opinion still needs a source and evidence.</p></div></div>
 <p class="caption">These are information layers, not six new transports or a trust ranking. Past execution, evaluation and reputation can inform the next selection. A free slot or an offer reserves no compute; the provider checks admission again.</p>
 <a class="text-link" href="${B}${layerSpecification}">Read the six-layer specification &rarr;</a>
 </section>`;
}
