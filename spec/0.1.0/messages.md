# Messages and compatibility

## Canonical envelope

Every control request and response uses `envelope.schema.json`. Manifest and
key discovery are standalone documents; artifact bytes are outside the envelope.

```json
{
  "sppa": "0.1.0",
  "type": "job.create",
  "request_id": "req_12345678",
  "timestamp": "2026-10-03T05:00:00Z",
  "caller": { "id": "agent://example" },
  "idempotency_key": "transcode-12345678",
  "payload": {
    "capability": "video.transcode",
    "capability_version": "1.0.0",
    "input": { "artifact": "artifact://com.example.ffmpeg/art_12345678" },
    "parameters": { "codec": "h264", "crf": 24 },
    "policy": {
      "privacy": "private",
      "execution_location": "remote",
      "data_region": "unspecified",
      "training_use": false,
      "max_retention_seconds": 3600,
      "allow_content_logging": false,
      "granted_permissions": ["artifact.read", "artifact.write"],
      "human_approval": "not_required"
    },
    "deadline": "2026-10-03T05:01:00Z"
  }
}
```

`request_id` correlates transport attempts. `idempotency_key` identifies one
logical invocation across attempts; it is mandatory for create/retry.
The server MUST derive identity from authentication, then compare it with
`caller.id`. The caller field alone grants no authority.

A valid response echoes the request ID and authenticated caller, includes
`provider_id`, and uses the operation's response type. Its timestamp is fresh.
Malformed requests whose correlation/identity cannot be trusted receive a
server-generated request ID and anonymous/authenticated identity as appropriate.
Error payloads MUST NOT expose credentials, private paths or provider internals.

## JSON rules

Control content type is `application/json`. Schema hosts SHOULD use
`application/schema+json`; static hosts MAY use `application/json` with the
explicit dialect and canonical identity in each schema resource.
No unregistered custom content type is required. JSON is UTF-8, finite numbers,
unique object member names, and well-formed Unicode. Integers MUST fit exactly
within the IEEE-754 safe integer range. Clients MUST reject duplicate members
before ordinary JSON parsers discard them. Maximum Core control message size
is 1 MiB and maximum nesting depth is 32.

Timestamps use UTC RFC 3339 with `Z`, seconds 00-59, and optional 1-3 fractional
digits. Leap-second timestamps are outside this initial binding. Request clocks
allow at most five minutes of skew; servers MUST reject older/future requests.
Absolute execution deadlines are distinct from clock skew.

Unknown top-level fields are rejected. `extensions` accepts namespaced keys,
e.g. `com.example.trace`; these do not change Core meaning or grant permissions.
Unknown required behavior MUST be rejected, never silently ignored.

## Identifiers

Provider IDs use lowercase reverse-DNS-style labels, e.g. `com.example.ffmpeg`.
They are names, not sufficient proof of ownership. Authenticated provider
registration, trusted endpoints and keys establish the intended binding.
Capability IDs use lowercase dotted names, e.g. `video.transcode`.
Caller IDs are absolute URIs bound to an authenticated principal.

Resource IDs use their stated prefix (`req_`, `job_`, `art_`, `transfer_`,
`receipt_`) followed by 8-64 URL-safe characters. IDs are opaque, case-sensitive,
and MUST NOT be interpreted as filesystem paths.

## Version contract

`sppa` is the protocol version in both manifest and envelope. `provider_version`
identifies software implementation; capability `version` and requested
`capability_version` identify a specific contract; schema release is separate.
Core 0.1.0 requires exact protocol/capability versions. No automatic fallback
or best-effort downgrade is allowed. Unsupported protocol versions return
`unsupported_version`; unsupported capability versions return a constraint error.

Draft snapshots are pinned by commit. Future releases will use immutable tags
and versioned schema paths. Breaking contract changes require a new protocol
version; provider implementation patches do not alter the wire contract.
