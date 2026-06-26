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
- Status: implemented
- Owner: TBD
- Inputs: SIP account settings, register command
- Outputs: `RegistrationSucceeded` or `RegistrationFailed`
- Acceptance Criteria:
  - Registration runs through `RegisterAccountUseCase`.
  - JsSIP is hidden behind `TelephonyGateway`.
  - Registration state is derived from Domain Events.
  - Manual SIP authorization emits `ManualSipAuthorizationRequested` and `SipCredentialsReceived`.
  - Phone status changes run through `ChangePhoneStatusUseCase` and emit `PhoneStatusChanged`.
  - UI phone status projection is event-derived.
- Test Coverage:
  - Unit: registration state transitions, phone status use case, manual SIP validation
  - Integration: mock telephony gateway, SIP-only and OCP bootstrap facade flows
  - E2E: deferred until SIP sandbox exists
- Real Adapter Track: in_progress (branch: feature/real-adapters; ADR-0001; RAT R1 done — JsSipTelephonyAdapter on `@hailrase/jssip` fork; register/unregister/reconnect + transport disconnect + legacy transport URL; manual SBC smoke pass 2026-06-24 — register/Online verified; fork notes: `real-integration/JSSIP-FORK.md`)

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
  - Reject reason is validated and emitted through `HostIntegrationGateway` as `soft-phone-break-reason`.
- Test Coverage:
  - Unit: state machine incoming transitions, auto-answer policy, DND policy, display-name parser, reject reason validation, answer/reject use cases
  - Integration: mock incoming adapter event to events/projection, ringtone start, answer/reject gateway calls, DND 486, host break-reason mapping, ended-before-answer recovery
  - E2E: deferred until incoming call harness exists
- Real Adapter Track: in_progress (branch: feature/real-adapters; ADR-0001; RAT R2+R3 steps 03–04 — JsSipTelephonyAdapter incoming/answer/reject/DND + `BrowserMediaAdapter` ringtone/remote audio; manual SBC smoke PASS 2026-06-24 — R2-1/2/3, R3-2/3/5)

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
  - Outgoing flow runs through mock `TelephonyGateway` and mock `MediaGateway` with deterministic events/projection updates.
  - Real JsSIP adapter remains deferred behind `TelephonyGateway` until dedicated adapter task.
  - **WU6 (done):** hold-all before second outgoing when Active exists; block dial while Connecting — `MultiCallPolicyService.checkConflictingOperationBlocked`, `CallEngine.multiCallPolicy.test.ts`.
- Test Coverage:
  - Unit: number validation and transitions
  - Integration: mock gateway make-call progress/answer/failure + media tones
  - E2E: deferred until dedicated Electron E2E harness exists
- Real Adapter Track: in_progress (branch: feature/real-adapters; ADR-0001; RAT R3 step 04 — JsSipTelephonyAdapter makeCall/outgoing progress/answered/failed; manual SBC smoke PASS 2026-06-24 — R3-1/R3-4)

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
- Test Coverage:
  - Unit: state machine valid/invalid transitions + use case command tests (including `ActiveCallControlFailed` on gateway failure)
  - Integration: mock telephony hold/resume/hangup success and failure paths
  - Renderer: `CallLineRow` disabled reasons, error banner, retry, icon row; `ActiveCallControlsPanel` retained for Storybook/tests only (removed from ControlsZone)
  - E2E: deferred until dedicated Electron E2E harness exists
- Real Adapter Track: **done** (RAT step 08, 2026-06-25) — multi-session R7-1…R7-5 PASS dev SBC; `multiSessionsEnabled` UI deferred P11

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
- Test Coverage:
  - Unit: use case and projection mute/unmute transitions (including invalid `ActiveCallControlFailed` operation payload guard)
  - Integration: mock media mute/unmute success and failure paths
  - Renderer: error banner and retry via `lastOperationError` projection
  - E2E: deferred until dedicated Electron E2E harness exists
