# Video Call Refactoring Plan

## Document Control

- **Feature:** F-027 — Video Calls
- **Branch:** `video-refactorin`
- **Primary bounded context:** Media
- **Integrated contexts:** Telephony, Settings, Integration, Renderer UI
- **Architecture baseline:** ADR-0008, `docs/softphone/Architecture-Constitution.md`
- **Source audit:** 40 edge cases, EC-01 through EC-40
- **Plan language:** English
- **Execution model:** one work unit per agent session unless the work unit explicitly says otherwise
- **Current status:** planning complete; implementation not started
- **Branch naming note:** `video-refactorin` is intentional and exactly matches the branch name
  requested by the repository owner.

This document is the source of truth for the video-call refactoring track. Every implementation
agent must read it before changing code, claim exactly one eligible work unit, implement it,
verify it, update this file, and leave the repository in a state that the next agent can
understand without reading previous chats.

---

## 1. Refactoring Objective

The current product already has a real end-to-end video path:

```text
Renderer intent
  -> Application Facade / Use Case
  -> CallEngine orchestration
  -> Telephony and Media ports
  -> JsSIP + browser/Electron adapters
  -> RTCPeerConnection
  -> renderer projections and video surfaces
```

The goal is not to replace this path. The goal is to make it:

1. protocol-correct for SIP/SDP one-way and bidirectional video;
2. transaction-safe when capture, answer, transfer, recovery, or source switching fails;
3. understandable to users when video is unavailable or degraded;
4. observable without exposing SDP, IP addresses, credentials, or customer data;
5. deterministic under races, repeated clicks, device changes, and stale asynchronous work;
6. testable with mock adapters, fake media, adapter integration tests, and final SBC evidence;
7. modular enough that JsSIP, Electron capture, and renderer layout remain replaceable details.

Audio continuity has higher priority than video continuity. Camera activation always requires
clear user intent. A video failure must not silently corrupt or unnecessarily terminate a usable
audio call.

---

## 2. Non-Negotiable Architecture

### 2.1 Dependency direction

```text
Renderer components
  -> renderer shell/action hooks
  -> Application projections / Facade / Use Cases
  -> Domain media facts and policies
  -> Ports
  -> JsSIP / Browser Media / Electron adapters
  -> Infrastructure composition
```

### 2.2 Ownership

- **Domain**
  - immutable video negotiation and media-health facts;
  - pure transition policies;
  - semantic reason codes;
  - Domain Events;
  - no `MediaStream`, `RTCPeerConnection`, React, Electron, JsSIP, browser, or timers.
- **Application**
  - transaction ordering, rollback, operation serialization, retries, and cross-context
    orchestration;
  - Use Cases and application services;
  - user-facing projections containing translation keys, never localized sentences.
- **Ports**
  - typed capabilities and outcomes;
  - opaque handles instead of browser or JsSIP objects.
- **Adapters**
  - SDP parsing, JsSIP event mapping, `getUserMedia`, track lifecycle, `replaceTrack`,
    `getStats`, HTML media playback, Electron display capture, and external error
    normalization.
- **Renderer stores**
  - event-to-read-model projection only;
  - no commands, timers, SIP, Electron, or media APIs.
- **Renderer hooks**
  - shell derivation and intent forwarding;
  - Electron display-source calls remain isolated in the existing integration boundary and
    must use typed preload APIs.
- **Renderer components**
  - presentational props and callbacks only;
  - all visible strings translated in `ru`, `en`, `fr`, `de`, and `bg`;
  - existing UI Kit primitives and semantic icons only.

### 2.3 Call state

Do not add video states to the primary call FSM. It remains:

```text
Idle -> Ringing / Connecting -> Active <-> Held
  -> Transferring / Conference -> Ending -> Ended
  -> Failed
```

Video is an orthogonal per-call state machine.

### 2.4 Proposed target video model

Do not keep adding meaning to `remoteVideoPresent: boolean`. Introduce explicit facts, using
final names selected in ADR-VR-001:

```text
VideoNegotiationState
  = none
  | offered
  | negotiating
  | active
  | rejected
  | failed

VideoDirectionState
  localSendNegotiated: boolean
  remoteSendNegotiated: boolean
  videoMLineAccepted: boolean

LocalVideoCaptureHealth
  = unavailable
  | permissionDenied
  | ready
  | stub
  | interrupted
  | failed

RemoteVideoMediaHealth
  = unknown
  | waiting
  | flowing
  | interrupted
  | failed

VideoOperationState
  = idle
  | capturing
  | switchingSource
  | synchronizingSender
  | renegotiating
  | recovering
```

Keep compatibility selectors while migrating existing UI. Do not perform a flag-day rewrite.

---

## 3. Product Defaults Used by This Plan

These defaults resolve the open audit questions. Changing one requires updating this plan and,
when behavior or architecture changes materially, an ADR.

1. A call may continue as receive-only video or audio when the local camera is unavailable.
2. Never silently convert an explicit video-call intent into audio. Offer a one-click
   **Continue without video** action.
3. Support valid SDP `sendrecv`, `sendonly`, `recvonly`, and `inactive` directions.
4. Auto-answer remains audio-only by default.
5. Local hold temporarily disables the local camera track while preserving the user's previous
   camera intent for resume. Remote hold does not automatically change local camera intent.
6. Hidden view is layout-only. It must never imply camera mute; a persistent camera-on indicator
   is required.
7. Only one unheld local video sender is supported in v1. Multiple calls may retain negotiated
   receive capability, but background/held local send is paused by policy.
8. Mid-call upgrade is implemented only after baseline fixes and the negotiation queue are
   complete.
9. System audio sharing remains out of scope; the picker must state this clearly.
10. Automatic media retries are bounded. No infinite polling, intervals, or retry loops.
11. Video telemetry is local/structured by default and must not include raw SDP, candidate IPs,
    phone numbers beyond approved call identifiers, credentials, or media content.
12. **EC-03:** while the incoming SDP offer is unknown, show a disabled Video action with a
    localized “Checking video availability” reason. Do not hide it and do not allow activation.
13. **EC-09:** a failed video-answer attempt must not cause a lasting or user-perceptible
    interruption to an existing active call. Capture preparation happens before hold; rollback is
    mandatory after later failures.
14. **EC-11:** do not automatically switch to another physical camera during an active call.
    Mark capture interrupted and ask the user to retry or choose a device. Pre-call fallback to
    system default remains allowed under item 1.
