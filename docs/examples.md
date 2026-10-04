# Examples and implementation evidence

**Private reference · observed 5 October 2026**

## FFmpeg: one capability, two deployments

Both `com.example.ffmpeg` and `com.sppahub.remote.ffmpeg` implement `video.transcode@1.0.0` with H.264 MP4 output and CRF 0–51.

The first uses the local runtime. The second invokes an installed Docker runtime on a separate machine through operator-pinned SSH. They share FFmpeg; these are separate deployments, not independent organizations.

The caller receives candidates and selects explicitly. It uploads immutable bytes, creates an idempotent job, polls, downloads and verifies SHA-256 and a context-bound Ed25519 receipt.

The remote demo checks the fixture's H.264 codec and 64 × 64 dimensions with ffprobe. No H.265, resize, job-specific price, ETA advantage or comparative quality is claimed.

## Background removal: a second kind of software

`com.sppahub.remote.background` implements `image.remove_background@1.0.0`: PNG/JPEG input to a same-sized RGBA PNG.

The real demonstration uses the installed base model on CPU. The 1536 × 1024 output is decoded with Pillow and checked for preserved dimensions and a non-opaque alpha range.

These are structural checks. They do not grade the foreground mask or prove perceptual quality. The existing fast checkpoint was unreadable; the integration leaves it in place.

## Hub independence

The remote demo starts a direct provider job, stops only its own Hub process, polls the provider and downloads the completed result. Discovery and execution can be separate.

The ordinary Hub demo also provides an explicit opt-in gateway. Artifact bytes remain ownership-bound; the Hub stores tracking metadata.

## Reproduce privately

```sh
# Protocol's local HTTP proof
cd sppa-protocol
npm ci
npm run demo

# Hub's multi-provider remote proof
cd ../sppahub
SPPA_REMOTE_CONFIG=/absolute/private/remote-workers.json npm run demo:remote
```

Remote configuration, credentials and known-host pins are operator-provisioned. The command cannot run against an arbitrary machine without those prerequisites. The repositories remain private.

[Hub demo source](https://github.com/theparitt/sppa-hub/blob/main/scripts/demo-remote.mjs) and [remote runtime guide](https://github.com/theparitt/sppa-hub/blob/main/docs/remote-workers.md) document the actual flow and limits.

## What is still a teaching example?

Price, queue and quality comparisons in the [short introduction](why.md) and [Position Paper](position-paper.md) are hypothetical. They are not the results above.

The private target is a selection experiment with enforceable offers, real observed load and recorded caller reasons. Current proof does not complete that target. See the [specification overview](specification-index.md).

