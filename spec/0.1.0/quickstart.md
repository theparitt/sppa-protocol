# Build your first SPPA

Start with one narrow capability and the Core HTTP-artifact profile.

## Install the reference workspace

```bash
git clone https://github.com/theparitt/sppa-protocol.git
cd sppa-protocol
npm ci
npm test
npm run demo
```

Node.js 22+ is required. FFmpeg with libx264 must be installed **on the provider
or conformance-runner machine**. The caller library does not execute FFmpeg.
The committed tiny input video is generated specifically for this repository.
The demo starts a separate provider process, then disables caller software lookup
and transfers/invokes/monitors/downloads/verifies over loopback HTTP.
It is a separate-process demonstration, not a claimed two-machine deployment.

## What to implement

1. Describe one typed capability and enforce its parameter/result schemas.
2. Publish a manifest at `/.well-known/sppa.json`.
3. Bind authenticated callers to authorized permissions and owned artifacts.
4. Implement verified upload/download and immutable artifact metadata.
5. Implement job admission, durable idempotency, deadline/cancel and status.
6. Publish truthful fresh health and structured errors.
7. Produce signed receipts with trusted key enrollment and verification.
8. Run the conformance checks and document remaining deployment requirements.

The reusable examples are under `examples/`; schema files are under
`schemas/0.1.0/`; the HTTP binding is described by `openapi/0.1.0.json`.
Reference helpers are `src/core.mjs` and `src/client.mjs`. The FFmpeg development
provider is `reference/ffmpeg/server.mjs`.

## Start the development provider directly

```bash
SPPA_TOKEN='your-local-test-token' SPPA_CALLER_ID='agent://example' npm run provider
```

Use a generated secret for real tests and keep it out of source control.
The provider binds only loopback and requires an explicit token. Its manifest,
public key and endpoint are printed; private keys and tokens are not printed.
Caller requests use the manifest's endpoint, exact provider/capability versions
and temporary transfer descriptors.

## Move toward production

The reference is intentionally ephemeral. Add transactional persistence/dedup,
key lifecycle, real identity and grant/approval verification, encrypted storage,
physical deletion policy, sandboxing, safe network egress, operational quotas
and observability before public compute deployment. None of these are provided
by the static protocol website. Hub integration is a separate repository/task.