15. **EC-13:** playback retry is triggered by an explicit click/keyboard activation on the
    recovery action; do not infer an unrelated click as consent.
16. **EC-23:** Application owns the per-call negotiation queue and retry policy. The JsSIP
    adapter executes one typed negotiation attempt and normalizes readiness, 491, 500,
    `Retry-After`, timeout, and rejection.
17. **EC-24:** use a five-second first-frame grace period. After video has flowed, classify it as
    interrupted only after two consecutive two-second samples show no frame/byte progress.
    Constants live in Application policy and are fake-clock tested.
18. **EC-26:** changing the active line is allowed while the display-source picker is open, but
    it immediately cancels and closes that picker.
19. **EC-27:** source thumbnails do not auto-refresh. Provide an explicit Refresh action and use
    generation guards for every request.
20. **EC-29:** prefer seamless `replaceTrack` within the existing 1920x1080, 30 fps envelope.
    Use controlled renegotiation only after `InvalidModificationError` or a proven incompatible
    sender envelope.

---

## 4. Agent Operating Protocol

### 4.1 Before claiming work

1. Read:
   - `AGENTS.md`
   - `.cursor/rules/00-core.mdc`
   - `.cursor/rules/typescript-react-electron.mdc`
   - `.cursor/rules/testing-observability.mdc`
   - `.cursor/rules/feature-registry.mdc`
   - `.cursor/rules/legacy-feature-coverage.mdc`
   - `.cursor/rules/i18n.mdc`
   - `.cursor/rules/ui-kit.mdc` and i18n rules when touching renderer UI
   - `docs/softphone/MASTER_SYSTEM_PROMPT.md`
   - `docs/softphone/Architecture-Constitution.md`
   - `docs/softphone/Engineering-Principles.md`
   - `docs/softphone/UI-Architecture.md`
   - `docs/softphone/Feature-Registry.md` — F-027
   - `docs/softphone/Legacy-Feature-Coverage.md`
   - `docs/softphone/I18N-Coverage.md` when visible copy changes
   - `docs/softphone/adr/ADR-0008-video-calls-media-mode.md`
   - this plan
2. Inspect `git status` and preserve unrelated user changes.
3. Select the first `pending` work unit whose dependencies are `done`.
4. Change its status to `in_progress`, add agent/date/start commit, and create a dedicated local
   claim commit before production edits. Push the claim only when the user's assignment includes
   push. Never claim two work units. This track is sequential; a second agent must not claim work
   while any WU is `in_progress`.
5. Re-verify current code. File names in this plan are expected locations, not permission to
   blindly patch stale code.

### 4.2 During implementation

- Work vertically when possible: Domain -> Application -> Ports -> mock -> projections -> UI ->
  real adapter.
- Add tests before or with behavior.
- Preserve audio-only behavior and SIP-only bootstrap.
- Use typed `Result` outcomes and `catch (error: unknown)`.
- Publish Domain Events for user-observable media-state changes.
- Include `correlationId`, `featureId: "F-027"`, bounded context, operation, result, and normalized
  error in critical logs.
- Never log raw SDP, tokens, passwords, media content, or unredacted ICE candidates.
- If a required product decision conflicts with Section 3, stop and mark the work unit
  `blocked`; do not improvise a different product contract.

### 4.3 Completion protocol

An agent may mark a work unit `done` only when:

1. every listed EC acceptance criterion is met;
2. required tests pass;
3. lint/typecheck for touched code pass;
4. i18n parity and UI catalog checks pass when applicable;
5. Feature Registry/test evidence is updated if behavior changed;
6. this plan records:
   - status;
   - completion date;
   - commit hash;
   - key files;
   - verification commands and result;
   - concise implementation note;
7. a work-history entry is created;
8. changes are committed without unrelated files.

If external SBC or hardware access is required, mark the code portion `done` and the work unit
`blocked_external` until evidence is recorded. Do not falsify PASS.

### 4.4 Stale claim and plan-conflict protocol

- Never steal or overwrite an `in_progress` work unit.
- Inspect its claim commit, branch history, execution-state block, and handoff.
- If there is no completion handoff, ask the repository owner whether to resume or release the
  claim. Only the owner may reset it to `pending`.
- Before updating this plan, fetch and fast-forward only when possible. If local and remote
  histories diverge, stop and ask the repository owner for the repository's approved integration
  workflow. Resolve progress-board conflicts field-by-field; never choose “ours” or “theirs” for
  the whole file.
- A WU that creates only architecture foundations must not mark downstream ECs closed. EC closure
  belongs to the primary WU in Section 7.

---

## 5. Progress Board

Allowed status values: `pending`, `in_progress`, `blocked`, `blocked_external`, `done`,
`superseded`.

| WU | Scope | EC coverage | Depends on | Status | Commit / evidence |
|---|---|---|---|---|---|
| VR-00 | ADR + Domain contracts + migration skeleton | Foundation only; closes no EC | — | pending | — |
| VR-01 | Immediate UX/media correctness | EC-02, 03, 25 | VR-00 | pending | — |
| VR-02 | SDP direction and negotiation projection | EC-04, 05, 24 | VR-00 | pending | — |
| VR-03 | Capture preflight, typed failures, fallback transactions | EC-06–10 | VR-00 | pending | — |
| VR-04 | Device and local-track lifecycle | EC-10, 11 | VR-03 | pending | — |
| VR-05 | Playback, media health, PC recovery, QoS | EC-12–16, 35 | VR-02, VR-04 | pending | — |
| VR-06 | Transfer cleanup and command serialization | EC-17, 18 | VR-00 | pending | — |
| VR-07 | Disabled reasons, accessibility, view semantics | EC-19, 20, 37, 38 | VR-03, VR-05 | pending | — |
| VR-08 | Negotiation queue and mid-call upgrade | EC-21–23, 29 | VR-02, VR-05, VR-06 | pending | — |
| VR-09 | Screen-share lifecycle and picker hardening | EC-26–31 | VR-06, VR-08 | pending | — |
| VR-10 | Mock parity, multi-call, hold, auto-answer policy | EC-32–34, 39 | VR-03, VR-06 | pending | — |
| VR-11 | Codec/SBC failure recovery UX | EC-36 | VR-02, VR-03 | pending | — |
| VR-12 | Automated video regression harness | EC-40 | VR-01–11 | pending | — |
| VR-13 | Final real SBC gate and documentation close | EC-01 | VR-01–12 | pending | — |