- Real Adapter Track: in_progress (branch: feature/real-adapters; ADR-0001; RAT R4 step 05 — `BrowserMediaAdapter.muteCall`/`unmuteCall` end-to-end via `getPeerConnectionForCall`; manual SBC smoke PASS 2026-06-24 — R4-2)

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
  - WU4: `StartTransferUseCase` / `CancelTransferUseCase`; transfer panel UI with projection-driven disabled reasons; `LF-030` cancel without invalid state; `LF-031` auto-unhold via `MultiCallSettings.autoUnholdOnTransferFailure`.
- Test Coverage:
  - WU1: `MultiCallPolicy.test.ts`, `CallEngine.multiCallPolicy.test.ts`, `multiCallProjection.test.ts`, `MultiCallPolicy.integration.test.ts`
  - WU2: `TransferEligibility.test.ts`, `CallStateMachine.test.ts` (transfer transitions), `MockTelephonyGateway.blindTransfer.test.ts`, `BlindTransferUseCase.test.ts`, `CallEngine.blindTransfer.test.ts`, `transferProjection.test.ts`
  - WU4: `transferProjection.transferMode.test.ts`, `CallEngine.cancelTransfer.test.ts`, `TransferPanel.test.tsx`; WU1/WU2/WU3/P04 regression green
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
  - WU4: `TransferPanel`, `MultiLineCallList`, `useTransferActions`; blind/consultation/attended/cancel controls with test IDs; failure banner and in-progress indicator; `LF-030` cancel transfer mode.
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

- Legacy IDs: `LF-008`, `LF-009`, `LF-010`, `LF-048`, `LF-049`, `LF-057`, `LF-058`, `LF-079`
- Context: Telephony
- Priority: critical
- Status: implemented
- Owner: TBD
- Inputs: transport disconnects, registration failure, renderer restart, app close
- Outputs: recovery events and restored projections
- Acceptance Criteria:
  - Reconnect policy is explicit with OCP (6×5s LF-058) and SIP flat retry per user settings (LF-008): 5 attempts × configurable interval (min 5s), no exponential backoff.
  - Transport disconnect and registration failure are separate recovery paths (`SipReconnect*` vs `SipRegistrationRetry*`); overlay uses `sip_registration_failed` when transport stays up.
  - `RegistrationFailed` triggers orchestration; mid-session `registrationFailed` via `setRegistrationFailedHandler`; retry uses `reregister()` (same WebSocket) not full `register()`.
  - User settings: `sipAutoReregisterEnabled`, `sipReregisterIntervalSec`, `sipReregisterMaxAttempts` (per-user); timer reset on settings save; auto-off clears pending timers.
  - Retry pauses while active telephony sessions exist; resumes after `CallEnded`.
  - Manual re-register via `ReregisterSipUseCase` / `control-reregister-sip`; transport manual retry via `RetryConnectionUseCase`.
  - Failure reasons normalized (`mapSipRegistrationFailureKey`) and shown in Russian in overlay.
  - WU1 recovery domain events typed and tested (`OcpDisconnected`, `*Reconnect*`, `ServerTerminateReceived`).
  - `connectionRecoveryProjection` skeleton wired to store; SIP-only OCP fields N/A.
  - Port disconnect hooks wired in `ConnectionRecoveryOrchestrationService` (WU2).
  - `ReconnectScheduler` schedules one-shot retries with cleanup on success/terminal/terminate (WU2).
  - SIP disconnect → `SipReconnectScheduled` → `reconnectTransport` → `SipReconnectSucceeded` / `SipReconnectFailed` (LF-008).
  - OCP disconnect → `OcpDisconnected` → 6×5s retry → terminal `manual_retry_available` (LF-058).
  - Recovery flow is observable with correlation IDs.
  - Lost connection overlay renders projection states with channel rows, countdown, manual retry when available (LF-057, LF-009, WU3–WU4).
  - OCP `server_terminate` inbound publishes `ServerTerminateReceived`, stops retries, and triggers safe teardown (LF-049, LF-048, WU3–WU4).
  - Manual retry via `RetryConnectionUseCase` from overlay and shell re-register control (LF-010, WU4).
  - App shutdown IPC triggers `ShutdownCleanupUseCase` with hangup, unregister, scheduler dispose (LF-079, WU4).
  - SIP-only user logout via `EndUserSessionUseCase` and `SessionTeardownOrchestrationService`: dispose → hangupAll → `MediaGateway.releaseAll` → unregister → `UserSessionEnded` (LF-079, WU5).
  - `control-end-session` with confirmation modal when active telephony; projections reset to `sip_only_ready` (WU5).
