# Enterprise Softphone Feature Registry

## Type

DOCUMENT.

This document defines the source of truth for product features.

## Registry Rules

Every feature must have:

- Feature ID
- name
- bounded context
- status
- acceptance criteria
- test coverage
- owner

No implementation may be added without a registry entry.

No feature may be removed without updating this registry.

Legacy parity is tracked in `Legacy-Feature-Coverage.md`.

Every aggregated feature in this registry must map to one or more `LF-XXX` legacy IDs when it replaces old softphone behavior.

## Status Values

- `proposed`
- `planned`
- `in-progress`
- `implemented`
- `deprecated`
- `removed`

## Priority Values

- `critical`
- `high`
- `medium`
- `low`

## Feature Template

```md
## F-000: Feature Name

- Context: Telephony | Operator | Media | Headset | Settings | Integration
- Priority: critical | high | medium | low
- Status: proposed | planned | in-progress | implemented | deprecated | removed
- Owner: TBD
- Inputs: command, event, adapter, or user interaction
- Outputs: domain event, state projection, adapter call, or UI result
- Acceptance Criteria:
  - Criterion 1
  - Criterion 2
- Test Coverage:
  - Unit:
  - Integration:
  - E2E:
```

## Initial Core Registry

## F-000: Platform Foundation

- Legacy IDs: none
- Context: Integration
- Priority: critical
- Status: implemented
- Owner: TBD
- Inputs: platform bootstrap, logging context, correlation ID generation
- Outputs: Electron shell, typed IPC facade, shared result/error model, test logger
- Acceptance Criteria:
  - Electron + React + TypeScript + Vite shell starts without product features.
  - Domain and Application tests run without Electron.
  - Renderer cannot access Node APIs directly.
  - Architecture layer folders exist with dependency boundary linting.
  - No `any` in platform foundation code.
- Test Coverage:
  - Unit: correlation ID, result model, platform error, test logger
  - Integration: deferred until adapters exist
  - E2E: deferred until harness exists

## F-001: SIP Account Registration

- Legacy IDs: `LF-005`, `LF-006`, `LF-007`, `LF-011`
- Context: Telephony
- Priority: critical
- Status: **implemented** (T-008 closed — ADR-0004)
- Owner: TBD
- Inputs: SIP account settings, register command, transport lifecycle events from JsSIP adapter
- Outputs: `RegistrationSucceeded` or `RegistrationFailed`; transport events (`SipTransportConnecting`, `SipTransportConnected`, `SipTransportDisconnected`); `SipRegistrationCleared` on transport loss
- Acceptance Criteria:
  - Registration runs through `RegisterAccountUseCase`.
  - JsSIP is hidden behind `TelephonyGateway`.
  - Registration state is derived from Domain Events via `sipSessionHealthProjection`.
  - **ADR-0004:** `effectiveRegistered = isConnected && ua.isRegistered()`; projections never show `registered` when transport ≠ `connected`.
  - Transport and registration are orthogonal FSMs (`SipTransportState`, `SipRegistrationState`); `SipSessionHealth` invariants unit-tested.
  - Manual SIP authorization emits `ManualSipAuthorizationRequested` and `SipCredentialsReceived`; first attempt emits `SipSessionActivated`.
  - Logout emits `SipSessionReset`; header returns **Не подключено**.
  - DND shown in header only when `isConnected && isRegistered && dndEnabled` (not as transport/presence substitute).
  - Header SIP status line via `deriveSipStatusShell` (Russian labels per ADR-0004 §1.2); no user-selectable online/offline presence.
  - Phone status changes run through `ChangePhoneStatusUseCase` and emit `PhoneStatusChanged` (DND flag only when registered).
- Test Coverage:
  - Unit: `SipSessionHealth` invariants, transport FSM, registration state transitions, `deriveSipStatusShell` header rows, phone status use case, manual SIP validation
  - Integration: mock telephony gateway transport events, SIP-only bootstrap facade, effective registered guard on disconnect
  - E2E: deferred until SIP sandbox exists
- Real Adapter Track: **done** (RAT step 02, 2026-06-24) — `JsSipTelephonyAdapter` on `@hailrase/jssip` fork; register/unregister/reconnect + transport disconnect; manual SBC R1 PASS; fork notes: `real-integration/JSSIP-FORK.md`
- Refactor plan: `docs/softphone/TRANSPORT-REGISTER-STATE-REFACTORING.md` (T-008)

## F-002: Incoming Call

- Legacy IDs: `LF-012`, `LF-013`, `LF-014`, `LF-015`, `LF-016`, `LF-017`, `LF-036`, `LF-061`, `LF-090`
- Context: Telephony
- Priority: critical
- Status: implemented
- Owner: TBD
- Inputs: incoming session event from telephony adapter
- Outputs: `IncomingCallReceived`, `IncomingCallRingingStarted`, `CallAnswered`, `CallRejected`, `CallAutoAnswered`, `CallRejectedByDnd`, ringing projection, host break-reason mapping
- Acceptance Criteria:
  - Incoming adapter notification is mapped to typed Domain Events and projected to incoming modal state.
  - Ringing state is produced by explicit transitions (`Idle -> Ringing`, `Ringing -> Active|Ended|Failed`).
  - UI answers and rejects only through `AnswerCallUseCase` and `RejectCallUseCase`.
  - DND incoming path auto-rejects with SIP 486 and does not expose invalid answer controls.
  - **WU6 (done):** answer while multi-sessions ON holds all other Active lines (`IncomingCallOrchestrator` + `holdAllActiveLines`); multi-sessions OFF + established call → auto-486 second incoming; `MultiCallOperationRejected` fail-safe — `src/domain/telephony/events/MultiCallOperationRejected.ts`, `MultiCallCompleteness.integration.test.ts`.
  - **UI (2026-06-30):** `IncomingCallSessionCard` in call context zone — selectable green session card with «Ответить»/«Отклонить»; auto-select on ring; ControlsBar hangup rejects when incoming selected; `IncomingCallOverlay` no longer mounted in shell.
  - **Multi-call selection (2026-06-30):** while incoming rings with an established call, operator can select any session (incoming or established) and ControlsBar targets that session; `activeCallControlsProjection` preserves established call on `IncomingCallReceived`; `deriveCallControlTarget` resolves control target.
  - **LF-016 (done 2026-06-30):** auto-answer 0…300 s; `autoAnswerDuringActiveSessionEnabled` holds peers via `holdAllActiveLines` at timer fire; peer = any non-terminal session; global blocks: outgoing Connecting, transfer; per-call timers; settings refresh reschedules ringing calls.
- Test Coverage:
  - Unit: state machine incoming transitions, auto-answer policy, DND policy, display-name parser, reject reason validation, answer/reject use cases
  - Integration: mock incoming adapter event to events/projection, ringtone start, answer/reject gateway calls, DND 486, host break-reason mapping, ended-before-answer recovery
  - E2E: deferred until incoming call harness exists
- Real Adapter Track: **done** (RAT steps 03–04, 2026-06-24) — `JsSipTelephonyAdapter` incoming/answer/reject/DND + `BrowserMediaAdapter` ringtone/remote audio; manual SBC R2+R3 PASS

## F-003: Outgoing Call

- Legacy IDs: `LF-020`, `LF-025`, `LF-026`, `LF-033`, `LF-034`, `LF-035`
- Context: Telephony
- Priority: critical
- Status: implemented
- Owner: TBD
- Inputs: phone number, make-call command
- Outputs: `OutgoingCallStarted`, `CallConnecting`, `CallAnswered`, `CallFailed`
- Acceptance Criteria:
  - Dialpad calls `MakeCallUseCase`.
  - Phone number is validated before adapter invocation.
  - Outgoing flow runs through `TelephonyGateway` (mock default; real via `JsSipTelephonyAdapter` when `?adapters=real`).
  - **WU6 (done):** hold-all before second outgoing when Active exists; block dial while Connecting — `MultiCallPolicyService.checkConflictingOperationBlocked`, `CallEngine.multiCallPolicy.test.ts`.