### Work-unit execution state

```text
Next eligible work unit: VR-00
Current active agent: —
Started at: —
Base commit: —
Last completed work unit: —
Known blockers: target SBC credentials/endpoints are required only for VR-13
```

Every agent must update this block before handoff.

---

## 6. Work Unit Specifications

## VR-00 — Architecture Decision and Migration Skeleton

### Purpose

Prevent forty local fixes from creating another boolean-driven media model. Establish the
protocol and state vocabulary all later work units use.

### Implementation

1. Create `docs/softphone/adr/ADR-VR-001-video-negotiation-and-media-health.md`.
2. Define the separation between:
   - negotiated video m-line;
   - local send direction;
   - remote send direction;
   - local capture health;
   - remote media health;
   - operation-in-flight state.
3. Specify compatibility migration from `CallVideoMediaState.remoteVideoPresent`.
4. Implement the Domain types, events, pure transitions, compatibility selectors, and tests.
   VR-00 is not docs-only. It must not wire JsSIP, browser media, Application orchestration, or UI;
   those belong to later WUs.
5. Define events such as:
   - `CallVideoNegotiationChanged`;
   - `LocalVideoCaptureHealthChanged`;
   - `RemoteVideoMediaHealthChanged`;
   - `VideoOperationChanged`;
   - `VideoRecoveryRequested/Succeeded/Failed`.
   Final names may differ, but each fact needs one canonical owner.
6. Define invalid transitions and terminal cleanup.
7. Update F-027 acceptance criteria and test strategy without setting it to `implemented`.

### Expected result

Every later agent can answer whether a value represents signaling, capture, transport, or UI.
No adapter object leaks into Domain. Existing consumers can migrate incrementally. VR-00 closes
no audit EC by itself; it only provides the contracts required by the primary WUs in Section 7.

### Verification

- Domain types compile without DOM libs.
- Pure transition tests cover defaults, invalid transitions, cleanup, and compatibility selectors.
- `npm run registry:check`.

### Completion record

- Status: `pending`
- Commit: —
- Files: —
- Verification: —
- Notes: —

---

## VR-01 — Immediate UX and Audible Media Correctness

### Covered edge cases

#### EC-02 — Duplicate remote audio

- **Why:** `event.streams[0]` may contain audio and video while a dedicated audio element already
  plays the same remote stream.
- **How:**
  1. Make the dedicated remote audio element the only audible sink.
  2. Bind a video-only `MediaStream` to both remote video targets, including swapped PiP.
  3. Set all remote/local preview `<video>` elements to muted as a defense-in-depth invariant.
  4. Preserve output-device routing through the audio path.
- **Result:** swapping or rebinding video never changes audio volume, route, or number of sinks.
- **Tests:** a mixed audio/video stream yields exactly one audible element; swap and fullscreen
  preserve it.

#### EC-03 — Early “Answer with video”

- **Why:** `null` currently means “still detecting” but is treated as enabled.
- **How:**
  1. Model `unknown`, `offered`, and `notOffered` explicitly in the incoming projection.
  2. Until `offered`, render a disabled video action with localized “Checking video offer” reason.
  3. Guard the action hook as well as the component.
  4. Cancel stale detection when the call ends.
- **Result:** camera capture cannot start before an active video m-line is confirmed.
- **Tests:** `unknown -> offered`, `unknown -> notOffered`, click during unknown, call ends first.

#### EC-25 — Downgrade shown as an error

- **Why:** normal capability negotiation is not an application failure.
- **How:** change the descriptor to informational severity and copy: “The other party does not
  support video. The call continues with audio.” Keep the call active.
- **Result:** users understand what happened without believing the call failed.
- **Tests:** one localized announcement, no error styling, no duplicate notification.

### Expected files

- `src/adapters/media/browser/peerConnectionMedia.ts`
- `src/adapters/media/browser/peerConnectionMedia.test.ts`
- `src/renderer/components/call/CallVideoSurface.tsx`
- `src/renderer/hooks/useIncomingCallActions.ts`
- incoming projections/tests
- `src/renderer/hooks/useVideoCallNotifications.ts`
- all locale catalogs and component tests

### Gate

Run targeted tests, `npm run i18n:check`, `npm run lint`, and `npm run typecheck`.

### Completion record

- Status: `pending`
- Commit: —
- Files: —
- Verification: —
- Notes: —

---

## VR-02 — Protocol-Correct SDP Direction and Negotiation Projection

### Covered edge cases

#### EC-04 — One-way video collapsed into one boolean

- **Why:** remote `recvonly` means the local endpoint may send video; it does not mean the video
  m-line is rejected.
- **How:**
  1. Return a typed SDP video description, not a boolean:
     `mLinePresent`, `accepted`, `remoteDirection`, `localMaySend`, `remoteMaySend`.
  2. Interpret offer and answer from the correct local/remote perspective.
  3. Gate inbound “Answer with video” on an accepted video m-line and allowed local send, not on
     whether the remote can send.
  4. Downgrade only unsupported directions; do not destroy a valid one-way session.
- **Result:** `sendrecv`, `sendonly`, `recvonly`, and `inactive` behave predictably.
- **Tests:** complete offer/answer direction matrix for inbound and outbound.

#### EC-05 — Session-level direction ignored

- **Why:** RFC 8866 allows session-level direction inherited by media sections.
- **How:**
  1. Parse session attributes before the first `m=`.
  2. Apply session direction as the default.
  3. Let media-level direction override it.
  4. Continue scanning after malformed or rejected video sections where safe.
  5. Keep the parser isolated in the JsSIP adapter package.
- **Result:** session-level hold or one-way declarations are not misreported.
- **Tests:** RFC corpus including session inheritance, override, multiple video sections, port 0,
  malformed ports, CRLF/LF.

#### EC-24 — SDP/INFO/track flapping

- **Why:** signaling capability and flowing media have different lifecycles.
- **How:** SDP updates negotiation facts; track/frames update media health; legacy SIP INFO may
  update remote capability with source metadata but must not directly overwrite flowing state.
  Apply a bounded grace period in Application, never Domain.
- **Result:** placeholders do not flicker during normal renegotiation or track replacement.
- **Tests:** SDP true -> temporary track mute -> flowing; INFO false -> later SDP active; stale
  event order.

### Expected files