- Test Coverage:
  - Unit: `ReconnectPolicy`, recovery events, `connectionRecoveryProjection`, `ReconnectScheduler`, `deriveConnectionRecoveryShell`, `deriveSessionLogoutShell`, `useReconnectCountdown`, `RetryConnectionUseCase`, `EndUserSessionUseCase`, `SessionTeardownOrchestrationService`, `AppShutdownContract`
  - Integration: `SipRecoveryOrchestration`, `OcpRecoveryOrchestration`, `ServerTerminate`, `ServerTerminateCleanup`, `ShutdownCleanup`, `SessionTeardown` (WU3–WU5)
  - Component: `ConnectionOverlay` (WU3–WU4), `LogoutActiveSessionConfirmationModal` (WU5), `AvatarRecoveryRing` (post-WU5 polish)
  - E2E: deferred until harness exists
- Implementation evidence (avatar recovery ring **2026-06-26**): `deriveConnectionRecoveryShell.showAvatarRecoveryRing` suppresses blocking overlay during SIP registration recovery; `AvatarRecoveryRing` on `SoftphoneShellHeader`; `deriveConnectionRecoveryShell.test.ts`, `AvatarRecoveryRing.test.tsx`; gate `handoffs/P11-Post-WU5-Shell-Polish-Handoff.md` (LF-009)

## F-015: OCP Call Synchronization And Campaigns

- Legacy IDs: `LF-037`, `LF-038`, `LF-039`, `LF-040`, `LF-050`, `LF-059`, `LF-063`, `LF-064`
- Context: Operator
- Priority: critical
- Status: implemented (mock gateway); **Product status: deferred_backlog** (ADR-0002; real WS R5 smoke deferred)
- Owner: TBD
- Inputs: OCP queue info, campaign events, notifications, call lifecycle events
- Outputs: queue projection, campaign modal state, OCP toasts, `dlg_stop`
- Acceptance Criteria:
  - Queue and `main_acallid` mapping is exact (WU1–WU3).
  - Campaign UX exists only when OCP plugin is enabled (WU3).
  - Campaign accept/reject sends OCP update via gateway before `CampaignEventAnswered` (WU3).
  - `dlg_stop` is sent exactly once for ended or failed calls with OCP correlation (WU4: `SendDlgStopUseCase`, `DlgStopPolicy`, `CallEndDlgStopOrchestrationService`).
  - OCP notifications render from typed projection; SIP-only hides toasts (WU4: `OcpToastStack`, `ocpNotificationProjection`).
  - Queue label transitions `loading` → `na` after timeout without polling (WU4: `QUEUE_LABEL_NA_TIMEOUT_MS`, `useQueueLabelNaTimer`).
- Test Coverage:
  - Unit: OCP message mapping, `DlgStopPolicy`, `SendDlgStopUseCase`, queue NA derivation, toast projection
  - Integration: `OcpQueueInfoSync`, `OcpCampaignSync`, `OcpDlgStopSync`, `OcpNotificationSync`
  - E2E: deferred until harness exists (WU4 handoff)
- Real Adapter Track: **deferred** (ADR-0002; `WebSocketOcpSyncGateway` in repo; R5 smoke out of scope — see `OCP-PLUGIN-BACKLOG.md`)

## F-016: Settings And Desktop Shell UX

