# Artifacts and transfer

## Identity and ownership

Canonical reference: `artifact://<provider_id>/<artifact_id>`.
Example: `artifact://com.example.ffmpeg/art_12345678`.
The authority identifies a resolver/provider; the opaque resource ID identifies
immutable bytes. Query strings, fragments, relative paths, `file://` references
and traversal are invalid. Reference authority/ID MUST equal artifact metadata.
An identifier does not grant access or expose a filesystem path.

Metadata includes reference, provider/resource ID, authenticated owner, media
type, byte size, SHA-256, privacy, creation/retention timestamps and optional
creating job. `sha256:` followed by 64 lowercase hex digits hashes **raw bytes**.
A provider MUST check ownership/delegation on metadata, transfer, job and receipt
access. To avoid exposing another principal's existence, the reference returns
`not_found` for missing and unowned resources.

Committed bytes and their hash/type/size/creator identity MUST NOT be overwritten.
An edit generates a new artifact. Revisions later add mutable session pointers
over immutable artifacts. Retention deletes access; it does not change bytes
under an existing identity. Expired artifact IDs MUST NOT be recycled.

## Mandatory upload flow

1. `POST /v1/transfers/uploads`, type `transfer.prepare_upload`: declare media
   type, size, SHA-256, privacy and retention seconds.
2. Provider checks authenticated grants, supported type/size/privacy, quotas
   and retention before allocation. It returns `transfer.prepared` (201).
3. Caller PUTs raw bytes to the temporary URL using the descriptor's method
   and explicit authorization mode. Control JSON does not contain file bytes.
4. Provider checks exact size/hash; corruption is `integrity_mismatch` (422).
5. `POST /v1/transfers/complete`, type `transfer.complete`, commits immutable
   metadata only after verified upload. Response is `artifact.metadata` (201;
   repeats may return 200 with the same metadata).

Reference upload states: prepared -> uploaded -> complete. Prepared/uploaded
may become aborted or expired. Complete cannot become writable/aborted.
Completion MUST be atomic with abort/expiry and concurrent completion; pending
bytes are not an invokable artifact. Providers MUST bound reads before buffering.
Failed uploads MAY be retried while the original transfer is still prepared.

`POST /v1/transfers/abort`, type `transfer.abort`, discards uncommitted data
and returns the descriptor with state aborted. Repeated abort is idempotent.
Committed artifacts use retention rather than abort.

## Download flow

`POST /v1/transfers/downloads`, type `transfer.prepare_download`, takes a live
owned reference. It returns a temporary GET URL, expected size/hash and auth
mode. Caller verifies downloaded size/hash against trusted metadata/receipt.
Expired transfer is `transfer_expired`; expired artifact is `not_found`.
A transfer URL MUST NOT outlive artifact authorization or artifact retention.
Aborting a download revokes that transfer's temporary byte endpoint. The artifact
remains immutable and a new authorized download may be prepared. Callers MUST
bound bytes while streaming, reject expired/non-prepared descriptors, and verify
the declared size before buffering unbounded data. The reference client has a
configurable 64 MiB default download memory limit.

Descriptors declare `caller_bearer` or `signed_url`. Caller bearer MUST be sent
only to the authenticated provider origin. A different storage origin needs
explicit, scoped storage authorization (e.g. an expiring signed URL); clients
MUST NOT forward provider credentials automatically or follow auth redirects.
Signed URLs are secrets and MUST be redacted from public logs/registry metadata.

## Metadata, brokering and cross-provider work

`POST /v1/artifacts/get`, type `artifact.get`, returns `artifact.metadata`.
Hub may broker location/permissions; it need not store all bytes. Core can move
output into another provider through authorized download/upload without any
public Hub. This initial resolver is provider-scoped; arbitrary URL fetching
or automatic credential delegation is not part of Core.

Multipart, resumable and server-to-server transfer are reserved future profiles.
They MUST NOT be advertised until their exact integrity, authorization and retry
contracts are defined. Core's explicit mandatory guarantee is direct verified
upload/download. This resolves the source discussion's conflicting release scope
without pretending advanced transfer semantics are already standardized.