- replace or evolve `detectRemoteVideoPresence.ts`
- typed JsSIP adapter notifications and ports
- Domain media negotiation types/events
- `CallEngine` mapping
- application/renderer projections
- tests at each layer

### Gate

No raw SDP outside the adapter. No `any`, no browser types in Domain, no status change without an
event.

### Completion record

- Status: `pending`
- Commit: —
- Files: —
- Verification: —
- Notes: —

---

## VR-03 — Capture Preflight, Typed Failures, and Fallback Transactions

### Covered edge cases

#### EC-06 — Hardcoded capture availability

- **Why:** UI currently promises video regardless of adapter or permission state.
- **How:** remove hardcoded `true`. Do not repeatedly open the camera on dialpad render. On video
  intent, execute an application capture-preparation Use Case that returns:
  `ready`, `receiveOnly`, `permissionDenied`, `deviceMissing`, `deviceBusy`, or `failed`.
- **Result:** the user receives a deterministic choice without background permission prompts.
- **Tests:** unavailable adapter, no device, denied, busy, and stale result.

#### EC-07 — Every camera failure becomes an invisible stub

- **Why:** denial, no hardware, busy hardware, and invalid constraints require different recovery.
- **How:** normalize DOM exceptions at the adapter boundary; preserve a stub only as a negotiated
  transport technique; publish capture health and show a reason/action banner.
- **Result:** users know whether to grant permission, select a device, close another application,
  or continue receive-only/audio.
- **Tests:** `NotAllowedError`, `NotFoundError`, `NotReadableError`, `OverconstrainedError`,
  `AbortError`, unknown.

#### EC-08 — Outbound capture failure ends the call

- **Why:** camera failure should not prevent a usable audio call.
- **How:** preflight before creating the call. On video-specific failure show:
  **Retry camera**, **Continue without video**, **Open settings**, **Cancel**. Never auto-redial
  without explicit intent. Microphone failure remains blocking.
- **Result:** one user action creates at most one SIP call and preserves intent.
- **Tests:** each choice, retry success, cancel, microphone failure, duplicate click.

#### EC-09 — Failed incoming video answer already holds other calls

- **Why:** hold-all occurs before capture and SIP answer.
- **How:**
  1. prepare capture;
  2. snapshot active-line/hold state;
  3. hold required lines;
  4. answer SIP;
  5. commit media projection;
  6. on failure release capture, restore previous lines, and restore incoming projection.
- **Result:** a failed answer attempt leaves the prior call exactly as it was and the incoming call
  actionable.
- **Tests:** active A + incoming B + capture/hold/answer failure at every step.

#### EC-10 — Stale preferred device

- **Why:** exact device IDs may disappear after reboot or USB changes.
- **How:** when an exact ID is missing, attempt system default once, preserve the saved preference,
  and notify the user. Do not loop. Add a settings action to select/persist a replacement.
- **Result:** calls continue with an explicit fallback and settings remain understandable.
- **Tests:** missing mic/camera, default success/failure, device returns later.

### Architecture

Introduce a narrow capture-preparation Use Case and typed port outcomes. Do not call
`getUserMedia` from renderer hooks. Ensure rollback belongs to Application orchestration.

### Gate

All supported locales, tests for success/failure/rollback, no hidden automatic redial.

### Completion record

- Status: `pending`
- Commit: —
- Files: —
- Verification: —
- Notes: —

---

## VR-04 — Device and Local Track Lifecycle

### Covered edge cases

#### EC-10 continuation — Runtime device changes

- **Why:** device IDs and availability can change after bootstrap, while Settings currently refreshes
  only on explicit entry/action.
- **How:**
  1. add a media-device change subscription port or callback owned by the browser adapter;
  2. debounce bursts and re-enumerate through Application;
  3. update settings and call projections without silently mutating the selected device;
  4. detach the listener on facade/application disposal.
- **Expected result:** unplugged or newly attached devices are reflected without stale UI, while
  user preferences remain explicit.
- **Tests:** bursty `devicechange`, unplug selected/default device, add replacement, dispose,
  and stale event after logout.

#### EC-11 — Camera track ended or technically muted

- **Why:** unplug, permission revoke, and source interruption leave the UI claiming the camera is
  active.
- **How:**
  1. attach and clean up `ended`, `mute`, and `unmute` listeners on every local camera track;
  2. use a generation token so replaced tracks cannot publish stale events;
  3. map events to capture-health notifications;
  4. disable camera control only when appropriate and offer retry/device selection;
  5. never interpret technical `track.muted` as user mute.
- **Expected result:** UI truth matches the physical capture source; the app waits for explicit
  retry or device choice instead of silently switching cameras.
- **Tests:** unplug, revoke, temporary mute/unmute, replacement, release, and stale old-track event.

### Gate

No listener leaks. Camera release always turns off the device. Domain receives semantic health,
not `MediaStreamTrack`.

### Completion record

- Status: `pending`
- Commit: —
- Files: —
- Verification: —
- Notes: —

---

## VR-05 — Playback, Media Health, PeerConnection Recovery, and QoS

### Covered edge cases

#### EC-12 — Live track with zero frames

- **Why:** an SDP section or non-ended receiver track does not prove that usable video frames are
  arriving or decoding.
- **How:**
  1. implement a bounded remote-video health monitor after the five-second activation grace
     period;
  2. use `getStats` deltas for bytes and decoded frames;
  3. require two consecutive two-second no-progress samples before interruption;
  4. publish `waiting`, `flowing`, `interrupted`, and `failed` health facts;
  5. keep audio active during video interruption.
- **Expected result:** a black/frozen stream is distinguishable from a negotiated and flowing
  stream without false failure during normal startup.
- **Tests:** delayed first frame, zero frames, freeze, recovery, stats missing/rejected, and audio
  continuity.

#### EC-13 — Playback rejection swallowed

- **Why:** swallowed playback failures make projections claim success while the user hears or sees
  nothing.
- **How:**
  1. normalize `HTMLMediaElement.play()` failures;
  2. log with call correlation and media kind;
  3. expose a recoverable projection and explicit click/keyboard retry action;
  4. ensure retries do not add duplicate listeners or sinks.
- **Expected result:** blocked playback is visible, actionable, and does not require restarting
  the call.
- **Tests:** `NotAllowedError`, `AbortError`, unknown rejection, explicit retry success/failure,
  and duplicate-sink prevention.

#### EC-14 — ICE/PeerConnection failure invisible

