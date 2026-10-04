// Curated ecosystem catalog. Reference means the reproducible Core 0.1.1 proof,
// never general availability of a hosted service. Unmarked items are planned.
const raw = `
catalog|Capability catalog & publishing|Contract authors, Provider, Hub|discovery
*Capability manifests: Describe the provider and its capabilities.
*Typed inputs and outputs: Declare accepted parameters and artifact formats.
*Contract versions: Pin exact message and schema versions.
Semantic definitions: Describe a shared result independently of app names.
Provider publication: Register and update discoverable provider listings.
Deprecation notices: Announce retiring capabilities and compatible replacements.
search|Search & discovery|Hub or private registry; Client|discovery
*Direct discovery: Read a provider manifest without a public Hub.
Capability search: Find providers by a shared semantic capability.
Search prompts: Translate a task description into candidate capabilities.
Constraint filtering: Return only candidates that meet declared requirements.
Scoped discovery: Hide private listings from callers without permission.
Compact results: Load only the decision details needed for the next step.
decision|Decision & comparison|Hub supplies evidence; Client chooses|design/decision-contract
Job-bound offers: Request comparable terms for specific inputs and parameters.
Tradeoff comparison: Compare total cost, completion time and scoped quality.
Eligibility states: Preserve pass, fail and unknown for required terms.
Decision explanations: Attach evidence and reasons to a comparison.
Alternative offers: Show eligible options instead of forcing one winner.
Decision records: Preserve the offers and authority used when selecting.
pricing|Pricing, offers & budget|Provider and trusted Client runtime|design/decision-contract
Typed billing units: Distinguish input minutes, compute minutes and GPU minutes.
Price breakdown: Include compute, transfer, storage and other applicable charges.
Total estimates: Normalize rates into comparable job totals and currency.
Binding cost ceilings: Enforce an authorized maximum, not just an estimate.
Expiring quotes: Bind offer validity to the job and an explicit expiry.
Counteroffers and shared budgets: Require acceptance and enforce aggregate agent spend.
payment|Payments & settlement|Payment integration and authorized payer|design/architecture
Method discovery: Describe supported payment methods and their limitations.
Delegated authorization: Restrict payee, currency, amount and validity window.
Metered settlement: Settle agreed usage within the authorized ceiling.
Payment reconciliation: Track pending, authorized, settled and failed states.
Cancellation and refunds: Apply declared charges and track refund or dispute evidence.
Duplicate protection: Repeated requests or events must not move money twice.
identity|Identity, privacy & rights|Client, Hub, Provider and data owner|policy
*Caller ownership: Bind provider jobs and artifacts to authenticated callers.
*Privacy eligibility: Check declared privacy requirements before invocation.
Agent scopes and delegation: Grant minimum permissions with expiry and revocation.
Visibility boundaries: Separate public, team and private resources.
Residency constraints: Declare where data is stored and processed.
Commercial rights: Check underlying software, model, input and output rights separately.
execution|Execution, queue & limits|Provider owns admission; Client reconciles|jobs
*Typed invocation: Submit capability parameters and immutable input references.
*Atomic admission: Enforce queue and concurrency limits at the provider.
*Progress and cancellation: Observe job state and request cancellation.
*Idempotency: Replay the same accepted request without creating a second job.
*Timeout and retry budgets: Bound retries without resetting the root lineage.
Unknown-outcome reconciliation: Resolve interrupted calls before starting fresh work.
artifacts|Artifacts, storage & transfer|Storage authority, Provider and Client|artifacts
*Immutable references: Describe artifacts by ownership, metadata and identity.
*Byte transfer: Upload and download bytes outside JSON messages.
*Integrity checks: Verify committed byte size and SHA-256.
Scoped transfer grants: Authorize movement without granting unrelated access.
Resumable transfer: Negotiate multipart and resume support explicitly.
Retention and cleanup: Declare lifecycle and delete according to authority.
reuse|Reuse & context efficiency|Client and Storage; authorized Hub search|design/decision-contract
Exact fingerprints: Match inputs, parameters, contract and provider version.
Scoped reuse search: Discover reusable results only within allowed visibility.
Rights and freshness: Recheck license, tenant boundary and validity before reuse.
Reuse comparison: Compare permitted reuse with a fresh execution offer.
Contract caching: Cache documentation under version and freshness rules.
Context efficiency: Return compact references instead of repeating large payloads.
review|Output review & revision|Client, Provider and session authority|design/architecture
Previews: Return inspectable snapshots or excerpts with clear limitations.
Accept and reject: Record a decision for an explicitly identified candidate.
Request changes: Submit targeted instructions and parameters for a new candidate.
History and rollback: Keep accepted versions while exploring branches.
Concurrent edit protection: Version session state to prevent silent overwrites.
Bounded finalization: Limit iterations, time and spend; validate the final delivery.
validation|Validation & evaluation|Validators and Evaluators; Client|design/decision-contract
Structural validation: Check actual output against required formats and properties.
Deterministic checks: Run code-based checks tied to the job requirements.
Rubric evaluation: Evaluate quality under a declared workload-specific rubric.
Evidence references: Preserve the observations that support each result.
Uncertainty: Report insufficient evidence rather than fabricate a confident score.
Final validation: Recheck delivery even when a preview was accepted.
reputation|Reviews, suggestions & reputation|Caller and evidence aggregation service|design/decision-contract
Execution-linked feedback: Bind reviews to an authorized caller and actual run.
Dimension ratings: Separate correctness, usefulness and composability.
Structured suggestions: Record category, severity and improvement evidence.
Provider responses: Track acknowledgement and version-linked fixes.
Measured reputation: Report workload-specific outcomes and prediction accuracy.
Anti-gaming and appeals: Expose sources, samples, unresolved runs and disputed claims.
monitoring|Monitoring & availability|Provider reports; Hub and Client observe|errors
*Health signals: Keep provider health separate from queue saturation.
*Capacity snapshots: Observe concurrency, queue and admission limits.
*Structured errors: Return typed failures and retry guidance.
Availability schedules: Declare on-demand or scheduled operating windows.
Prediction accuracy: Compare observed runtime and cost with past estimates.
Alerts: Subscribe to changes under explicit delivery and visibility rules.
composition|Composition & provider handoff|Client or selected workflow provider|design/architecture
Semantic compatibility: Check meaning as well as MIME type and capability ID.
Pipeline proposals: Describe compatible steps and required intermediate artifacts.
Parallel work: Coordinate independent steps under resource and budget limits.
Authorized handoff: Grant only the artifacts the next provider may use.
Editable state: Negotiate portable working state when changing providers.
Failure recovery: Reconcile partial results before retrying or replacing a step.
realtime|Realtime streams & events|Streaming or event Provider and Client|design/architecture
Stream profiles: Declare input and output stream contracts.
Partial and final results: Distinguish provisional events from completed output.
Backpressure: Bound buffering when consumers cannot keep up.
Interruption: Acknowledge cancellation or changes during active processing.
Reconnect: Resume only according to explicit continuity guarantees.
Subscriptions: Authorize event delivery with expiry, ordering and replay rules.
developer|Developer tools & operations|Implementers and operators of each component|conformance
*Reference client: Use the HTTP client with typed contract validation.
*CLI and examples: Run the FFmpeg proof and validate local examples.
*Conformance checks: Test schema shape and critical protocol behavior.
*Human and JSON views: Publish documents alongside machine-readable contracts.
Inspector and audit: Inspect decisions and redact sensitive operational records.
Private operations: Support private registries, suspension and recovery procedures.
`.trim();
export const categories = raw.split('\n').reduce((groups, line) => {
 if (line.includes('|')) { const [id,title,owner,document] = line.split('|'); groups.push({id,title,owner,document,items:[]}); }
 else { const reference=line.startsWith('*'); const [name,...description]=line.replace(/^\*/,'').split(': ');groups.at(-1).items.push({name,description:description.join(': '),reference}); }
 return groups;
}, []);
const highlights = [
 ['search','Find capabilities','Start from the result you need, independently of application names.','Direct discovery works; semantic search planned'],
 ['decision','Compare providers','Give AI comparable cost, timing, policy and evidence for this job.','Full decision contract proposed'],
 ['execution','Run within your rules','Check privacy, admit work atomically and bound retries.','HTTP reference works; binding budget planned'],
 ['reuse','Move and reuse results','Transfer verified artifacts; reuse only with compatible inputs and rights.','Artifact transfer works; scoped reuse planned'],
 ['review','Review and refine','Inspect a candidate, request changes and preserve the accepted version.','Planned'],
 ['reputation','Learn from verified experience','Use run-linked feedback and workload-specific evidence in the next decision.','Signed receipts work; reputation planned'],
 ['composition','Compose workflows','Connect compatible capabilities and pass authorized outputs to the next step.','Planned'],
 ['payment','Pay through supported services','Use explicit payment authority, cost ceilings and duplicate protection.','Planned extension'],
];
export function featured(B) {
 return `<section class="landing-section" id="features" aria-labelledby="features-title">
 <div class="section-heading"><p class="eyebrow">Features / At a glance</p><h2 id="features-title">From finding a capability<br>to using its result.</h2><p>Eight parts of the AI-first lifecycle. The catalog explains what each enables, who owns it and how far it has been implemented.</p></div>
 <div class="feature-grid">${highlights.map(([id,title,description,status])=>`<a class="feature-card" href="${B}features/#${id}"><h3>${title}</h3><p>${description}</p><span class="feature-status">${status}</span><span class="feature-more">Explore features &rarr;</span></a>`).join('')}</div>
 <div class="feature-catalog-link"><a class="button" href="${B}features/">Explore all features &rarr;</a><p>16 categories &middot; 96 catalog entries &middot; Reference coverage and planned work clearly separated.</p></div>
 </section>`;
}
export function featureCatalog(B) {
 const doc = path => B+(path.startsWith('design/')?path+'/':'spec/0.1.1/'+path+'/');
 return `<main id="main" class="landing feature-catalog">
 <header class="landing-hero"><p class="eyebrow">SPPA ecosystem / Feature catalog</p><h1>Protocol features.</h1><p class="hero-definition">What AI agents should be able to discover, decide, execute and learn across providers.</p><p>16 categories and 96 curated entries describe the ecosystem together. This catalog is a design map, not a claim that every feature is available or a replacement for the normative specifications.</p><p><a href="${B}#features">&larr; Featured capabilities</a> &middot; <a href="${B}design/decision-contract/">AI Decision Contract</a> &middot; <a href="${B}documents/">Published specifications</a></p></header>
 <div class="note"><strong>Read the status before implementing.</strong> <b>Reference</b> means demonstrated by the reproducible Core 0.1.1 HTTP reference, a working draft rather than a production service. <b>Planned</b> means proposed ecosystem work with no complete public contract or conforming reference implementation yet. A local Hub experiment does not make the full standard available. An execution receipt does not establish output quality.</div>
 <nav class="feature-index" aria-label="Feature categories">${categories.map((g,i)=>`<a href="#${g.id}"><span>${String(i+1).padStart(2,'0')}</span>${g.title}</a>`).join('')}</nav>
 ${categories.map((g,i)=>`<section class="landing-section feature-group" id="${g.id}" aria-labelledby="${g.id}-title"><div class="section-heading"><p class="eyebrow">${String(i+1).padStart(2,'0')} / Ecosystem features</p><h2 id="${g.id}-title">${g.title}</h2><p><strong>Responsibility:</strong> ${g.owner}.</p><a href="${doc(g.document)}">Read the related ${g.document.startsWith('design/')?'design proposal':'HTTP reference chapter'} &rarr;</a></div><dl class="feature-items">${g.items.map(item=>`<div><dt>${item.name}<span class="feature-badge ${item.reference?'reference':'planned'}">${item.reference?'Reference':'Planned'}</span></dt><dd>${item.description}</dd></div>`).join('')}</dl><a class="feature-back" href="#main">Back to categories &uarr;</a></section>`).join('')}
 <section class="landing-section"><h2>Boundaries that keep the lifecycle clear.</h2><div class="two-columns"><div><h3>The AI chooses; authorities enforce.</h3><p>The Hub supplies candidates and evidence. Providers own execution and queue admission; storage owns artifact access. Trusted clients enforce delegated permissions and shared budgets. SPPA can use HTTP, MCP or another declared binding, with direct providers or private registries.</p></div><div><h3>Separate decisions and state.</h3><p>A price estimate is not payment authority. Budget reservation, payment hold and compute reservation are different. A quote reserves no compute slot. Creating a candidate does not accept it; accepting work, reviewing a provider and settling payment are independent decisions.</p></div></div><p>Quality and reputation need source, timestamp, workload, sample size and uncertainty. Missing required rights or binding budget terms remain unknown and must not pass eligibility.</p></section>
 </main>`;
}
