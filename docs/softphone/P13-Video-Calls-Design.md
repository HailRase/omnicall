# P13 Video Calls Design

Related: **F-027**, **ADR-0008**, legacy analysis `video-integration/video-integration.md`. Phase: P13.

## Goal

Full behavioral video parity with legacy OS-1509, adapted to Axatalk layers — without copying Redux/MediaStream-in-store or dual mute paths.

## Product UX: media mode (replaces global audioOnly)

| Action | Result |
| --- | --- |
| Dialpad **Call** | `mediaMode: "audio"` — current behavior |
| Dialpad **Video call** | `mediaMode: "video"` — video m-line + privacy muted cam |
| Incoming **Answer** | Prefer audio unless user chooses video answer |
| Incoming **Answer with video** | `mediaMode: "video"` when capture available |

Disabled reasons for Video call (projection keys): invalid number, not registered, multi-call block, video capture unavailable (when stub disabled), hold-all in progress.

Settings retain: preferred cam/mic, default session view, auto-fullscreen for conference patterns, video codec order — **not** a primary audio/video switch.

## Domain facts (no MediaStream)

Per call (projection + events):

```txt
mediaMode: audio | video
localVideoMuted: boolean          // privacy default true for video mode
localVideoSource: camera | screen | none
remoteVideoPresent: boolean       // from SDP / INFO / tracks
sessionView: expanded | hidden | fullscreen
cameraAvailable: boolean          // probe result for this session
```

Audio mute stays `Call.muted` (F-005). Video mute is separate.

## Ports

- Extend capture/session video ops on Media side (new `LocalMediaCapturePort` + video methods on gateway or sibling port).
- `TelephonyGateway.makeCall` / `answerCall` gain optional `mediaMode` (default `"audio"` — backward compatible).
- Adapters own: gUM, stub canvas track, `replaceTrack`, `getDisplayMedia`, `track.onended`, device enumeration.

## Work units

| WU | Scope | Break risk |
| --- | --- | --- |
| WU1 | Domain types, events, pure policy, Media video port contracts, tests | None (audio path untouched) |
| WU2 | Settings schema: devices, defaultView, autoFullscreen; migrate | Low |
| WU3 | Application Use Cases + CallEngine mediaMode plumbing (still audio SDP) | Low |
| WU4 | Browser capture adapter + stub + replaceTrack mute (unit/fake PC) | Medium |
| WU5 | JsSIP video enablement + SDP/INFO no-video + video codecs apply | High — gated |
| WU6 | UI: dual dial buttons, video surfaces, view modes, PiP, screen share | Medium |
| WU7 | Incoming video answer, hold disables video controls, multi-session tabs | Medium |
| WU8 | Manual SBC smoke + registry/STATUS close | — |

## Legacy parity map (intent)

| Legacy | Axatalk |
| --- | --- |
| `audioOnly` setting | Per-call mediaMode + Video call button |
| `initialVideoMute` + post-connect cam-off | Domain `localVideoMuted` + adapter |
| Stub canvas track | Media adapter |
| SIP INFO `no-video-remote` + SDP parse | Adapter → Domain `remoteVideoPresent` |
| SessionView minified/expanded/fullscreen | `sessionView` + UI layouts |
| Screen share replaceTrack | Media Use Case + `onended` |
| Portal `<video>` | UI technique (or equivalent stable element) |
| Dual mute paths | **Forbidden** — single Media path |

## Out of scope (v1 defer)

- Mid-call audio→video upgrade / renegotiation
- System audio in screen share
- Native browser PiP API
- Hardcoded `vconf-sel` only — prefer configurable conference pattern later

## Safety

- Default `mediaMode: "audio"` everywhere until WU5.
- Existing mute/hold/headset/DTMF tests must stay green each WU.
- No MediaStream in Zustand; opaque stream handles or adapter-owned refs bound in UI shell only.