- **Why:** network changes, sleep, ICE failure, and PC replacement currently leave frozen video
  without a truthful recovery state.
- **How:**
  1. listen to `connectionstatechange`, `iceconnectionstatechange`, and relevant ICE errors inside
     the adapter;
  2. map transient and terminal states to typed notifications;
  3. let Application own bounded recovery policy and user-facing state;
  4. do not terminate the SIP dialog solely because video fails if audio remains usable.
- **Expected result:** transient loss shows recovery, terminal video failure degrades to a usable
  audio call, and stale PC events are ignored.
- **Tests:** disconnected->connected, failed, network switch, sleep/resume, old-PC event, call end,
  and audio survival.

#### EC-15 — New PeerConnection lacks sender sync

- **Why:** sender synchronization currently runs for initial inbound answer, not every replacement
  PeerConnection.
- **How:** on every new connection for a video call, idempotently:
  1. bind local capture to the outbound sender;
  2. rebind remote audio/video;
  3. reset health sampling;
  4. reapply user mute and source intent;
  5. protect against stale old-connection callbacks.
- **Expected result:** hold/re-INVITE/recovery cannot leave the remote side with black local video
  until the user toggles camera.
- **Tests:** PC A->B with camera on/off, stub, screen source, stale A events, and cleanup.

#### EC-16 — Sender sync exhaustion returns success

- **Why:** returning `ok` after all attempts creates a false success state.
- **How:**
  1. return a typed degraded/failure result and publish an explicit failure event;
  2. make UI transmission state independent from user camera intent;
  3. offer one bounded retry through Application;
  4. clear the failure after proven sender synchronization.
- **Expected result:** “camera enabled” and “camera transmitting” are never conflated.
- **Tests:** exhaustion, late success, manual retry, call end during retry, and no infinite loop.

#### EC-35 — No video QoS diagnostics

- **Why:** support cannot distinguish codec, CPU, bandwidth, packet-loss, or decode problems.
- **How:**
  1. collect redacted, bounded stats: codec summary, frame dimensions/rate, packet loss, jitter,
     freeze count, quality-limitation reason, and candidate type only;
  2. never log raw IPs, SDP, or media;
  3. stop timers on call end, PC replacement, logout, and application disposal;
  4. expose only threshold-derived health to UI, not raw reports.
- **Expected result:** support has privacy-safe diagnostics and UI has stable health states.
- **Tests:** all supported stat shapes, omitted fields, rejection, redaction, thresholds, fake-clock
  sampling, and timer disposal.

### Expected result

Users see whether video is waiting, flowing, interrupted, or failed and can recover without losing
audio. Support receives useful, privacy-safe diagnostics.

### Gate

Fake-clock tests prove bounded timers and cleanup. Stats rejection is non-fatal. No infinite
polling.

### Completion record

- Status: `pending`
- Commit: —
- Files: —
- Verification: —
- Notes: —

---

## VR-06 — Transfer Cleanup and Video Command Serialization

### Covered edge cases

#### EC-17 — Ended during REFER skips cleanup

- **Why:** suppressing the complete terminal callback while REFER is in flight can also suppress
  the only media-release path.
- **How:**
  1. separate idempotent media cleanup from business `CallEnded` dispatch;
  2. never suppress capture release or peer-connection unbind because REFER is in flight;
  3. if business callback must be deferred, record a deferred terminal event and replay it after
     REFER settles;
  4. make all release paths exactly-once observable.
- **Result:** blind/attended transfer never leaves camera or screen capture active.
- **Tests:** session ended during REFER success/failure, callback once, media released once.

#### EC-18 — Rapid camera/screen operations race

- **Why:** fire-and-forget controls allow stale capture and replacement promises to overwrite the
  user's latest intent and leak tracks.
- **How:**
  1. add a per-call Application command coordinator;
  2. use monotonic operation IDs or cancellation/generation tokens;
  3. define latest-intent-wins for camera/source actions;
  4. disable conflicting controls and expose `VideoOperationState`;
  5. release tracks created by stale operations before returning.
- **Result:** repeated clicks cannot leak tracks or commit stale projection state.
- **Tests:** double toggle, camera -> screen -> camera, operation -> hangup, stale completion.

### Gate

No generic global mutex. Coordination is per call, disposable, and independent of React.

### Completion record

- Status: `pending`
- Commit: —
- Files: —
- Verification: —
- Notes: —

---

## VR-07 — Disabled Reasons, Accessibility, and View Semantics

### Covered edge cases

#### EC-19 — Disabled controls have no reason

- **Why:** a disabled camera or screen action with its normal label does not explain what the user
  must do next.
- **How:** derive semantic reasons in Application, pass them through shell hooks, and use existing
  UI Kit tooltip/live-region behavior. Cover Held, Connecting, registration loss, no camera,
  operation in progress, and hidden view.
- **Expected result:** every disabled critical video action explains the cause and recovery.
- **Tests:** mouse, keyboard, and screen-reader behavior for every reason in all supported locales.

#### EC-20 — PiP swap is pointer-only

- **Why:** a clickable/drag-only `div` excludes keyboard and assistive-technology users.
- **How:** add an explicit keyboard-accessible UI Kit action for swap, keep drag as optional
  pointer enhancement, and preserve visible focus and screen-reader labels.
- **Expected result:** swap, hide, and show are available without a pointer; drag behavior remains
  unchanged.
- **Tests:** Tab, Enter, Space, focus visibility, label announcement, pointer drag, and swap during
  fullscreen.

#### EC-37 — Hidden view confused with camera off

- **Why:** hiding surfaces while continuing transmission can be interpreted as a privacy action.
- **How:** rename copy to “Hide video on this device” or equivalent, keep a camera-state indicator
  visible whenever transmitting, and keep Hidden layout-only.
- **Expected result:** users can always tell whether their camera is transmitting, even with video
  surfaces hidden.
- **Tests:** hide while camera on/off, screen sharing, screen reader copy, five locales, both
  themes.

#### EC-38 — Conference substring false positives

- **Why:** free substring matching can unexpectedly expand ordinary calls and disrupt focus.
- **How:** keep default off, normalize matching, require exact normalized-number equality without
  regex or substring behavior, show a settings preview, and defer server metadata to a typed
  future integration.
- **Expected result:** auto-fullscreen activation is predictable and testable.
- **Tests:** empty, exact, formatted-number equivalence, prefix non-match, false substring,
  multiple displays, and
  incoming call during fullscreen.

