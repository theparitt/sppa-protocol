# Discovery and capabilities

## Provider discovery

A provider MUST publish `GET /.well-known/sppa.json` at its origin. The JSON
manifest declares `sppa`, `kind: provider`, stable provider ID, implementation
version, API endpoint, capabilities, supported profiles and security metadata.
The API endpoint is a base URL such as `https://provider.example/v1`.
Endpoint and key-discovery URL MUST use HTTPS without userinfo or fragments.
HTTP is permitted only with an explicit development flag on loopback addresses.

Discovery is read-only and need not require authentication for public metadata.
Private providers MAY require authentication for discovery. Clients MUST NOT
follow redirects while forwarding credentials. Discovery/cache freshness and
actual provider health are separate observations.

A registry indexes these manifests and supports its own search API. Core does
not require a particular registry, search engine or Hub endpoint. The public
specification website publishes a **specification catalog**, not a fake compute
provider manifest; it cannot execute jobs.

## Capability contract

A capability MUST define:

- ID, exact version, name, concise description and supported features.
- A self-contained JSON Schema object for parameters and result metadata.
- Input/output media types and maximum input size.
- Hard constraints on privacy, region, execution location, permissions,
  retention, logging and training use.
- An execution/admission contract for concurrency, queue, caller rate, timeout
  and retry limits, as defined in Capacity and Admission.
- At least one supported interaction mode: Core request/response or async job.

The mandatory HTTP-artifact profile uses async jobs. No undefined session or
streaming mode is implied by a generic capability description.
Capability/version pairs MUST be unique within a manifest. Parameters/result
schemas MUST declare object values, compile as JSON Schema 2020-12, and use
only internal fragment references. Clients MUST NOT fetch arbitrary references
supplied in schemas. Schemas should bound strings/arrays to provider limits.

## Typed invocation

The caller sends a capability ID, version, artifact reference, parameters,
policy and deadline. The provider maps that request to its own implementation.
For FFmpeg, `codec` and `crf` are typed parameters; the caller does not send a
shell command. Natural-language instructions can be typed semantic parameters
in appropriate later capabilities; text is not the envelope itself.

Arbitrary code execution MUST NOT be available implicitly. A future scripting
capability needs explicit permissions, policy, isolation and advertised contract.

## Eligibility before ranking

A caller or registry MUST reject a candidate when any mandatory constraint
fails. Unknown mandatory values are not success. Check input size/type,
capability parameter schema, privacy/location/region, permissions, training,
logging, retention, approval and current health. A high quality/reliability score
cannot compensate for a privacy or format mismatch.

A successful match returns an eligible candidate and reasons/evidence. Later
scores, confidence and historical reputation remain separate dimensions.
The caller AI chooses the provider; a registry recommendation is not consent
to execution or side effects.