- Legacy IDs: `LF-055`, `LF-056`, `LF-060`, `LF-076`, `LF-077`, `LF-082`, `LF-084`, `LF-085`, `LF-086`, `LF-087`, `LF-032` (multi-session toggle)
- Context: Settings
- Priority: high
- Status: **in_progress** (P11 WU0–WU5 + UI-4 **done**; **T-001** icon tooltips, **T-002** AppIcon, **T-005** fullscreen settings, **post-WU5 shell polish** done 2026-06-26; open: UI-6 Radix modals, theme LF-082, draggable LF-056, toast LF-060)
- Owner: TBD
- Inputs: user settings, account identity, shell interactions
- Outputs: persisted settings, collapsed UI state, theme, menu projections
- Acceptance Criteria:
  - Settings are per-user and validated.
  - **UserSettings v1** aggregate persisted per `SettingsAccountKey` with migration from v0 fragments.
  - Corrupt or unsupported schema version surfaces observable error (no silent security-sensitive defaults).
  - **Overlay navigation:** settings open fullscreen over call context; diagnostics is a settings section; call context stays mounted (`UI-Architecture.md`).
  - **Settings sidebar:** collapsed icon rail; expanded labels overlay content without shrinking the panel.
  - **Settings sections:** Account (SIP auth), General (SIP re-register), Sessions (multi-call), Diagnostics (F-017 stub), Codecs (stub), Headset (P10 stub).
  - **`multiSessionsEnabled` toggle** in settings UI (facade + port; no Use Case) — enables R7-5 re-smoke without repo hack.
  - Collapsed mode preserves critical call/status visibility.
  - **Compact registration dot** on header avatar reflects SIP registration and phone status (LF-011); red when not registered.
  - **Avatar recovery ring** shows SIP re-registration countdown on avatar border without fullscreen overlay (LF-009).
  - **Avatar user menu** on click: settings, DND toggle (orange when active), logout (LF-086).
  - **Dialpad home screen:** controls zone first; `CallSessionTabs` above split input+call dialpad; compact `ActiveCallQuickBar` for active line; inline delete in input (F-003/F-004 UI).
  - **Collapse toggle** minimizes shell to ~56px strip; ContextZone compact `CallLineRow` stays mounted.
  - **Icon-only controls:** semantic `AppIcon` + 1s hover tooltip via `IconControlButton`; `aria-label` preserved (T-001 done).
  - Electron shell behavior does not contain business logic.
- Test Coverage:
  - Unit: `validateUserSettings`, `migrateUserSettings`, `InMemorySettingsRepository` / `FileSettingsRepository` round-trip
  - Integration: facade `updateMultiCallSettings`, `getUserSettingsForAccount`, `saveUserSettings`, `refreshUserSettingsProjections`
  - Component: `SettingsPanel`, `SettingsFullscreenOverlay`, `SettingsSidebar`, section panels; `UserAvatar`, `RegistrationStatusDot`, collapsed `SoftphoneShellHeader`; `IconTooltip.test.tsx` (T-001); Storybook layout + settings overlay (WU0+)
  - E2E: settings and collapsed shell UX