### Expected result

Every video control is keyboard accessible, has a reason when disabled, and accurately explains
privacy versus layout.

### Gate

Read UI Kit and visual spec first. Update five locales, component tests, stories for both themes,
icon registry only if a new semantic icon is necessary, update
`docs/softphone/I18N-Coverage.md`, and run UI catalog checks.

### Completion record

- Status: `pending`
- Commit: —
- Files: —
- Verification: —
- Notes: —

---

## VR-08 — Negotiation Queue and Mid-Call Upgrade

### Covered edge cases

#### EC-21 — Remote video re-INVITE ignored

- **Why:** an audio-mode call currently ignores a remote video offer, leaving protocol and UI
  intent undefined.
- **How:** parse remote upgrade intent into a typed notification; allow a receive-only prompt
  without opening camera; require consent for local send; reject unsupported upgrades while
  preserving audio.
- **Expected result:** every remote upgrade is explicitly accepted, rejected, or awaiting consent.
- **Tests:** remote `sendrecv`, `sendonly`, `recvonly`, `inactive`, accept, reject, timeout, and call
  end before choice.

#### EC-22 — Local audio-to-video upgrade absent

- **Why:** users must currently end a valid audio call and redial to add video.
- **How:** add an explicit Use Case after the negotiation queue exists. Flow:
  1. user requests upgrade;
  2. capture preparation;
  3. add/replace sender track;
  4. wait for `isReadyToReOffer`;
  5. JsSIP `renegotiate` using re-INVITE by default;
  6. commit negotiation state on accepted answer;
  7. rollback sender/capture/projection on rejection or timeout.
- Never activate camera before consent.
- **Expected result:** local upgrade is transactional and leaves the original audio call intact on
  every failure.
- **Tests:** accepted upgrade, 488, 491, timeout, remote reject, capture failure, and hangup.

#### EC-23 — Hold/upgrade glare

- **Why:** overlapping local/remote offers can produce 491/500, lost intent, or divergent SDP.
- **How:** Application owns one per-call queue and retry policy; serialize local offers, honor
  readiness, handle 491 with bounded randomized retry and 500 with `Retry-After`, and cancel on
  call end. JsSIP adapter performs one typed attempt only.
- **Expected result:** no two local offers overlap and remote glare has one deterministic recovery
  path.
- **Tests:** local hold+upgrade, remote re-INVITE+local action, 491 timing, 500/Retry-After, queue
  cancellation, and retry exhaustion.

#### EC-29 — Screen replace requires renegotiation

- **Why:** `replaceTrack` can reject a screen track outside the negotiated sender envelope.
- **How:** constrain to 1920x1080/30fps, try seamless replacement first, route
  `InvalidModificationError` through the shared negotiation queue, and roll back the camera track
  on failure.
- **Expected result:** screen switching is seamless in the common case and transaction-safe when
  renegotiation is required.
- **Tests:** replace success, invalid modification, renegotiation success/488/491, rollback,
  and call end during transition.

### Expected result

Local and remote upgrades, hold, resume, and screen changes cannot create overlapping offers or
leave SDP and media state divergent.

### Gate

This WU requires an ADR amendment or a new ADR because ADR-0008 explicitly deferred mid-call
upgrade. Tests must cover 488, 491, 500/Retry-After, timeout, remote rejection, hold collision, and
hangup.

### Completion record

- Status: `pending`
- Commit: —
- Files: —
- Verification: —
- Notes: —

---

## VR-09 — Screen-Share Lifecycle and Picker Hardening

### Covered edge cases

#### EC-26 — Call ends while picker is open

- **Why:** a picker-local call ID can become stale while loading or confirming a source.
- **How:** bind state to call/session identity; close and clear pending source on call end,
  line switch, logout, and disposal; validate current video state immediately before confirm.
- **Expected result:** a picker can never start capture for an ended or no-longer-active target.
- **Tests:** call end, line switch, logout, and incoming overlay during load and confirm.

#### EC-27 — Stale display-source response

- **Why:** late promises can repopulate a cancelled or newly opened picker with stale sources.
- **How:** add request-generation tokens, ignore stale completions, catch typed preload rejection,
  add an explicit Refresh action, and do not auto-refresh thumbnails.
- **Expected result:** source data always belongs to the current picker request and call.
- **Tests:** cancel-before-resolve, reopen for another call, two refreshes out of order, IPC reject,
  and empty result.

#### EC-28 — Chrome tabs inferred from title

- **Why:** title heuristics cannot guarantee true browser-tab capture and may misclassify localized
  or Chromium-based windows.
- **How:** rename the category to “Chrome windows”, keep honest app/window grouping, and preserve
  shared IPC DTO validation.
- **Expected result:** the UI does not promise a capture granularity Electron does not provide.
- **Tests:** Chrome, localized titles, Edge/Chromium, unrelated app containing “Chrome”, and empty
  titles.

#### EC-29 — Replace/renegotiate

- **Why:** picker/source code must not create a second negotiation implementation.
- **How:** consume the VR-08 queue and rollback contract; keep source selection responsible only
  for user intent and selected source.
- **Expected result:** camera and screen transitions share one protocol-safe transaction.
- **Tests:** integration coverage proving the picker delegates and receives rollback outcomes.

#### EC-30 — OS stop races with manual stop

- **Why:** OS `ended`, manual stop, and hangup may complete concurrently.
- **How:** process `ended` only when generation/current source still match, use latest-intent-wins,
  and perform camera restore at most once.
- **Expected result:** the final state is deterministic with no duplicate capture or stale source.
- **Tests:** OS+manual stop same tick, stop+hangup, stale old screen track, and restore failure.

#### EC-31 — No system audio

- **Why:** users commonly assume presentation or browser audio is shared with the screen.
- **How:** add explicit localized picker copy and keep `audio:false`; do not add partial
  platform-specific behavior.
- **Expected result:** expectations are clear before sharing starts.
- **Tests:** copy in five locales and assertion that display capture never replaces/adds audio.

### Expected result

Picker work is call-scoped and cancellable; screen share always ends in one valid state:
screen active, camera restored, receive-only, or call ended.

### Gate

Typed IPC tests, main/preload validation, renderer hook races, adapter rollback, and five-locale
copy.

### Completion record

- Status: `pending`
- Commit: —
- Files: —
- Verification: —
- Notes: —

