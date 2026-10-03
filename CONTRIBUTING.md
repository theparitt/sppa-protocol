# Contributing

SPPA Core is a working draft. Open a focused issue describing a concrete caller
or provider use case, the rule that prevents interoperability and a proposed
change. Wire changes need matching prose, schemas, examples, API binding and
positive/negative tests. Preserve direct/private operation without public Hub.

Use Node.js 22+ and FFmpeg with libx264. Run `npm ci`, `npm run check`,
`npm run demo`, `npx playwright install chromium` and `npm run test:site`.
GitHub Actions repeats these checks before website publication.

Keep platform/vendor choices out of the protocol contract. Do not advertise
undefined profiles or imply production certification from this reference's
tests. Review the limitations in the conformance chapter before new claims.

Contributions to authored specification and code are provided under Apache-2.0.
Do not include private conversation exports, tokens, signed URLs or user files.
See SECURITY.md for sensitive findings and the governance chapter for releases.