- Test Coverage:
  - Unit: number validation and transitions
  - Integration: mock gateway make-call progress/answer/failure + media tones
  - E2E: deferred until dedicated Electron E2E harness exists
- Real Adapter Track: **done** (RAT step 04, 2026-06-24) — `JsSipTelephonyAdapter` makeCall/outgoing progress/answered/failed; manual SBC R3 PASS (R3-1/R3-4)

## F-004: Active Call Hold, Resume, Hangup

- Legacy IDs: `LF-022`, `LF-027`
- Context: Telephony
- Priority: critical
- Status: implemented
- Owner: TBD
- Inputs: call ID, hold/resume/hangup commands
- Outputs: `CallHeld`, `CallResumed`, `CallHangupRequested`, `CallEnded`, `ActiveCallControlFailed`
- Acceptance Criteria:
  - Invalid transitions are impossible.
  - Commands enter only via `HoldCallUseCase`, `ResumeCallUseCase`, `HangupCallUseCase`.
  - `CallEngine` logs operation, correlationId, featureId, context, previous/next state, result, normalized error on failure.
  - Hangup publishes `CallHangupRequested` only after successful gateway hangup; failed hangup keeps call state and projection out of `Ending`.
  - UI surfaces `ActiveCallControlFailed` via projection with retry action.
  - UI does not inspect raw SIP session state.
  - **WU6 (done):** exclusive resume (LF-023); hangup Active does not auto-resume Held (D1 — no auto-resume code path); per-call mute on `CallLine` / `multiLineCallProjection`; per-line resume/hangup — `deriveCallLinesShell.ts`, `CallLinesShell.tsx`.
  - **WU2 (done):** operator controls on `CallLineRow` in ContextZone (hold/mute/transfer/hangup/resume); human status via `deriveCallLineStatusLabel`; single-line visibility `lines.length >= 1`.
  - **Remote hold (done):** `CallRemoteHeld` / `CallRemoteResumed` projection flag `isRemoteHold`; call card badge «Удержание (удал.)» without held chrome; dual local+remote shows both badges.
  - **Mute after hold/resume (done):** local and remote unhold re-INVITE renegotiation does not unmute operator mic when `Call.muted === true`; `executeResumeCall` and `BrowserMediaAdapter.attachRemoteAudio` re-sync media without extra domain events.
- Test Coverage:
  - Unit: state machine valid/invalid transitions + use case command tests (including `ActiveCallControlFailed` on gateway failure)
  - Integration: mock telephony hold/resume/hangup success and failure paths; mute survives local hold resume (`CallEngine.test.ts`)
  - Renderer: `CallLineRow` disabled reasons, error banner, retry, icon row; `ActiveCallControlsPanel` retained for Storybook/tests only (removed from ControlsZone)
  - E2E: deferred until dedicated Electron E2E harness exists
- Real Adapter Track: **done** (RAT steps 05+08, 2026-06-24/25) — hold/resume re-INVITE R4 PASS; multi-session R7-1…R7-5 PASS; `multiSessionsEnabled` toggle in P11 settings (Sessions section)

## F-005: Mute And Unmute

- Legacy IDs: `LF-024`
- Context: Media
- Priority: critical
- Status: implemented
- Owner: TBD
- Inputs: call ID, mute/unmute command
- Outputs: `CallMuted`, `CallUnmuted`, or `ActiveCallControlFailed`
- Acceptance Criteria:
  - Media operation is isolated from SIP session objects and executed via `MediaGateway`.
  - Commands enter only via `MuteCallUseCase` and `UnmuteCallUseCase`.
  - Headset LED sync consumes events, not adapter internals.
  - UI state, disabled reasons, and failure recovery are projection-driven.
  - **Mute after renegotiation (done):** `reapplyMutedMediaStateIfNeeded` after local resume and remote resume; `BrowserMediaAdapter` enforces `mutedCalls` on `attachRemoteAudio`; no spurious `CallUnmuted` when domain remains muted.
- Test Coverage:
  - Unit: use case and projection mute/unmute transitions (including invalid `ActiveCallControlFailed` operation payload guard)
  - Integration: mock media mute/unmute success and failure paths; mute survives hold/unhold renegotiation (`CallEngine.test.ts`, `CallEngine.remoteHold.test.ts`, `BrowserMediaAdapter.test.ts`)
  - Renderer: error banner and retry via `lastOperationError` projection
  - E2E: deferred until dedicated Electron E2E harness exists
- Real Adapter Track: **done** (RAT step 05, 2026-06-24) — `BrowserMediaAdapter.muteCall`/`unmuteCall` via `getPeerConnectionForCall`; manual SBC R4-2 PASS

## F-006: Blind Transfer

- Legacy IDs: `LF-028`, `LF-030`, `LF-031`
- Context: Telephony
- Priority: high
- Status: implemented
- Owner: TBD
- Inputs: active call ID, target number
- Outputs: `CallTransferRequested`, `CallTransferred`, `CallTransferFailed`, `TransferModeStarted`, `TransferModeCancelled`, `CallAutoUnheldAfterTransferFailure`
- Acceptance Criteria:
  - WU1 (policy foundation): multi-call policy domain + `AllOtherCallsHeld` / `SecondSessionBlocked` events gate outgoing and incoming second sessions (`LF-021`, `LF-032`); exclusive hold before resume (`LF-023`).
  - WU2: blind transfer runs through `BlindTransferUseCase` → `CallEngine` → `TelephonyGateway.blindTransfer`; domain events `CallTransferRequested`, `CallTransferred`, `CallTransferFailed`; eligibility rules in Domain; mock adapter success/failure paths; `transferProjection` read model.
  - WU3 integration touchpoint: shared `TransferCallControlService`, multi-call hold-all before consultation outgoing; `transferType: "blind" | "attended"` on transfer events.
  - WU4: `StartTransferUseCase` / `CancelTransferUseCase`; transfer panel UI with projection-driven disabled reasons; `LF-030` cancel without invalid state; `LF-031` auto-unhold via `MultiCallSettings.autoUnholdOnTransferFailure`; transfer success celebration overlay on `CallTransferred`.
- Test Coverage:
  - WU1: `MultiCallPolicy.test.ts`, `CallEngine.multiCallPolicy.test.ts`, `multiCallProjection.test.ts`, `MultiCallPolicy.integration.test.ts`
  - WU2: `TransferEligibility.test.ts`, `CallStateMachine.test.ts` (transfer transitions), `MockTelephonyGateway.blindTransfer.test.ts`, `BlindTransferUseCase.test.ts`, `CallEngine.blindTransfer.test.ts`, `transferProjection.test.ts`
  - WU4: `transferProjection.transferMode.test.ts`, `CallEngine.cancelTransfer.test.ts`, `TransferPanel.test.tsx`, `TransferSuccessOverlay.test.tsx`, `useTransferSuccessCelebration.test.ts`; WU1/WU2/WU3/P04 regression green
  - E2E transfer UI with mock gateway (deferred)
- Real Adapter Track: **backlog** (RAT step 07/07b paused 2026-06-25). **Works on real SBC:** blind transfer to on-net extension (R6 A,D); failure banner + retry. **Does not work:** blind to off-net PSTN (R6 B,C). **Not verified:** attended transfer manual smoke. Mock path + unit tests green. Resume: `TRANSFER-REAL-ADAPTER-BACKLOG.md`.

## F-007: Attended Transfer