---

## VR-10 — Mock Parity, Multi-Call, Hold, and Auto-Answer Policy

### Covered edge cases

#### EC-32 — Mock composition lacks media capture

- **Why:** renderer/dev flows exercise `mediaMode` but not the same capture controls as real
  composition.
- **How:** inject `MockLocalMediaCapturePort` by default and expose deterministic success,
  no-camera/stub, permission, sender-sync, screen-ended, and recovery scenarios.
- **Expected result:** mock mode demonstrates and tests the complete video UX contract.
- **Tests:** dial, answer, camera, screen, failure recovery, and cleanup through mock bootstrap.

#### EC-33 — Multiple video lines undefined

- **Why:** hidden/background lines can continue consuming camera, CPU, and bandwidth without a
  declared product policy.
- **How:** enforce one unheld local sender, pause the previous sender when another line activates,
  preserve per-call intent, and restore only on resume/selection. Keep remote receive behavior
  explicit.
- **Expected result:** multi-call resource and privacy behavior is deterministic.
- **Tests:** two video calls, video+audio call, hold/resume/switch, call end, camera LED, and stale
  selection.

#### EC-34 — Camera privacy on hold undefined

- **Why:** disabling only UI controls does not guarantee camera or screen transmission stops.
- **How:** on local hold disable camera without losing prior intent; restore on resume only when
  healthy; treat remote hold separately; stop local screen sharing on local hold and require an
  explicit restart.
- **Expected result:** local hold is privacy-safe and resume never surprises users with an
  unintended camera state.
- **Tests:** local/remote hold, camera on/off, screen active, resume failure, and multi-call.

#### EC-39 — Auto-answer video

- **Why:** automatic camera activation is a privacy violation unless explicitly configured for a
  trusted environment.
- **How:** keep scheduled auto-answer audio-only, document it, and ensure no capture preparation
  runs. Defer trusted auto-video to a separate security/product decision.
- **Expected result:** video INVITEs may auto-answer, but camera never opens and media mode remains
  audio.
- **Tests:** video/audio INVITE auto-answer, camera port not called, and active-call policy.

### Expected result

Mock mode can exercise the same video UX; multi-call and hold have deterministic privacy rules;
auto-answer stays safe.

### Gate

Application integration tests for two calls, local/remote hold, screen share, auto-answer, and
mock cleanup.

### Completion record

- Status: `pending`
- Commit: —
- Files: —
- Verification: —
- Notes: —

---

## VR-11 — Codec and SBC Failure Recovery UX

### Covered edge case

#### EC-36 — Generic codec/SDP failure

- **Why:** generic SIP/WebRTC errors do not tell users that the call can often continue without
  video.
- **How:**
  1. map incompatible SDP, 488, bad media description, and WebRTC failures into typed reasons;
  2. preserve the original audio-capable journey;
  3. offer **Retry without video** exactly once;
  4. never silently send another INVITE;
  5. log only redacted codec/profile/packetization summaries;
  6. align H.264 behavior with the target SBC and RFC 7742/6184.
- **Expected result:** a user can recover from video incompatibility with one explicit action and
  without duplicate calls.

### Expected result

The user can recover from video incompatibility without deciphering SIP errors and without
creating duplicate calls.

### Tests

488, incompatible SDP, bad media description, WebRTC error, retry success/failure/cancel, retry
deduplication.

### Completion record

- Status: `pending`
- Commit: —
- Files: —
- Verification: —
- Notes: —

---

## VR-12 — Automated Video Regression Harness

### Covered edge case

#### EC-40 — Existing tests miss user-visible media semantics

- **Why:** the original selected 63 tests passed while important protocol, audible-media,
  recovery, and cleanup semantics remained unasserted.
- **How:** build a deterministic test matrix, not a second implementation:

1. fake `MediaDevices`, tracks, senders, receivers, stats reports, and PC lifecycle;
2. mock JsSIP offer/answer/re-INVITE events;
3. renderer integration for projections and actions;
4. Electron IPC tests for display-source lifecycle;
5. optional Electron E2E harness with fake media flags if the repository supports it.

Minimum mandatory regression cases:

- one audible remote sink;
- early incoming video gate;
- all SDP directions and session-level inheritance;
- capture fallback and incoming rollback;
- local track ended/muted;
- PC failure/replacement and sender sync;
- transfer-ended cleanup;
- rapid media commands;
- stale picker requests;
- hold/multi-call privacy;
- codec fallback;
- no timer/listener/track leak after call end.

- **Mandatory audit floor:** EC-02, EC-03, EC-04, EC-05, EC-09, EC-14, EC-17, EC-18, and EC-26
  must each have a direct regression test, even if broader coverage exists.

- **Expected result:** CI detects the critical semantics that the original green suite did not
  cover. Real SBC smoke remains a separate interoperability gate.

- **Tests:** the harness itself must prove deterministic setup/teardown, fake-clock cleanup, no
  cross-test media state, and at least one failure-path assertion per mandatory EC.

### Gate

`npm run test`, `npm run lint`, `npm run typecheck`, `npm run i18n:check`,
`npm run ui:catalog:check`, and `npm run registry:check`.

### Completion record

- Status: `pending`
- Commit: —
- Files: —
- Verification: —
- Notes: —

---

## VR-13 — Final Real SBC Gate and Documentation Close

### Covered edge case

#### EC-01 — No production interoperability evidence

This WU requires a human-accessible video-capable SBC and two endpoints.

- **Why:** unit, adapter, and Electron tests cannot prove target-SBC codec, offer/answer, RTP,
  NAT/TURN, hold, transfer, or device interoperability.
- **How:** execute and extend the canonical checklist at
  `docs/softphone/handoffs/P13-Video-Calls-WU8-SBC-Smoke-Checklist.md`. VR-13 is the refactoring
  track wrapper around the existing P13 WU8 gate; it does not replace that artifact.
- **Expected result:** the canonical checklist contains sanitized PASS/FAIL/limitation evidence
  tied to one build commit and environment.
- **Tests:** V1–V12 plus the additional matrix below. Unsupported cases remain documented rather
  than being marked PASS.

### Before smoke

1. All VR-01 through VR-12 work units are `done`.
2. Full preflight passes.
3. Build/commit under test is recorded.
4. No secrets or raw credentials will be committed.

### Mandatory smoke matrix

Retain V1–V12 and add:

