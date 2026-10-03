# Policy and eligibility

A request MUST include the explicit policy object. Missing mandatory fields or
unknown values fail closed. Providers MUST enforce it again at invocation;
a registry match is not a substitute for provider-side authorization.

## Privacy and location

Wire values are lowercase: `public`, `private`, `confidential`, `local_only`.
For **input classification preservation**, they are ordered in that sequence:
a caller MUST NOT request a weaker classification than the input artifact.
Provider acceptance is separate: its advertised privacy levels MUST explicitly
include the requested class. A vague claim of a stronger level is not a match.

`local_only` means execution and artifact bytes stay on the caller's device.
It is not synonymous with LAN or private cloud. Company-network workloads use
`private`/`confidential` with `execution_location: private_network` and a region
or boundary agreed outside this initial schema. A local-only request MUST set
location `local`, and the caller MUST verify device-bound deployment; a manifest
claim alone is not proof of physical location.

Other execution values are `private_network` and `remote`. A provider accepts
only declared locations/regions. `data_region: unspecified` does not satisfy a
named regional requirement. This binding uses exact region identifiers, not
geographic guesses. Registries and providers must account for metadata privacy
as well as artifact bytes when enforcing restrictions.

## Data use and retention

`training_use: false` prohibits training on this request's content.
`allow_content_logging: false` prohibits content logging; bounded operational
metadata/audit fields are separate and MUST have documented retention.
The provider's advertised retention MUST be at most `max_retention_seconds`.
Artifacts become inaccessible at `retention_until`; deletion MUST be scheduled
at expiry, and production deployments MUST document and enforce a physical
purge bound, backup behavior and lawful exceptions before accepting sensitive
work. A metadata expiry alone is not evidence of physical erasure.

The loopback reference deletes expired files on a 250 ms sweep and at shutdown.
It has no encrypted persistence, backup system or auditable purge guarantee;
its privacy labels exercise protocol logic, not a production confidentiality
certification. Do not use it as a hosted confidential-data service.

## Permissions and approval

Required permissions MUST be a subset of the authenticated caller's authorized
grants and the requested `granted_permissions`. Supplying a string in a request
cannot create a permission. The reference token identities authorize only
artifact read/write and video transcoding within their ownership scope.

`human_approval` is `not_required`, `approved` or `pending`. Pending blocks
execution. If the capability requires approval, only `approved` can proceed,
and the production authorization layer MUST verify evidence of approval.
An untrusted caller string is not proof of approval.

## Health admission

Health declares provider identity, status, observation/expiry timestamps, queue,
active jobs, concurrency and source. It is valid only if it belongs to the
selected provider, is not from the future beyond 30 seconds, has a later expiry
than observation and has not expired. Initial admission requires `healthy`.
Degraded/unavailable/stale/unknown providers require explicit failure/retry.
Synthetic checks MUST be authorized, bounded and free of unapproved side effects.