- Legacy IDs: `LF-029`, `LF-030`, `LF-031`, `LF-032`
- Context: Telephony
- Priority: high
- Status: implemented
- Owner: TBD
- Inputs: source call, consultation call, transfer command; WU1: `MultiCallSettings.multiSessionsEnabled`
- Outputs: attended transfer events; WU1: `AllOtherCallsHeld`, `SecondSessionBlocked`; WU4: `TransferModeStarted`, `TransferModeCancelled`
- Acceptance Criteria:
  - WU1: `SettingsRepository.getMultiCallSettings()` drives second-session block (`LF-032`); hold-all before outgoing (`LF-021`); exclusive hold on resume (`LF-023`); dialpad and incoming answer disabled reasons from `multiCallProjection`.
  - WU3: `StartConsultationUseCase` / `AttendedTransferUseCase` → `CallEngine` → `TelephonyGateway.attendedTransfer`; `CallRelationship` model; events `ConsultationCallRequested`, `ConsultationCallStarted`, `ConsultationCallFailed`, `AttendedTransferRequested`, `AttendedTransferCompleted`, `AttendedTransferFailed`; failure events carry `restoredSourceState`; `ConsultationCallFailed` rolls back projections; consultation via existing `makeCall`; `multiLineCallProjection` + extended `transferProjection`; attended gateway failure allows retry complete; blocked when multi-sessions disabled (`LF-032`).
  - WU4: `TransferPanel`, `MultiLineCallList`, `useTransferActions`; blind/consultation/attended/cancel controls with test IDs; failure banner and in-progress indicator; `LF-030` cancel transfer mode; transfer success celebration overlay (`TransferSuccessOverlay`) on `CallTransferred` / `AttendedTransferCompleted` with auto-dismiss and incoming-call preemption.
- Test Coverage:
  - WU1: domain policy unit tests; CallEngine hold-all / block / exclusive-resume; projection + integration chain
  - WU3: `CallRelationship.test.ts`, `AttendedTransferEligibility.test.ts`, `MockTelephonyGateway.attendedTransfer.test.ts`, `CallEngine.attendedTransfer.test.ts`, `attendedTransferOperations.test.ts`, `multiLineCallProjection.test.ts`, `activeCallControlsProjection.test.ts`; WU1/WU2/P04 regression green
  - E2E transfer UI with mock gateway (deferred)
- Real Adapter Track: **backlog** (RAT step 07 paused 2026-06-25). Adapter code landed (`attendedTransfer` REFER+Replaces); manual R6 **not run**. Resume: `TRANSFER-REAL-ADAPTER-BACKLOG.md`.

## F-008: DTMF

- Legacy IDs: `LF-025`
- Context: Telephony
- Priority: high
- Status: implemented
- Owner: TBD
- Inputs: active call ID, tone
- Outputs: `DtmfSent` or `DtmfFailed`
- Acceptance Criteria:
  - Tone is validated before gateway call.
  - UI cannot call SIP session directly.
  - Errors are observable.
  - Real JsSIP tone sending remains deferred behind `TelephonyGateway` until dedicated adapter task.
- Test Coverage:
  - Unit: tone validation
  - Integration: mock gateway DTMF
  - E2E: deferred until dedicated Electron E2E harness exists

## F-009: Optional OCP Authentication

- Legacy IDs: `LF-001`, `LF-002`, `LF-003`, `LF-004`, `LF-005`, `LF-085`
- Context: Operator
- Priority: critical
- Status: implemented (mock); **Product status: deferred_backlog** (ADR-0002)
- Owner: TBD
- Inputs: host integration auth token and domain
- Outputs: operator session events and optional SIP credentials
- Acceptance Criteria:
  - Core SIP phone mode works without OCP.
  - OCP is implemented as an integration plugin behind `OperatorPlatformGateway`.
  - Startup mode is resolved by `ResolveStartupModeUseCase` and published as `StartupModeResolved`.
  - OCP auth failure states map to UI: loading, session exists, invalid token, access denied.
  - Missing OCP credentials at startup emit `AccessDeniedDetected`.
  - Dev mock scenarios are selectable via URL query params.
- Test Coverage:
  - Unit: OCP auth success, invalid token, session exists, access denied
  - Integration: mock OCP gateway, OCP to SIP registration chain, startup initialization
  - E2E: deferred until harness exists
- Real Adapter Track: **deferred** (ADR-0002; code in step 06; R5 smoke out of scope — see `OCP-PLUGIN-BACKLOG.md`)

## F-010: Operator Status Management

- Legacy IDs: `LF-018`, `LF-019`, `LF-041`, `LF-042`, `LF-043`, `LF-044`, `LF-045`, `LF-046`, `LF-047`, `LF-048`, `LF-049`, `LF-062`, `LF-078`
- Context: Operator
- Priority: critical
- Status: implemented (mock; partial — LF-048 cascade P08); **Product status: deferred_backlog** (ADR-0002)
- Owner: TBD
- Inputs: status change command, optional reason
- Outputs: `AgentStatusChanged` or failure event
- Acceptance Criteria:
  - Status rules are not in UI components.
  - Post-call status transitions are explicit.
  - OCP absence does not break SIP-only mode.
  - WU1: `AgentStatus` FSM rejects invalid transitions with typed reasons (LF-045).
  - WU1: DND blocks transition to Ready; DND→break mapping contract defined (LF-018, LF-019).
  - WU1: WU1 domain events typed and projection skeleton represents SIP-only N/A.
  - WU2+: `ChangeAgentStatusUseCase` confirms gateway before `AgentStatusChanged`.
  - WU2: `ChangeAgentStatusUseCase` validates → requests → gateway → changed/rejected.
  - WU2: DND phone change orchestrates agent break via `DndAgentStatusOrchestrationService` (LF-018).
  - WU2: Initial agent status synced on `OcpAuthenticationSucceeded` via `AgentStatusSyncService`.
  - WU3: `BreakReasonsReceived` syncs `allowedBreakReasons` from mock gateway (LF-078).
  - WU3: Break reason validation uses `allowedBreakReasons` via `AgentBreakReasonPolicy` (not incoming reject flag).
  - WU3: `UpdatePostCallStatusUseCase` + `PostCallStatusUpdated` after gateway confirm (LF-044).
  - WU3: Reject with reason triggers post-call update in OCP mode (LF-062).
  - WU3: Status timer projection derived from `statusChangedAt` (LF-046 prep; UI WU4).
  - WU3: DND-at-auth orchestration after status sync (`OcpAuthBootstrapService`).
  - WU4: Status selector React UI in OCP mode, hidden SIP-only (LF-041).
  - WU4: Ready/Break invoke `ChangeAgentStatusUseCase` with projection disabled reasons (LF-042, LF-043).
  - WU4: Break reason picker when `allowedBreakReasonsCount > 0`.
  - WU4: Status timer component via `useOperatorStatusTimer` (LF-046).
  - WU4: Logout reason modal + `LogoutOperatorUseCase` + `AgentLogoutRequested` (LF-047).
  - WU4: LF-048 logout cascade deferred to P08.
- Test Coverage:
  - Unit: WU1–WU3 suite + `logoutEvents.test.ts`, `LogoutOperatorUseCase.test.ts`, `mapOperatorStatusDisabledReason.test.ts`, `StatusSelector.test.tsx`, `StatusTimer.test.tsx`, `LogoutReasonModal.test.tsx` (WU4)
  - Integration: `BreakReasonsAndPostCall.integration.test.ts`, `DndAgentStatusOrchestration.integration.test.ts` (WU2–WU3)
  - E2E: deferred until harness exists

- Real Adapter Track: **deferred** (ADR-0002; real WS commands in step 06 code; manual R5 out of scope — see `OCP-PLUGIN-BACKLOG.md`)

## F-011: Host Integration Contract

- Legacy IDs: `LF-051`, `LF-065`, `LF-080`, `LF-081`
- Context: Integration
- Priority: critical
- Status: planned
- Owner: TBD
- Inputs: host commands, optional legacy `window.Softphone` calls
- Outputs: typed commands and external events
- Acceptance Criteria:
  - No multi-file mutation of `window.Softphone`.
  - Contract is owned by one adapter.
  - Legacy DOM events are mapped to typed internal events.
- Test Coverage:
  - Unit: command/event mapping
  - Integration: host adapter tests
  - E2E: host-page contract harness

## F-012: Headset Call Controls

