# Security reporting and scope

Core 0.1.0 is a working draft. The FFmpeg provider is a loopback development
harness with ephemeral keys and in-memory state. It is not a hardened public
service. Production deployment needs persistence, key trust/lifecycle, OS
isolation and storage/purge review described in the specification.

For sensitive findings use this repository's private vulnerability reporting:
https://github.com/theparitt/sppa-protocol/security/advisories/new

Report the affected commit, violated rule, minimal reproduction and expected
impact. Remove credentials, signed transfer URLs and private artifact bytes.
Ordinary specification ambiguities and interoperability defects can use issues.
No security response SLA or external certification is asserted.
