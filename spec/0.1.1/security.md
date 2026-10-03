# Security and execution receipts

## Transport and identity

Production uses HTTPS. Public metadata is read-only; invocation/transfers and
private metadata require authentication. Bearer, OAuth2 or mTLS adapters MAY
bind identities; each deployment MUST document its authorization mapping.
The loopback reference uses explicit random/test bearer tokens and no cookies.
It refuses public binding and is a development harness, not a public deployment.

Authentication, authorization and artifact ownership are distinct checks.
Provider IDs are claims until bound to trusted endpoint/key/registration evidence.
User-provided grants, caller strings and approval fields do not establish rights.
Provider execution MUST be bounded and isolated according to its threat model.
The FFmpeg reference uses an argument array without a shell, restricts input
protocols to file/pipe, bounds sizes/deadlines and kills canceled work; production
still requires an OS sandbox, persistence, quotas, patched codecs and review.

Core does not fetch arbitrary caller URLs. Manifest/schema loading must avoid
SSRF and arbitrary remote references. Registries need their own safe-fetch DNS,
network-boundary and redirect rules before indexing untrusted providers.

## Signed execution receipt

Every successful Core job MUST make a signed receipt available through
`POST /v1/receipts/get` (`receipt.get` -> `receipt.result`). It binds:

- Protocol, receipt/job/caller/provider IDs and capability/version.
- RFC 8785 SHA-256 of the parameters object.
- Input/output artifact references and raw-byte SHA-256 values.
- Ordered start/finish UTC timestamps and completed status.
- Signature algorithm, trusted key ID and signature bytes.

The signature algorithm is **Ed25519** ([RFC 8032](https://www.rfc-editor.org/rfc/rfc8032)).
Canonicalization is **JCS** ([RFC 8785](https://www.rfc-editor.org/rfc/rfc8785)).
Construct a copy of the receipt whose signature object contains only
`algorithm` and `key_id`, excluding `value`. Canonicalize that complete copy.
The signed bytes are UTF-8:

```text
SPPA-RECEIPT-0.1.1
 + JCS(receipt-with-signature-metadata)
```

Here `
` is one LF byte, not a literal backslash+n. Use Ed25519 directly over
those bytes, not a prehashed signing variant. Encode the 64-byte signature in
unpadded base64url (86 characters). JCS is not pretty-printing or arbitrary
sorted JSON; do not independently reinvent number/string serialization.

## Key discovery and verification

The manifest declares `keys_uri`. The key set binds provider ID, key IDs,
algorithm, Ed25519 public JWK (`kty: OKP`, `crv: Ed25519`, `x`) and validity window.
A verifier MUST use an authenticated/pinned provider key or a trust root it
explicitly accepts, check key validity/revocation at execution time, verify
signature and context, and compare the receipt with the expected provider,
caller, job, capability/version, parameter hash, artifact references and hashes.
Receipt signature checks alone do not establish endpoint ownership.

Downloading a key from the same untrusted host as a receipt is not independent
trust. The demo pins the provider public key through its process-start handshake.
Production needs enrollment/rotation/revocation and historical key retention.
A later rotation does not automatically invalidate legitimate old evidence.

A valid receipt is evidence of a signer's claimed execution. It does not prove
visual quality, goal satisfaction, physical location, or honest provider behavior.
Validators, independent evidence and later evaluation/reputation remain separate.
No verified receipt means no **verified** rating in later releases.

## Optional signed-request profile

`security.signed_requests` is separately advertised. Signed envelopes include
provider ID, caller, nonce, timestamp and expires_at. Sign the envelope using the
same signature-metadata procedure with prefix `SPPA-REQUEST-0.1.1` plus LF.
The request prefix cannot verify as a receipt prefix.

Expiration is at most five minutes in the future; timestamp skew is at most
five minutes. Nonces are at least 16 characters and unique per authenticated
caller until expiration. Verify signature/identity/provider/timing before
recording the nonce atomically, including across replicas/restarts. Replays and
expired/wrong-provider signatures fail authentication. Optional signatures do
not replace authorization. Reference helpers test this profile; the reference
FFmpeg HTTP service does not advertise it and rejects signed requests.