- Legacy IDs: `LF-071`, `LF-072`, `LF-073`, `LF-074`, `LF-075`
- Context: Headset
- Priority: high
- Status: planned
- Owner: TBD
- Inputs: hardware answer, hangup, hold, mute events
- Outputs: application commands and headset state events
- Acceptance Criteria:
  - Vendor details remain inside adapters.
  - Headset commands enter through Use Cases.
  - LED sync consumes state projections.
- Test Coverage:
  - Unit: hardware event mapping
  - Integration: mock headset gateway
  - E2E: deferred until device harness exists

## F-013: Call History

- Legacy IDs: `LF-052`, `LF-053`, `LF-054`
- Context: Settings
- Priority: medium
- Status: planned
- Owner: TBD
- Inputs: completed call events
- Outputs: persisted call history entry
- Acceptance Criteria:
  - Persistence is behind `CallHistoryRepository`.
  - History is derived from call events.
  - Storage failures are logged.
- Test Coverage:
  - Unit: history entry mapping
  - Integration: repository implementation
  - E2E: history list

## F-014: Recovery And Reconnect

- Legacy IDs: `LF-008`, `LF-010`, `LF-048`, `LF-049`, `LF-058`, `LF-079` (SIP path); `LF-009` **cancelled** (ADR-0004); `LF-057` **superseded** (ADR-0004)
- Context: Telephony
- Priority: critical
- Status: **implemented** (T-008 closed — ADR-0004)
- Owner: TBD
- Inputs: transport disconnects, registration failure, manual reconnect/reregister/refresh from settings, app close
- Outputs: `SipRecoveryOrchestrationService` events; `sipSessionHealthProjection`; settings journal entries; restored header/settings projections
- Acceptance Criteria:
  - **ADR-0004 SIP-only path:** `SipRecoveryOrchestrationService` replaces connection recovery SIP orchestration; strict transport-before-registration pipeline.
  - Transport disconnect clears registration projection (`SipRegistrationCleared`); never show `registered` when socket down.
  - SIP flat retry per user settings (LF-008): transport and registration each configurable — interval (min 5s), max attempts, no exponential backoff.
  - UserSettings v2: `sipAutoReconnectEnabled`, `sipReconnectIntervalSec`, `sipReconnectMaxAttempts`, `sipAutoReregisterEnabled`, `sipReregisterIntervalSec`, `sipReregisterMaxAttempts`, `sipAutoRegisterOnStartup`.
  - Transport WebSocket connection timeout: 10 seconds; on timeout publishes `SipTransportDisconnected` and follows auto-reconnect policy when enabled.
  - Runtime `registrationFailed` (including 403 while previously registered) publishes `RegistrationFailed`, clears effective registration, and follows auto-reregister policy when enabled.
  - Registration failures (including 401/403) follow the same auto-reregister policy when `sipAutoReregisterEnabled` is on.
  - Retry pauses while active telephony sessions exist; header shows fault immediately; scheduling resumes after `CallEnded`.
  - Manual actions in **Settings → Состояние системы** only: `ManualSipTransportReconnectUseCase` (timer reset, attempt # unchanged), `ReregisterSipUseCase` (transport connected guard).
  - **Removed SIP-only:** legacy recovery overlay/shell, header `control-reregister-sip`.
  - `SipConnectionJournal` in-memory ring buffer for transport + registration events (correlationId, timestamp).
  - Failure reasons normalized (`mapSipRegistrationFailureKey`) and shown in Russian in settings panel and header.
  - OCP recovery (LF-058, `OcpDisconnected`, overlay OCP rows) remains **deferred** (ADR-0002); mock code preserved, not wired in SIP-only UI.
  - OCP `server_terminate` inbound still publishes `ServerTerminateReceived` when OCP backlog resumes (LF-049, LF-048).
  - App shutdown IPC triggers `ShutdownCleanupUseCase` with hangup, unregister, scheduler dispose (LF-079).
  - SIP-only user logout: `hangupAll → unregister({ all: true }) → ua.stop() → SipSessionReset → idle`; all recovery timers cleared (LF-079).
- Test Coverage:
  - Unit: `SipSessionHealth`, `buildSipTransportRecoveryPolicy`, `buildSipRegistrationRecoveryPolicy`, `sipSessionHealthProjection`, `deriveSipStatusShell`, `deriveSipSystemStateShell`, `ReconnectScheduler`, `ManualSipTransportReconnectUseCase`, `SipRecoveryOrchestrationService` (pause/resume during active call — Q6), `EndUserSessionUseCase`, `SessionTeardownOrchestrationService`
  - Integration: `SipRecoveryOrchestration.integration.test.ts` (transport→registration order, pause during call, uniform auth retry, manual reconnect)
  - Component: `SettingsSystemStatePanel`, `LogoutActiveSessionConfirmationModal`; header SIP status (no overlay)
  - E2E: deferred until harness exists
- Refactor plan: `docs/softphone/TRANSPORT-REGISTER-STATE-REFACTORING.md` (T-008)
- Supersedes: LF-057 overlay UX, LF-009 avatar ring (cancelled)

## F-015: OCP Call Synchronization And Campaigns

- Legacy IDs: `LF-037`, `LF-038`, `LF-039`, `LF-040`, `LF-050`, `LF-059`, `LF-063`, `LF-064`
- Context: Operator
- Priority: critical
- Status: implemented (mock gateway); **Product status: deferred_backlog** (ADR-0002; real WS R5 smoke deferred)
- Owner: TBD
- Inputs: OCP queue info, campaign events, notifications, call lifecycle events
- Outputs: queue projection, campaign modal state, OCP action notifications, `dlg_stop`
- Acceptance Criteria:
  - Queue and `main_acallid` mapping is exact (WU1–WU3).
  - Campaign UX exists only when OCP plugin is enabled (WU3).
  - Campaign accept/reject sends OCP update via gateway before `CampaignEventAnswered` (WU3).
  - `dlg_stop` is sent exactly once for ended or failed calls with OCP correlation (WU4: `SendDlgStopUseCase`, `DlgStopPolicy`, `CallEndDlgStopOrchestrationService`).
  - OCP notifications render from typed projection through unified renderer notifications; SIP-only mode keeps OCP stream hidden (WU4+: `ocpNotificationProjection`, `useActionNotifications`, `NotificationViewport`).
  - Queue label transitions `loading` → `na` after timeout without polling (WU4: `QUEUE_LABEL_NA_TIMEOUT_MS`, `useQueueLabelNaTimer`).
- Test Coverage:
  - Unit: OCP message mapping, `ProcessOcpInboundMessageUseCase` (campaign_event), `DlgStopPolicy`, `SendDlgStopUseCase`, queue NA derivation, toast projection
  - Integration: `OcpQueueInfoSync`, `OcpCampaignSync`, `OcpDlgStopSync`, `OcpNotificationSync`
  - E2E: deferred until harness exists (WU4 handoff)
- Real Adapter Track: **deferred** (ADR-0002; `WebSocketOcpSyncGateway` in repo; R5 smoke out of scope — see `OCP-PLUGIN-BACKLOG.md`)

## F-016: Settings And Desktop Shell UX

- Legacy IDs: `LF-055`, `LF-056`, `LF-060`, `LF-076`, `LF-077`, `LF-082`, `LF-084`, `LF-085`, `LF-086`, `LF-087`, `LF-032` (multi-session toggle)
- Context: Settings
- Priority: high
- Status: **in_progress** (P11 WU0–WU5 + UI-4 **done**; T-008 system-state panel **done** — ADR-0004; open: UI-6 Radix modals, draggable LF-056)
- Owner: TBD
- Inputs: user settings, account identity, shell interactions, SIP session health projection
- Outputs: persisted settings (v2), theme, menu projections, system-state panel VM
- Acceptance Criteria:
  - Settings are per-user and validated.
  - **UserSettings v2** aggregate with v1→v2 migration; SIP recovery fields per ADR-0004 §5.3.
  - Corrupt or unsupported schema version surfaces observable error (no silent security-sensitive defaults).
  - **Overlay navigation:** settings open fullscreen over call context; diagnostics is a settings section; call context stays mounted (`UI-Architecture.md`).
  - **Settings sidebar:** collapsed icon rail with `IconTooltip` section labels (`placement: right`); expanded labels overlay content without shrinking the panel; long labels wrap up to two lines; no duplicate overlay header — content header shows `Настройки ({раздел})` and a minimal close icon.
  - **Settings sections:** Account (SIP auth), General (theme LF-082), **Состояние системы** (`system-state` — ADR-0004), Sessions (multi-call), Diagnostics (F-017 stub), Codecs (stub), Headset (P10 stub).
  - **`SettingsSystemStatePanel`:** current server/registration state, auto-reconnect/reregister policies, manual actions (Переподключить сервер, Перерегистрировать) with disabled reasons, transport+registration journal.
  - Icon `settings.system-state` in Icon Registry + catalog.
  - **`multiSessionsEnabled` toggle** in settings UI (facade + port; no Use Case) — shipped P11 WU4; enables R7-5 re-smoke via Settings → Sessions.
  - Collapsed mode preserves critical call/status visibility.
  - **Header SIP status (ADR-0004):** unified dot + label + timer suffix via `deriveSipStatusShell`; priority idle → transport → registration → registered → DND; Russian copy per §1.2.
  - **Removed:** legacy recovery overlay, header `control-reregister-sip`, user online/offline toggles; LF-009 avatar ring **cancelled**.
  - **Avatar user menu** on click: settings (animated icon), DND toggle (orange when active, registered only), logout (LF-086); no online/offline presence.
  - **Call UI skeleton (design parity 2026-06-26):** context zone top (sessions/idle/DTMF); controls zone bottom (labeled `CallControlsBar` + reference dialpad); vertical `CallSessionStack` for multi-call; `CallSessionCard` for single call; `CallIdleEmptyState` when idle.
  - **Shell always expanded (2026-06-26):** no collapse strip; dialpad and context visible before SIP registration; dialpad input, call action, and call controls (except hangup) disabled with reason until SIP registered.
  - Operator status selector always visible in header zone.
  - **Icon-only controls:** semantic `AppIcon` + 300ms hover tooltip via `IconControlButton`; `aria-label` preserved (T-001 done); tooltip auto-orients within viewport via Floating UI portal (2026-07-04).
  - **Theme (LF-082):** light default; `theme` in UserSettings; segmented control in General settings; `applyAppTheme` sets `data-theme` on documentElement; semantic tokens in `tokens.css` for light and dark.
  - **Unified action notifications (LF-060):** renderer uses `NotificationViewport` + `useNotifications`; action outcomes are bridged via `useActionNotifications`; repeated operation outcomes are not deduplicated (each attempt creates its own toast); persisted preferences (`notificationPlacement`, `notificationStacking`, `notificationDurationMs`, `notificationClosable`, `notificationMaxVisible`) are stored in `UserSettings` and edited in `SettingsGeneralPanel`.
  - **Native app icon theme sync (2026-07-01):** renderer theme change triggers typed IPC `platform:set-native-theme`; main process updates `nativeTheme.themeSource` and switches theme-aware icon asset (`icon-light.png`/`icon-dark.png`) for dock/window surfaces.
  - **Shell window layout (F-016):** compact mode anchors bottom-right on startup; settings overlay expands window to 1000px width centered; closing restores prior compact width and height at bottom-right; animation 280ms aligned with settings panel slide; `prefers-reduced-motion` skips animation; compact mode disables user resize; settings mode enables user resize.
  - **Shell lifecycle controls (F-016, LF-079):** no native File/View/Window/Help menu on Windows/Linux; macOS keeps minimal App + Edit menus (Edit roles wire Cmd+C/V/A/X/Z in inputs); macOS dev builds add a minimal View menu with `toggleDevTools` (Cmd+Option+I); `webPreferences.devTools` is enabled only when `!app.isPackaged`; `maximizable`/`fullscreenable` disabled; Windows/Linux use native-like titlebar controls `Minimize -> Reload -> Close`; macOS uses custom traffic-light controls `Close -> Minimize -> Reload` (no maximize/fullscreen button); reload on macOS has no tooltip and replaces the green traffic-light slot; close/quit/reload run `ShutdownCleanupUseCase` before `app.quit()` or `app.relaunch()`; cleanup failure blocks quit/restart, cancels pending main shutdown state, and surfaces `shell.shutdown.failed`; facade-not-ready shutdown is acknowledged with cleanup skipped to prevent hangs; force quit/kill cannot guarantee async SIP/OCP logout.
- Test Coverage:
  - Unit: `validateUserSettings`, `migrateUserSettings`, `InMemorySettingsRepository` / `FileSettingsRepository` round-trip; `ShellWindowLayout`, `ShellWindowLayoutService`
  - Integration: facade `updateMultiCallSettings`, `getUserSettingsForAccount`, `saveUserSettings`, `refreshUserSettingsProjections`
  - Component: `SettingsPanel`, `SettingsFullscreenOverlay`, `SettingsSidebar`, section panels; `UserAvatar`, `RegistrationStatusDot`, `SoftphoneShellHeader`; `IconTooltip.test.tsx` (T-001); Storybook layout + settings overlay (WU0+)
  - E2E: settings and shell UX
- Implementation evidence (WU1): `SettingsRepository.setMultiCallSettings`, `AccountBootstrapFacade.updateMultiCallSettings`, `useSettingsActions`, `SettingsOverlay`, `applyMultiCallSettings` store refresh
- Implementation evidence (WU2): `CallLineRow`, `deriveCallLineStatusLabel`, `deriveCallLinesShell` (visible `>=1` line), `useCallLineRowShell`, `useCallLinesActions` per-line hold/mute/transfer, `OutgoingCallCard` pre-line-only (legacy `ConnectionOverlay` scrim **removed** T-008)
- Implementation evidence (WU3): `deriveHeaderChromeShell`, `useHeaderChromeShell`, `UserAvatar`, `RegistrationStatusDot` — **shell collapse removed 2026-06-26**
- Implementation evidence (WU4): `UserSettings` v1, `validateUserSettings`, `migrateUserSettings`, `SettingsRepository.getUserSettings`/`saveUserSettings`, `FileSettingsRepository`, facade `getUserSettingsForAccount`/`saveUserSettings`/`refreshUserSettingsProjections`, `P11-Settings-Schema-Design.md`
- Implementation evidence (UI-4 **complete**): WU5 slices A–I + final gate — `styles.css` deleted; `globals.css` owns reset/body/focus-visible; all renderer panels/modals/shells on `*.module.css`; `handoffs/P11-WU5-UI-4-Final-Gate-Handoff.md`
- Implementation evidence (UI-4 modules): `src/renderer/styles/tokens.css`, `globals.css`, `UserAvatar.module.css`, `RegistrationStatusDot.module.css`, `SoftphoneShellHeader.module.css` (WU5 Slice A), `SettingsOverlay.module.css`, `ShellOverlaySheet.module.css` (WU5 Slice B), `CallLineRow.module.css` (WU5 Slice C), `Dialpad.module.css` (WU5 Slice D), `ActiveCallControlsPanel.module.css`, `OutgoingCallCard.module.css`, `IncomingCallModal.module.css`, `IncomingCallActions.module.css` (WU5 Slice E), `ConnectionOverlay.module.css` (WU5 Slice F), `App.module.css`, `SoftphoneLayout.module.css`, `ShellChromeText.module.css`, `CallLinesShell.module.css`, `CallContextShell.module.css` (WU5 Slice G), `BootstrapPanel.module.css`, `AccountPanel.module.css`, `PhoneStatusBadge.module.css` (WU5 Slice H), `DialogPanel.module.css`, `TransferPanel.module.css`, `StatusSelector.module.css`, `OcpToastStack.module.css`, modals + `CallControlsShell.module.css` (WU5 Slice I), `P11-CSS-Modules-Tokens-Migration.md`, WU5 slice handoffs `P11-WU5-Slice-A` through `P11-WU5-Slice-I`
- Implementation evidence (icon tooltips **T-001 done**): `IconTooltip`, `IconControlButton`, `iconTooltipDelay.ts`, `IconTooltip.test.tsx`; 300ms hover delay (`prefers-reduced-motion: reduce` → instant); viewport flip/shift via `@floating-ui/react-dom` portal; wired on all icon-only controls; gate `handoffs/P11-Icon-Tooltips-Agent-Prompt.md` (2026-06-25, auto-orient 2026-07-04, delay 300ms 2026-07-04)
- Implementation evidence (T-005 settings UX **done**): `SettingsFullscreenOverlay`, `SettingsPanel`, `SettingsSidebar`, `settingsSections.ts`, section panels (`SettingsGeneralPanel`, `SettingsSessionsPanel`, `SettingsAccountPanel`, `SettingsDiagnosticsPanel`, `SettingsCodecsPanel`, `SettingsHeadsetPanel`); header diagnostics opens settings diagnostics section; 7 new settings nav icons in `iconCatalog.ts` (2026-06-26)
- Implementation evidence (LF-060 notifications **done**): `NotificationViewport`, `useNotificationSonnerSync`, `useNotifications`, `useActionNotifications`, `NotificationViewport.test.tsx`, `NotificationSettings`, `validateUserSettings`/`migrateUserSettings` notification fields, `SettingsGeneralPanel` notification controls, `SoftphoneReadyShell` unified action feedback integration (OCP/update/account/call/settings/session flows), success/error icon-only distinction on neutral toast surface.
- Implementation evidence (dialpad home **2026-06-26**): `CallSessionStack`, `CallSessionCard`, `CallControlsBar`, `DtmfKeypadPanel`, reference `Dialpad`; gate `handoffs/P11-Call-UI-Design-Parity-Handoff.md`
- Implementation evidence (transfer flow parity **2026-06-29**): `TransferPanel` moved to `CallContextShell` (context mode), step chrome (1–4), explicit source/consultation cards, controls zone hides `CallControlsBar` + `Dialpad` while transfer mode active; stories `TransferPanel.stories.tsx`, `Dialpad.stories.tsx`, `CallSessionCard.stories.tsx`
- Implementation evidence (T-008 **2026-07-02**): `sipSessionHealthProjection`, `deriveSipStatusShell`, `deriveSipSystemStateShell`, `SettingsSystemStatePanel`, `useSipSystemStateActions`, `SipRecoveryOrchestrationService` — `TRANSPORT-REGISTER-STATE-REFACTORING.md`
- Implementation evidence (shell window layout **2026-06-26**): `ShellWindowLayout`, `ShellWindowLayoutService`, `ShellWindowGateway`, `ShellWindowController`, `shell:apply-window-layout` IPC, `useShellWindowLayout`; LF-055, LF-056 (anchor)
- Implementation evidence (shell lifecycle restart **2026-07-06**): `AppShutdownCoordinator` cancel/reset path, `installApplicationMenu`, `ShellTitleBar`, `ShellWindowControls`, `useShellWindowControls`, `useAppShutdown`, `PreloadAppLifecycleGateway`, IPC `app:request-restart` + `app:cancel-shutdown`, `ShutdownCleanupUseCase` quit/restart ack path with `cleanupSkipped`; LF-079
- Implementation evidence (icons foundation): `lucide-react`, `lucide-animated`, `motion`, `AppIcon`, `iconCatalog.ts`, `Icon-Registry.md`, `guides/Icon-Agent-Guide.md`, `.cursor/rules/icons.mdc`, `.cursor/skills/icons/SKILL.md`
- UI docs: `UI-Architecture.md`, `UI-Design-System.md`, `P11-Call-Line-UX-Design.md`, `P11-Header-Collapsed-UX-Design.md`, `P11-Settings-Schema-Design.md`, `P11-CSS-Modules-Tokens-Migration.md`, `handoffs/P11-WU0-Shell-Layout-Handoff.md`, `handoffs/P11-WU1-Settings-Overlay-Handoff.md`, `handoffs/P11-WU2-Call-Line-UX-Handoff.md`, `handoffs/P11-WU3-Header-Collapsed-Handoff.md`, `handoffs/P11-WU4-Settings-Schema-Handoff.md`, `handoffs/P11-WU5-UI-4-Final-Gate-Handoff.md`, `handoffs/P11-Post-WU5-Shell-Polish-Handoff.md`, `handoffs/P11-Icon-Tooltips-Agent-Prompt.md` (T-001 gate)

## F-017: Diagnostics And Logging

- Legacy IDs: `LF-066`, `LF-067`, `LF-068`, `LF-069`, `LF-070`, `LF-083`, `LF-088`, `LF-089`
- Context: Integration
- Priority: medium
- Status: planned
- Owner: TBD
- Inputs: user actions, SIP diagnostics, audio diagnostics, export command
- Outputs: diagnostic records, OCP log messages, filtered logs, exported file
- Acceptance Criteria:
  - Logs use correlation IDs and contain no secrets.
  - OCP log transport uses a gateway, not `window.ws`.
  - Retention removes logs older than the configured policy.
- Test Coverage:
  - Unit: log normalization and filtering
  - Integration: diagnostic repository and export adapter
  - E2E: diagnostics panel

## F-018: Tone Playback Priority

- Legacy IDs: `LF-021` (multi-call tone overlap)
- Context: Media
- Priority: high
- Status: done
- Owner: domain-agent
- Inputs: concurrent tone requests from call orchestrators (ringtone, ringback, busy, failed)
- Outputs: single audible tone stream via `MediaGateway`; suppressed requests remain pending until they win arbitration
- Acceptance Criteria:
  - Only one tone plays at a time; no overlapping WebAudio loops.
  - Priority (high → low): incoming ringtone > ringback > busy/failed.
  - Multiple ringing incoming lines produce one ringtone; earliest request wins until answered/released, then next ringing line plays.
  - Incoming ringtone supersedes ringback and terminal tones; ringback resumes when incoming tone request ends.
  - `releaseAll` clears pending tone requests and stops active playback.
- Test Coverage:
  - Unit: `resolveActiveTonePlayback`, `TonePlaybackCoordinator`
  - Integration: `ArbiterMediaGateway` with `CallEngine` multi-line scenarios
  - E2E: deferred (manual multi-call smoke)
- Implementation evidence: `src/domain/media/resolveActiveTonePlayback.ts`, `src/application/services/TonePlaybackCoordinator.ts`, `src/adapters/media/ArbiterMediaGateway.ts`, bootstrap wiring in `createMockAccountBootstrap` / `createRealAccountBootstrap`

## F-019: Distribution Packaging

- Legacy IDs: none
- Context: Integration
- Priority: high
- Status: implemented
- Owner: domain-agent
- Inputs: production Vite build (`VITE_ADAPTER_MODE=real`), electron-builder targets per OS
- Outputs: Windows NSIS installer, macOS DMG, Linux AppImage and deb in `dist/win`, `dist/mac`, `dist/linux` (or `dist/all` for `build:all`)
- Acceptance Criteria:
  - `npm run build:win|mac|linux` produces installable artifacts for the host OS.
  - Production bundle uses real telephony adapters, not mock default.
  - End-user install and SIP setup steps documented in `guides/install-instruction.md`.
  - Optional CI workflow builds all platforms on version tags.
- Test Coverage:
  - Unit: n/a (infra)
  - Integration: manual smoke — install, authorize SIP, place call
  - E2E: deferred until installer harness exists
- Implementation evidence: `electron-builder.yml`, `.env.production`, `package.json` dist scripts, `.github/workflows/release.yml`, `guides/install-instruction.md`

## F-020: Manual In-App Update Check

- Legacy IDs: none
- Context: Integration
- Priority: medium
- Status: implemented
- Owner: domain-agent
- Inputs: startup background manifest fetch; user «Проверить обновления» in Settings → General; `VITE_UPDATE_MANIFEST_URL`; installed app version from main process
- Outputs: non-blocking startup update banner when newer version exists; update status projection in Settings; optional `shell.openExternal` to HTTPS download/release page; structured logs
- Acceptance Criteria:
  - No electron-updater, no silent download/install, no code-signing requirement.
  - Remote manifest validated from `unknown`; semver compare for update vs up-to-date.
  - States: idle, checking, updateAvailable, upToDate, unavailable, invalidManifest, error.
  - Startup background check runs once per app session after ready shell mount; Strict Mode safe; failures silent (no error/unavailable/invalidManifest in Settings snapshot).
  - Non-blocking update modal overlay on `updateAvailable` only; «Позже» or «Скачать» persists dismissed `latestVersion` in `UserSettings` and `localStorage` until manifest reports a newer version; does not interrupt calls.
  - «Открыть страницу загрузки» opens manifest `downloadUrl` (releases page), not `platforms.*` direct installer URL.
  - Manual Settings check unchanged; installation remains user-driven via open download URL only.
  - Failures never crash app; active calls not interrupted.
  - `openExternal` only in main via typed IPC; HTTPS URLs only (localhost HTTP for tests).
  - Current version shown from `app.getVersion()`.
- Test Coverage:
  - Unit: `parseUpdateManifest`, `compareSemanticVersions`, `evaluateUpdateAvailability`, `CheckForUpdatesUseCase`, `OpenExternalUrlContract`, `isAllowedHttpsUrl`
  - Component: `SettingsGeneralPanel` about section; `UpdateAvailableBanner`
  - Hook: `useAppUpdate` background prompt visibility, persisted dismiss per version (UserSettings + `LocalStorageUpdateBannerDismissStore`), silent background failures, download callback
  - Integration: deferred (manual manifest smoke)
  - E2E: deferred
- Implementation evidence: `src/domain/updates/`, `src/application/use-cases/CheckForUpdatesUseCase.ts`, `src/adapters/updates/FetchUpdateMetadataAdapter.ts`, `src/adapters/updates/LocalStorageUpdateBannerDismissStore.ts`, `src/adapters/platform/PreloadPlatformInfoGateway.ts`, `src/adapters/platform/PreloadExternalUrlGateway.ts`, `src/shared/ipc/OpenExternalUrlContract.ts`, `src/renderer/hooks/useAppUpdate.ts`, `src/renderer/components/updates/UpdateAvailableBanner.tsx`, `src/renderer/components/settings/panels/SettingsGeneralPanel.tsx`, `src/renderer/shells/SoftphoneReadyShell.tsx`, `guides/Manual-Update-Manifest.md`, `docs/softphone/release/update-manifest.json`, `guides/GitHub-Releases-Update-Guide.md`

## F-021: Interface Internationalization And Language Settings

- Legacy IDs: none
- Context: Settings
- Priority: high
- Status: implemented
- Owner: TBD
- Inputs: user language preference, translation catalog, UI message keys
- Outputs: persisted language setting, localized renderer UI, translation coverage checks
- Acceptance Criteria:
  - Language selector exists in Settings → General.
  - Language is persisted per user in `UserSettings`.
  - Selected language applies immediately without restart.
  - All touched UI and UI-facing logic add keys for every supported locale.
  - No new hardcoded user-visible strings outside approved translation modules/tests/stories.
  - Supported interface locales are `ru`, `en`, `fr`, `de`, `bg`; catalogs stay key-parity complete for migrated modules.
  - Settings → General language selector renders full locale labels and does not reuse numeric input styling.
  - Renderer UI-facing modules (`components`, `helpers`, `shells`, UI-facing `hooks`) are key-based and resolved through i18n runtime.
  - UI-facing `application/projections` emit semantic keys/params (no localized sentences).
- Test Coverage:
  - Unit: `SupportedLanguage` validation, `UserSettings` v2 migration/validation, translation key parity, interpolation.
  - Component: Settings language selector and at least one critical shell/call surface in `ru`, `en`, `fr`, `de`, and `bg`.
  - Integration: save/reload language through `AccountBootstrapFacade` + settings repository.
  - E2E: deferred until harness exists.
- Implementation evidence: `docs/softphone/adr/ADR-0006-interface-internationalization.md`, `src/domain/settings/SupportedLanguage.ts`, `src/domain/settings/UserSettings.ts`, `src/renderer/i18n/messages.ts`, `src/renderer/i18n/runtime.ts`, `.cursor/rules/i18n.mdc`, `docs/softphone/I18N-Architecture.md`, `docs/softphone/I18N-Coverage.md`

## F-022: Codec Preferences

- Legacy IDs: `LF-084`
- Context: Media | Settings
- Priority: medium
- Status: **implemented** (domain + port + adapter + UI; manual SBC smoke optional)
- Owner: TBD
- Inputs: user codec order/enablement in settings; browser capability snapshot (adapter)
- Outputs: persisted `UserSettings.codecPreferences`; SDP/`setCodecPreferences` on call/answer (WU-4)
- Acceptance Criteria:
  - `UserSettings` v3 with validated `codecPreferences` (audio + video lists).
  - v2→v3 migration injects defaults without breaking existing fields.
  - At least one voice audio codec enabled; `telephone-event` cannot be disabled.
  - Reorder/toggle helpers are pure domain functions for UI wiring.
  - New sessions use configured **audio** codec order (adapter WU-4 — **done**, hardened).
  - Settings Codecs panel with drag-and-drop and checkboxes (UI WU-5 — **done**).
  - Video codec prefs persisted but not applied to RTC sessions; video UI future-only.
  - Codec wiring ready before outbound offer and incoming answer; re-INVITE local SDP munged.
  - `setCodecPreferences` failures logged; call setup continues with SDP munging fallback.
  - Negotiated audio codec diagnostics via WebRTC stats after session confirmed.
- Test Coverage:
  - Unit: `validateCodecPreferences`, `reorderCodecPreferences`, `validateUserSettings` v3, `migrateUserSettings` v2→v3, `SettingsCodecsPanel.test.tsx`
  - Integration: facade/repository round-trip (deferred WU-3)
  - Adapter: `prepareJsSipSessionCodecPreferences`, `applyCodecPreferencesToPeerConnection`, `wireJsSipCodecPreferences`, `logNegotiatedAudioCodecs`, `JsSipTelephonyAdapter` codec paths; manual SBC checklist in work-history
  - E2E: deferred
- Implementation evidence (WU-2): `src/domain/media/CodecId.ts`, `CodecPreferences.ts`, `validateCodecPreferences.ts`, `reorderCodecPreferences.ts`, `UserSettings` v3, `docs/softphone/P11-Codec-Preferences-Design.md`
- Implementation evidence (WU-3): `src/ports/media/CodecPreferencesPort.ts`, `SettingsRepositoryCodecPreferencesAdapter.ts`, `resolveEnabledCodecs.ts`, bootstrap inject in `createRealAccountBootstrap.ts`
- Implementation evidence (WU-4): `prepareJsSipSessionCodecPreferences.ts`, `buildJsSipCallMediaOptions.ts`, `applyCodecPreferencesToPeerConnection.ts`, `mungeSdpCodecOrder.ts`, `wireJsSipCodecPreferences.ts`, `logNegotiatedAudioCodecs.ts`, `resolveJsSipSessionCodecs.ts`, `JsSipTelephonyAdapter` makeCall/answer/incoming wiring
- Implementation evidence (WU-5 UI): `SettingsCodecsPanel.tsx`, `CodecPreferencesSortableList.tsx`, `useSettingsActions` codec callbacks, i18n `settings.codecs.*`

## F-023: Local Account Profiles And Settings Persistence

- Legacy IDs: `LF-077` (completion), `LF-076` (per-account fields), `LF-082`, `LF-084`
- Context: Settings | Integration
- Priority: high
- Status: **implemented** (Step 10 verification PASS 2026-07-06; F-023 test slice 75/75; repo-wide 1187/1189 — 1 pre-existing OCP flake out of scope)
- Owner: TBD
- Inputs: SIP authorization, account identity, user settings changes, app user-data path (infrastructure)
- Outputs: per-profile persisted `UserSettings` v3, active profile metadata, profile switch on authorize, optional secure credential storage
- Acceptance Criteria:
  - Profile key derived in Domain from normalized SIP identity (`username@domain`, optional server suffix); password never in key or JSON settings files.
  - Each authorized account has an isolated settings bucket; authorizing account B does not overwrite account A settings.
  - Returning to account A restores A settings (theme, language, multi-call, auto-answer, SIP recovery, codec preferences).
  - Active profile metadata stored separately from per-account `UserSettings`.
  - Real Electron mode persists to user-data via adapter with atomic writes; mock/tests remain in-memory.
  - `UserSettings` v3 migration and validation preserved; legacy username-only keys migrated once on read.
  - SIP-only and mock adapter composition unchanged; renderer uses facade only (no filesystem).
  - Corrupt persisted JSON surfaces classified errors; other profiles not destroyed on single-file corruption.
  - SIP passwords not stored in plain JSON; secure storage via port + Electron main if credentials are persisted, otherwise documented session-transient limitation (**Path A shipped** — `SecretStoragePort` contract only).
- Test Coverage:
  - Unit: profile key derivation, normalization edge cases
  - Adapter: `InMemorySettingsRepository` per-account isolation; `FileSettingsRepository` cross-instance persistence, corrupt JSON
  - Integration: facade authorize → switch → save → restore A/B/A
  - Secret: save/load/delete if credential persistence implemented
  - Component: settings account panel profile label (if UI changed)
  - E2E: deferred until harness exists
- Design: `docs/softphone/P11-Local-Account-Profiles-Design.md`
- Implementation evidence (Step 2 domain): `src/domain/settings/deriveSettingsAccountKey.ts`, `deriveSettingsAccountKey.test.ts`, `resolveSettingsAccountKey.ts`, `resolveSettingsAccountKey.test.ts`
- Implementation evidence (Step 3 ports): `src/ports/settings/SettingsRepository.ts` (`getActiveProfileKey`, `setActiveProfileKey`, `listKnownProfileKeys`), `InMemorySettingsRepository.ts`, `InMemorySettingsRepository.test.ts`, `FileSettingsRepository.ts` delegation
- Implementation evidence (Step 4 disk): `src/ports/filesystem/FileSystemPort.ts`, `src/infrastructure/filesystem/NodeFileSystemAdapter.ts`, `src/adapters/settings/profileStoragePaths.ts`, `profilesIndexDocument.ts`, `parsePersistedUserSettings.ts`, `FileSettingsRepository.ts`, `FileSettingsRepository.test.ts`
- Implementation evidence (Step 5 secrets Path A): `src/ports/secrets/SecretStoragePort.ts`, `src/adapters/settings/assertPersistedProfileJsonExcludesSecrets.ts`, `assertPersistedProfileJsonExcludesSecrets.test.ts`
- Implementation evidence (Step 6 application): `AuthorizeSipAccountUseCase.ts` (`setActiveProfileKey` on authorize), `application/settings/resolveSettingsAccountKey.ts`, `AccountBootstrapFacade.ts` (`applyActiveProfileSettingsSideEffects`, profile-aware save/load), `AccountBootstrapFacade.test.ts` (A→B→A restore)
- Implementation evidence (Step 7 composition): `createRealAccountBootstrap.ts`, `createRealBootstrapSettingsRepository.ts`, `resolveAxatalkProfilesStorageRoot.ts`, `registerProfilesPersistenceIpc.ts`, `PreloadFileSystemAdapter.ts`, `createRealAccountBootstrap.test.ts`, `resolveRealBootstrapDiskOptions.ts`
- Implementation evidence (Step 8 UI): `formatSettingsAccountIdentityLabel.ts`, `deriveActiveProfileSettingsSyncKey`, `SettingsAccountPanel.tsx` (account form only), `accountBootstrapProjection.ts` (`sipDomain`), `SettingsAccountPanel.test.tsx`, `SettingsOverlay.stories.tsx` (light + dark registered)
- Implementation evidence (Step 9 migration): `deriveLegacyUsernameOnlySettingsAccountKey.ts`, `loadUserSettingsWithLegacyMigration.ts`, `AuthorizeSipAccountUseCase.ts`, `AccountBootstrapFacade.ts` (`loadUserSettingsForAccountKey`), `loadUserSettingsWithLegacyMigration.test.ts`, `FileSettingsRepository.test.ts` (legacy on-disk), `AccountBootstrapFacade.test.ts` (legacy authorize)
- Implementation evidence (Step 10 verification): `npm run lint`, `typecheck`, `i18n:check`, `registry:check` PASS; F-023 test slice 75/75; preload IPC response parsing fix; `useSettingsActions.test.ts` preload mock parity
- Related: **F-016** (settings UX), **F-001** (SIP authorize), extends **LF-077** stub from WU4

## F-024: Saved SIP Account Profiles (Quick Sign-In)

- Legacy IDs: `LF-077` (saved profile list + quick sign-in UX; extends F-023 per-account persistence)
- Context: Settings
- Priority: high
- Status: **implemented** (corrective pass 2026-07-06)
- Owner: TBD
- Inputs: saved profile list from facade, manual/saved authorize, delete profile, profile switching
- Outputs: tab-style profile navigation in Settings → Account, password-only saved tab when unauthenticated, full form when registered, save-on-authorize checkbox on New, delete confirmation, safe server error display
- Acceptance Criteria:
  - Tab navigation shows localized «New» first; saved tabs show username with domain/server disambiguation when needed; keyboard-accessible tablist.
  - Unauthenticated saved tab shows password + Sign in only; registered saved tab shows full form without password prompt.
  - New tab shows full form and save-profile switch; duplicate identity disables save switch with explanation.
  - Switching registered profile A → B unregisters A before sending B credentials (on submit only).
  - Successful registration never fails because profile metadata save or `lastUsedAt` touch failed; non-blocking warnings only.
  - Server/SIP errors (403 license/policy, 404 not found) show sanitized server detail — not mislabeled as wrong password unless authentication-related.
  - Local saved profile missing shows `account.error.profileNotFound`; SIP 404 shows server registration error.
  - Delete requires confirmation; after delete selection returns to New; logout resets to New.
  - Password never persisted in saved profiles JSON, logs, UI snapshots, or tests.
  - Per-account settings load after successful registration from New or saved profile; failed auth does not apply target profile settings.
- Test Coverage:
  - Unit: `formatSavedAccountProfileSelectorLabel`, `deriveSavedAccountProfileSelectorOptions`, `mapAccountAuthorizationError`, `sanitizeRegistrationServerMessage`, `deriveSavedProfilePanelMode`, `matchesSipAccountIdentity`
  - Facade: `AccountBootstrapFacade.test.ts` (metadata non-blocking, switching unregister, settings A→B→A)
  - Hook: `useAccountActions.test.ts`
  - Component: `SavedAccountProfileSelector`, `DeleteSavedAccountProfileConfirmationModal`, `SettingsAccountPanel`, `AccountPanel`
  - Bootstrap: `createRealAccountBootstrap.test.ts`, mock repository injection
  - E2E: deferred
- Implementation evidence: `AccountBootstrapFacade.ts`, `mapAccountAuthorizationError.ts`, `SavedAccountProfileSelector.tsx`, `AccountPanel.tsx`, `useAccountActions.ts`, `useSettingsActions.ts`, `SettingsAccountPanel.tsx`, `createMockAccountBootstrap.ts`, `messages.ts` (ru/en/fr/de)
- Handoff: `docs/softphone/handoffs/P11-F024-Saved-Account-Profiles-Handoff.md`