- SDP session-level and media-level direction cases;
- one-way send/receive if the SBC supports them;
- video-to-audio fallback;
- local and remote hold;
- camera unplug/revoke;
- network switch or PC recovery;
- transfer while camera/screen is active;
- rapid source switch protection;
- 488/incompatible-video retry without video;
- two-call hold/resume policy;
- audio sink verification;
- stats/diagnostics redaction.

Before running, update V10 and related checklist wording from the legacy
`remoteVideoPresent=false` boolean to the new direction-aware negotiation and media-health
semantics introduced by VR-02/VR-05.

### Close actions

1. Record date, SBC/environment identifier, endpoints type, build commit, result, and sanitized
   notes in the checklist.
2. Keep unsupported SBC cases documented; do not mark them PASS.
3. Update F-027 acceptance/test evidence and status to `implemented` only when mandatory cases
   pass.
4. Update `STATUS.md`, handoff, and work history.
5. Apply SemVer and manifest rules only when closing a completed user-visible feature or cutting
   a release. Do not rebuild installers unless this is a distribution release.

### Expected result

The repository contains auditable proof that the refactored video flow works on the production
SIP/WebRTC path.

### Completion record

- Status: `pending`
- Commit: —
- SBC evidence: —
- Verification: —
- Notes: —

---

## 7. EC-01…EC-40 Traceability Index

No edge case may disappear during implementation.

| EC | Primary WU | Required end state |
|---|---|---|
| EC-01 | VR-13 | Sanitized target-SBC evidence and truthful F-027 gate |
| EC-02 | VR-01 | One audible remote sink |
| EC-03 | VR-01 | Video answer only after confirmed offer |
| EC-04 | VR-02 | Direction-aware video negotiation |
| EC-05 | VR-02 | Session-level SDP inheritance |
| EC-06 | VR-03 | No hardcoded capture availability |
| EC-07 | VR-03 | Typed capture errors and visible recovery |
| EC-08 | VR-03 | Explicit continue-without-video flow |
| EC-09 | VR-03 | Transactional incoming answer rollback |
| EC-10 | VR-03/04 | Default-device fallback and runtime device lifecycle |
| EC-11 | VR-04 | Local track health matches hardware reality |
| EC-12 | VR-05 | Frame-aware remote media health |
| EC-13 | VR-05 | Observable/retryable playback failure |
| EC-14 | VR-05 | PC/ICE media recovery state |
| EC-15 | VR-05 | Sender/surface sync on every new PC |
| EC-16 | VR-05 | Sender-sync failure is not reported as success |
| EC-17 | VR-06 | REFER cannot skip media cleanup |
| EC-18 | VR-06 | Per-call latest-intent command serialization |
| EC-19 | VR-07 | Every disabled control explains why |
| EC-20 | VR-07 | Keyboard-accessible PiP swap |
| EC-21 | VR-08 | Explicit remote-upgrade policy |
| EC-22 | VR-08 | Transactional local mid-call upgrade |
| EC-23 | VR-08 | Offer queue and bounded glare retry |
| EC-24 | VR-02 | Signaling and flowing state cannot flap one boolean |
| EC-25 | VR-01 | Downgrade is informational, audio remains active |
| EC-26 | VR-09 | Picker closes/cancels with its call |
| EC-27 | VR-09 | Stale display-source results ignored |
| EC-28 | VR-09 | Honest source categories |
| EC-29 | VR-08/09 | Controlled screen renegotiation and rollback |
| EC-30 | VR-09 | OS/manual stop race is idempotent |
| EC-31 | VR-09 | System-audio limitation is explicit |
| EC-32 | VR-10 | Mock composition exercises full video UX |
| EC-33 | VR-10 | Defined multi-video resource/privacy policy |
| EC-34 | VR-10 | Defined local-hold camera policy |
| EC-35 | VR-05 | Redacted bounded video QoS diagnostics |
| EC-36 | VR-11 | One-click explicit audio retry after video incompatibility |
| EC-37 | VR-07 | Hidden view cannot be confused with camera mute |
| EC-38 | VR-07 | Predictable conference fullscreen matching |
| EC-39 | VR-10 | Auto-answer remains explicitly audio-only |
| EC-40 | VR-12 | Automated regression coverage for critical semantics |

---

## 8. Global Verification Matrix

### Domain

- pure transition tests;
- direction matrix;
- invalid transition and terminal cleanup;
- no DOM/JsSIP imports.

### Application

- success/failure/rollback for every transaction;
- operation queue and stale completion;
- multi-call and hold policy;
- bounded recovery and timer cleanup;
- event and correlation assertions.

### Ports and mocks

- typed outcomes;
- mock parity for every real capability;
- no external objects across boundaries.

### JsSIP adapter

- offer/answer/re-INVITE mapping;
- session-level/media-level SDP direction;
- 488, 491, timeout, failed/ended;
- PC replacement and transfer races;
- no raw SDP logging.

### Browser Media adapter

- capture error taxonomy;
- exact-device fallback;
- track ended/mute/unmute;
- replaceTrack rollback;
- one audio sink;
- stats and listener cleanup.

### Electron display capture

- typed IPC validation;
- stale pending source cleanup;
- no raw `ipcRenderer`;
- cancel/hangup/reopen races.

### Renderer

- default/loading/success/empty/error/disabled/recovery states;
- five locale parity;
- keyboard/focus/screen reader behavior;
- light and dark Storybook;
- no SIP, media, Electron, repository, or business logic in components/stores.

### Final commands

```text
npm run test
npm run lint
npm run typecheck
npm run i18n:check
npm run ui:catalog:check
npm run registry:check
```

Real SBC tests are additional and cannot be replaced by these commands.

---

## 9. Handoff Template for Every Agent

Append the following under the completed work unit and update the Progress Board:

```md
### Implementation handoff

- **Status:** done | blocked | blocked_external
- **Agent/date:** <name or session> / YYYY-MM-DD
- **Base commit:** `<hash>`
- **Completion commit:** `<hash>`
- **ECs closed:** EC-XX, EC-YY
- **Architecture decisions:** <short list>
- **Files changed:** <key paths>
- **Events/ports/contracts changed:** <list>
- **Tests added:** <list>
- **Commands:** `<command>` — PASS/FAIL
- **Manual evidence:** <path or none>
- **Known residual risks:** <list or none>
- **Next eligible WU:** VR-XX
```

An agent must not write “all done” without this evidence.

