# ADR-0008: Video Calls — Per-Call Media Mode

## Status

Accepted (2026-07-09)

## Context

Legacy softphone used a global `audioOnly` setting, which forces users into Settings before every video call. Axatalk currently hard-disables video in JsSIP (`video: false`). Full video parity (F-027) must not break existing audio calls, mute, hold, headset, or codecs.

Affected: **F-027**, Media | Telephony | Settings | UI. Layers: Domain → Application → Ports → Adapters → UI.

## Decision

1. **Per-call media mode** — each call carries `mediaMode: "audio" | "video"` chosen at dial/answer time. No global `audioOnly` toggle as the primary UX.
2. **Dual dial actions** — Dialpad keeps audio **Call**; adds **Video call** (camera icon) enabled when number is valid, SIP registered, multi-call policy allows, and local video capture is available (or stub path is allowed).
3. **Privacy-by-default** — video-mode calls negotiate a video m-line, but local camera starts **muted** until the user enables it (OS-1509 intent via `replaceTrack` / track enable in Media adapter).
4. **Single mute path** — camera/mic mute and camera↔screen switch go through Media ports (`replaceTrack` / capture), never dual JsSIP `Session.mute` vs UI paths.
5. **Layering** — capture, stub track, screen share, and stream lifecycle live in Media adapters; Domain owns intent/state facts and events; React only binds projections to `<video>`.
6. **Audio path unchanged until wired** — until adapter WUs land, `buildJsSipCallMediaOptions` remains audio-only; Domain/ports may exist earlier without enabling SDP video.

## Alternatives Considered

| Alternative | Why not |
| --- | --- |
| Global `audioOnly` setting (legacy) | High friction; users forget to toggle |
| Always negotiate video, cam muted | Changes SDP for every call; risk for SBC/external numbers |
| Mid-call audio→video upgrade (v1) | Needs renegotiation; deferred after baseline video |

## Consequences

- Settings keep device prefs, default view, auto-fullscreen, codecs — not a primary audio/video switch.
- Incoming may offer **Answer** (audio) and **Answer with video** when capture allows.
- External/refer targets may force `mediaMode: "audio"` via Domain policy later.
- Video codecs from F-022 become applied when video sessions are enabled.
- Rollback: leave `mediaMode` unused and keep JsSIP `video: false`.

## Architecture Checks

- Domain stays free of MediaStream / JsSIP / React.
- UI does not call gUM or SIP.
- Existing `Call.muted` remains **audio** mute; video mute is a separate Domain fact.
- Critical audio flows stay observable and test-covered.