- Implementation evidence (WU1): `SettingsRepository.setMultiCallSettings`, `AccountBootstrapFacade.updateMultiCallSettings`, `useSettingsActions`, `SettingsOverlay`, `applyMultiCallSettings` store refresh
- Implementation evidence (WU2): `CallLineRow`, `deriveCallLineStatusLabel`, `deriveCallLinesShell` (visible `>=1` line), `useCallLineRowShell`, `useCallLinesActions` per-line hold/mute/transfer, `ConnectionOverlay` blocking scrim, `OutgoingCallCard` pre-line-only
- Implementation evidence (WU3): `deriveHeaderChromeShell`, `useHeaderChromeShell`, `useShellCollapse`, `UserAvatar`, `RegistrationStatusDot`, collapsed `SoftphoneLayout`, `CallLineRow` compact variant, `P11-Header-Collapsed-UX-Design.md`
- Implementation evidence (WU4): `UserSettings` v1, `validateUserSettings`, `migrateUserSettings`, `SettingsRepository.getUserSettings`/`saveUserSettings`, `FileSettingsRepository`, facade `getUserSettingsForAccount`/`saveUserSettings`/`refreshUserSettingsProjections`, `P11-Settings-Schema-Design.md`
- Implementation evidence (UI-4 **complete**): WU5 slices A–I + final gate — `styles.css` deleted; `globals.css` owns reset/body/focus-visible; all renderer panels/modals/shells on `*.module.css`; `handoffs/P11-WU5-UI-4-Final-Gate-Handoff.md`
- Implementation evidence (UI-4 modules): `src/renderer/styles/tokens.css`, `globals.css`, `UserAvatar.module.css`, `RegistrationStatusDot.module.css`, `SoftphoneShellHeader.module.css` (WU5 Slice A), `SettingsOverlay.module.css`, `ShellOverlaySheet.module.css` (WU5 Slice B), `CallLineRow.module.css` (WU5 Slice C), `Dialpad.module.css` (WU5 Slice D), `ActiveCallControlsPanel.module.css`, `OutgoingCallCard.module.css`, `IncomingCallModal.module.css`, `IncomingCallActions.module.css` (WU5 Slice E), `ConnectionOverlay.module.css` (WU5 Slice F), `App.module.css`, `SoftphoneLayout.module.css`, `ShellChromeText.module.css`, `CallLinesShell.module.css`, `CallContextShell.module.css` (WU5 Slice G), `BootstrapPanel.module.css`, `AccountPanel.module.css`, `AuthStateView.module.css`, `PhoneStatusBadge.module.css` (WU5 Slice H), `DialogPanel.module.css`, `TransferPanel.module.css`, `StatusSelector.module.css`, `OcpToastStack.module.css`, modals + `CallControlsShell.module.css` (WU5 Slice I), `P11-CSS-Modules-Tokens-Migration.md`, WU5 slice handoffs `P11-WU5-Slice-A` through `P11-WU5-Slice-I`
- Implementation evidence (icon tooltips **T-001 done**): `IconTooltip`, `IconControlButton`, `iconTooltipDelay.ts`, `IconTooltip.test.tsx`; 1s hover delay (`prefers-reduced-motion: reduce` → instant); wired on all icon-only controls; gate `handoffs/P11-Icon-Tooltips-Agent-Prompt.md` (2026-06-25)
- Implementation evidence (T-005 settings UX **done**): `SettingsFullscreenOverlay`, `SettingsPanel`, `SettingsSidebar`, `settingsSections.ts`, section panels (`SettingsGeneralPanel`, `SettingsSessionsPanel`, `SettingsAccountPanel`, `SettingsDiagnosticsPanel`, `SettingsCodecsPanel`, `SettingsHeadsetPanel`); header diagnostics opens settings diagnostics section; 7 new settings nav icons in `iconCatalog.ts` (2026-06-26)
- Implementation evidence (dialpad home **2026-06-26**): `CallSessionTab`, `CallSessionTabs`, `ActiveCallQuickBar`, redesigned `Dialpad` split input, `CallControlsShell` stack, `SoftphoneLayout` controls-first; `CallContextShell` full rows only in collapsed mode; gate `handoffs/P11-Post-WU5-Shell-Polish-Handoff.md`
- Implementation evidence (avatar recovery ring **2026-06-26**): `AvatarRecoveryRing`, `deriveConnectionRecoveryShell.showAvatarRecoveryRing`, `SoftphoneShellHeader` wiring, `RegistrationStatusDot` red `not_registered`; `AvatarRecoveryRing.test.tsx`, Storybook `ShellHeader.stories.tsx`; LF-009, LF-011; gate `handoffs/P11-Post-WU5-Shell-Polish-Handoff.md`
- Implementation evidence (icons foundation): `lucide-react`, `lucide-animated`, `motion`, `AppIcon`, `iconCatalog.ts`, `Icon-Registry.md`, `Icon-Agent-Guide.md`, `.cursor/rules/icons.mdc`, `.cursor/skills/icons/SKILL.md`
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
