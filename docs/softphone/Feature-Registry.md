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
- Status: **implemented** (T-008 closed ? ADR-0004)
- Owner: TBD
- Inputs: SIP account settings, register command, transport lifecycle events from JsSIP adapter
- Outputs: `RegistrationSucceeded` or `RegistrationFailed`; transport events (`SipTransportConnecting`, `SipTransportConnected`, `SipTransportDisconnected`); `SipRegistrationCleared` on transport loss
- Acceptance Criteria:
  - Registration runs through `RegisterAccountUseCase`.
  - JsSIP is hidden behind `TelephonyGateway`.
  - Registration state is derived from Domain Events via `sipSessionHealthProjection`.
  - **ADR-0004:** `effectiveRegistered = isConnected && ua.isRegistered()`; projections never show `registered` when transport ? `connected`.
  - Transport and registration are orthogonal FSMs (`SipTransportState`, `SipRegistrationState`); `SipSessionHealth` invariants unit-tested.
  - Manual SIP authorization emits `ManualSipAuthorizationRequested` and `SipCredentialsReceived`; first attempt emits `SipSessionActivated`.
  - Logout emits `SipSessionReset`; header returns **?? ??????????**.
  - DND shown in header only when `isConnected && isRegistered && dndEnabled` (not as transport/presence substitute).
  - Header SIP status line via `deriveSipStatusShell` (Russian labels per ADR-0004 ?1.2); no user-selectable online/offline presence.
  - Phone status changes run through `ChangePhoneStatusUseCase` and emit `PhoneStatusChanged` (DND flag only when registered).
  - **Auth Flow Refactoring (ADR-AF-001/003, corrective):** SIP-only sign-in remains available without OCP; Account is the sole sign-in surface; Login disabled while SIP registered (avatar logout only); opted-in draft profile/secret save may run before attempt without promoting active session until SIP-ready.
  - **SIP-only staged notifications (F-001/F-029, 2026-07-17):** SIP-only ready emits two success toasts — transport connected, then registration succeeded. `ok` + `telephony.registration_failed` never claims phone registered; failure toast shows mapped error text and CTA «Состояние системы» when transport/registration fails (ADR-0004 / ADR-AF-005).
- Test Coverage:
  - Unit: `SipSessionHealth` invariants, transport FSM, registration state transitions, `deriveSipStatusShell` header rows, phone status use case, manual SIP validation
  - Integration: mock telephony gateway transport events, SIP-only bootstrap facade, effective registered guard on disconnect
  - Facade: `AccountBootstrapFacade.test.ts` (`sipAutoRegisterOnStartup` bootstrap gate, startup registration failure flag, `retryStartupRegistration`, registration_failed detail/transportConnected)
  - Application: `deriveAccountSignInNotificationFeedback.test.ts` (staged SIP success keys; transport-up vs transport-down failure)
  - Renderer: `useAccountActions.test.ts`, `useActionNotifications.test.ts` (no false SIP-ready success; System State CTA on error toast)
  - E2E: deferred until SIP sandbox exists
- Real Adapter Track: **done** (RAT step 02, 2026-06-24) ? `JsSipTelephonyAdapter` on `@hailrase/jssip` fork; register/unregister/reconnect + transport disconnect; manual SBC R1 PASS; fork notes: `real-integration/JSSIP-FORK.md`
- Refactor plan: `docs/softphone/TRANSPORT-REGISTER-STATE-REFACTORING.md` (T-008)
- Corrective track: `auth-flow/auth-flow-refactoring.md` + `handoffs/P11-Auth-Flow-Refactoring-Handoff.md`
- Implementation evidence (staged notifications): `AccountSignInOutcome.ts`, `deriveAccountSignInNotificationFeedback.ts`, `AccountBootstrapFacade.ts` (`sipTransportConnected`), `useAccountActions.ts`, `useActionNotifications.ts`

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
  - **WU6 (done):** answer while multi-sessions ON holds all other Active lines (`IncomingCallOrchestrator` + `holdAllActiveLines`); multi-sessions OFF + established call ? auto-486 second incoming; `MultiCallOperationRejected` fail-safe ? `src/domain/telephony/events/MultiCallOperationRejected.ts`, `MultiCallCompleteness.integration.test.ts`.
  - **UI (2026-06-30):** `IncomingCallSessionCard` in call context zone ? selectable green session card with ??????????/???????????; auto-select on ring; ControlsBar hangup rejects when incoming selected.
  - **Global overlay (2026-07-08):** `IncomingCallOverlayShell` in shell overlay layer ? iPhone-like top-center non-blocking banner; hidden on dialpad only while `IncomingCallSessionCard` is visible in context (shared `deriveIncomingCallSessionCardVisible`); shown on dialpad during DTMF/transfer/number-entry modes and on non-dialpad routes; dismiss per callId; body click and successful answer navigate to main call surface (`/`).
  - **iOS compact banner visual (2026-07-08):** frosted-glass material (`backdrop-filter` + semantic tokens), Framer Motion spring enter/exit, iOS systemGreen/systemRed action pills, accept-left / decline-right layout; `useReducedMotion` respected.
  - **Multi-call selection (2026-06-30):** while incoming rings with an established call, operator can select any session (incoming or established) and ControlsBar targets that session; `activeCallControlsProjection` preserves established call on `IncomingCallReceived`; `deriveCallControlTarget` resolves control target.
  - **LF-016 (done 2026-06-30):** auto-answer 0?300 s; `autoAnswerDuringActiveSessionEnabled` holds peers via `holdAllActiveLines` at timer fire; peer = any non-terminal session; global blocks: outgoing Connecting, transfer; per-call timers; settings refresh reschedules ringing calls.
- Test Coverage:
  - Unit: state machine incoming transitions, auto-answer policy, DND policy, display-name parser, reject reason validation, answer/reject use cases
  - Integration: mock incoming adapter event to events/projection, ringtone start, answer/reject gateway calls, DND 486, host break-reason mapping, ended-before-answer recovery
  - E2E: deferred until incoming call harness exists
- Real Adapter Track: **done** (RAT steps 03?04, 2026-06-24) ? `JsSipTelephonyAdapter` incoming/answer/reject/DND + `BrowserMediaAdapter` ringtone/remote audio; manual SBC R2+R3 PASS

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
  - New outgoing Connecting/outbound Ringing auto-becomes `selectedCall` (UI + operator selection); incoming ringing still wins; failed dial restores prior selection.
  - Outbound Connecting/Ringing lines are selectable (`primaryAction: hangup`); only the waiting incoming Ringing uses `answer`.
  - While any outbound dial is in progress, mute/unmute is disabled on all session controls (`outgoing_dial_in_progress`) to avoid stuck headset sync loaders.
  - Dialpad ArrowDown/ArrowUp walks unique history numbers (newest first); empty input + registered + history keeps Call enabled; first Call press fills last number, second press dials (idle dialpad and number-entry overlay).
- Test Coverage:
  - Unit: number validation and transitions; `resolveOutgoingInProgressCallId`; `dialpadHistoryRecall`; `Dialpad` arrow/recall Call enablement
  - Integration: mock gateway make-call progress/answer/failure + media tones
  - E2E: deferred until dedicated Electron E2E harness exists
- Real Adapter Track: **done** (RAT step 04, 2026-06-24) ? `JsSipTelephonyAdapter` makeCall/outgoing progress/answered/failed; manual SBC R3 PASS (R3-1/R3-4)

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
  - **WU6 (done):** exclusive resume (LF-023); hangup Active does not auto-resume Held (D1 ? no auto-resume code path); per-call mute on `CallLine` / `multiLineCallProjection`; per-line resume/hangup ? `deriveCallLinesShell.ts`, `CallLinesShell.tsx`.
  - **WU2 (done):** operator controls on `CallLineRow` in ContextZone (hold/mute/transfer/hangup/resume); human status via `deriveCallLineStatusLabel`; single-line visibility `lines.length >= 1`.
  - **Remote hold (done):** `CallRemoteHeld` / `CallRemoteResumed` projection flag `isRemoteHold`; call card badge ?????????? (????.)? without held chrome; dual local+remote shows both badges.
  - **Mute after hold/resume (done):** local and remote unhold re-INVITE renegotiation does not unmute operator mic when `Call.muted === true`; `executeResumeCall` and `BrowserMediaAdapter.attachRemoteAudio` re-sync media without extra domain events.
- Test Coverage:
  - Unit: state machine valid/invalid transitions + use case command tests (including `ActiveCallControlFailed` on gateway failure)
  - Integration: mock telephony hold/resume/hangup success and failure paths; mute survives local hold resume (`CallEngine.test.ts`)
  - Renderer: `CallLineRow` disabled reasons, error banner, retry, icon row; `ActiveCallControlsPanel` retained for Storybook/tests only (removed from ControlsZone)
  - E2E: deferred until dedicated Electron E2E harness exists
- Real Adapter Track: **done** (RAT steps 05+08, 2026-06-24/25) ? hold/resume re-INVITE R4 PASS; multi-session R7-1?R7-5 PASS; `multiSessionsEnabled` toggle in P11 settings (Sessions section)

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
- Real Adapter Track: **done** (RAT step 05, 2026-06-24) ? `BrowserMediaAdapter.muteCall`/`unmuteCall` via `getPeerConnectionForCall`; manual SBC R4-2 PASS

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
  - WU2: blind transfer runs through `BlindTransferUseCase` ? `CallEngine` ? `TelephonyGateway.blindTransfer`; domain events `CallTransferRequested`, `CallTransferred`, `CallTransferFailed`; eligibility rules in Domain; mock adapter success/failure paths; `transferProjection` read model.
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
  - WU3: `StartConsultationUseCase` / `AttendedTransferUseCase` ? `CallEngine` ? `TelephonyGateway.attendedTransfer`; `CallRelationship` model; events `ConsultationCallRequested`, `ConsultationCallStarted`, `ConsultationCallFailed`, `AttendedTransferRequested`, `AttendedTransferCompleted`, `AttendedTransferFailed`; failure events carry `restoredSourceState`; `ConsultationCallFailed` rolls back projections; consultation via existing `makeCall`; `multiLineCallProjection` + extended `transferProjection`; attended gateway failure allows retry complete; blocked when multi-sessions disabled (`LF-032`).
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

## F-009: Legacy Operator Authentication

- Legacy IDs: `LF-001`, `LF-002`, `LF-003`, `LF-004`, `LF-005`, `LF-085` (operator auth path)
- Context: Integration (removed)
- Priority: critical
- Status: **removed** (ADR-0005)
- Owner: TBD
- Notes: Legacy operator-platform authentication removed from product. SIP-only bootstrap remains.


## F-010: Legacy Platform Status Management

- Legacy IDs: `LF-018`, `LF-019`, `LF-041`?`LF-049`, `LF-062`, `LF-078`
- Context: Integration (removed)
- Priority: critical
- Status: **removed** (ADR-0005)
- Owner: TBD
- Notes: Legacy platform status, break reasons sync, and post-call workflows removed. `PhoneStatus` (online/offline/dnd) and SIP DND remain via `ChangePhoneStatusUseCase`.


## F-011: Host Integration Contract

- Legacy IDs: `LF-051`, `LF-065`, `LF-080`, `LF-081`
- Context: Integration
- Priority: critical
- Status: **planned** (legacy `window.Softphone` **not ported**; future path: `ExternalClientGateway` + `ExternalCommandRouter` over local WS → main)
- Owner: TBD
- Inputs: external commands from browser tabs via WS (not DOM globals)
- Outputs: typed commands routed to Facade / Use Cases with `callType: 'external' | 'sdk'`
- Acceptance Criteria:
  - No `window.Softphone` global API in Axatalk.
  - External tab integration uses one gateway + command router (future).
  - OCP external command payloads reuse `OcpHostApiContract` + Facade host methods (F-028 E-12).
- Test Coverage:
  - Unit: command payload parsing (F-028 E-12)
  - Integration: deferred until ExternalClientGateway exists
  - E2E: deferred
- Implementation evidence (OCP command surface): `src/shared/host-api/OcpHostApiContract.ts`; Facade `authenticateOcpFromHost` / `changeOcpStatusFromHost` / `getOcpConnectionState`

## F-012: Headset Call Controls

- Legacy IDs: `LF-071`, `LF-072`, `LF-073`, `LF-074`, `LF-075`
- Context: Headset
- Priority: high
- Status: **implemented** (P10 WU1–WU4 — Web HID v1, orchestrator, settings UI, ADR-0007; EXT-1/2/3 vendor profile registry — no user-visible change)
- Owner: TBD
- Inputs: hardware answer, hangup, hold, mute events
- Outputs: application commands and headset state events
- Acceptance Criteria:
  - Vendor details remain inside adapters.
  - Headset commands enter through Use Cases.
  - LED sync consumes state projections.
  - Headset session focus follows: incoming → outgoing → operator selection → primary → active → held (`resolveHeadsetSessionFocus`).
  - Hook-on hangup targets the focused established/outgoing session (including Held).
  - Mute from headset: pulse devices (Jabra HSC016) toggle on muted:true only (release bounce collapsed); latch devices (Poly BW3320) apply absolute mute bit; hold LED clears mute LED (telephony mute preserved in UI); resume restores session mute to headset.
  - Headset mute echo: pulse swallows all mute events in echo window; Poly latch uses `muteEchoPolicy: swallowAll` for firmware LED bounce; generic latch matchOnly keeps opposite as user override outside LED echo.
  - App→device `setMute` LED reconcile arms extended hardware mute echo (same as hold/resume path).
  - Headset-initiated mute/unmute confirms sync intent immediately after Use Case success (same as UI path) so rapid presses are not blocked.
  - Headset mute is rejected during incoming waiting and outgoing dial (restore presence LED even if sync-locked); UI mute sync clears against the muted session id, not only headset focus.
  - Outgoing dial auto-captures headset focus over operator selection.
  - After answering an incoming call, UI/headset selection stays on the answered session; reject/miss restores prior selection.
  - Headset faults surface operator toasts with recovery guidance (`HeadsetFaultOccurred`).
  - Reconnect realigns LED via `resolveInitialConnectCommands`.
  - USB unplug: disconnect + fault toast; no automatic failover to another granted device.
  - Authorize / profile switch applies headset user settings (`applyActiveProfileSettingsSideEffects` → `applyHeadsetUserSettings`) so auto-reconnect runs after login.
  - Preferred headset id (`headsetPreferredDeviceId`, settings schema v5) is persisted on successful connect; auto-reconnect and USB plug prefer that id among granted devices, else first granted.
  - Settings headset panel: enable/auto-reconnect toggles with hints first, guided connect CTA, empty-grant and auto-reconnect hints; `mergeHeadsetUserSettingsIntoProjection` keeps status in sync with saved settings.
- Test Coverage:
  - Unit: `buildHeadsetCallSnapshot.test.ts`, `resolveHeadsetSessionFocus.test.ts`, `resolveDeviceCommandsFromSnapshot.test.ts`, `forwardHeadsetHardwareEvent.test.ts`, `headsetPolicies.test.ts`, `HeadsetSessionOrchestrator.test.ts`, `pickGrantedHidDevice.test.ts`, `resolveHeadsetVendorProfile.test.ts`, `vendorProfileParity.test.ts`, `createHeadsetGateway.test.ts`, `SettingsHeadsetPanel.test.tsx`, `migrateUserSettings.test.ts` (v5)
  - Integration: `MockHeadsetGateway.ts`, `AccountBootstrapFacade` headset wiring (authorize → preferred auto-reconnect)
  - E2E: deferred until device harness exists
- Evidence:
  - Domain/ports: `src/domain/headset/`, `src/ports/headset/HeadsetGateway.ts`, `UserSettings.headsetPreferredDeviceId`
  - Application: `src/application/headset/` (incl. `session/resolveHeadsetSessionFocus.ts`, `policies/headsetMutePolicy.ts`, `policies/headsetHoldPolicy.ts`), `src/application/services/headset/HeadsetIntegrationService.ts`
  - Contract: `docs/softphone/HEADSET-SYNC-CONTRACT.md`
  - Adapters: `src/adapters/headset/webhid/` (incl. `profiles/`, `resolveHeadsetVendorProfile`), `src/adapters/headset/sdk/SdkHeadsetGatewayStub.ts`, `src/adapters/mock/MockHeadsetGateway.ts`
  - Infrastructure: `src/infrastructure/bootstrap/createHeadsetGateway.ts`
  - UI: `SettingsHeadsetPanel.tsx`, `useCallFeatureShell.ts` selection → `setHeadsetSelectedCallId`, `headsetSyncBusyProjection.ts`, `applyHeadsetSyncBusyToActiveCallControls.ts`
  - ADR: `docs/softphone/adr/ADR-0007-headset-web-hid.md`
  - Extensibility: EXT-1–11 **done** (vendor profiles, gateway factory, policies, SyncContract, capabilities UI, HID picker preferred id) — `handoffs/P10-Headset-Extensibility-Handoff.md`
  - Acceptance: connected headset shows capability summary in Settings (answer/reject/hangup/mute mode; hold only when supported); Electron `select-hid-device` prefers remembered softphone device id when present in the HID list

## F-013: Call History

- Legacy IDs: `LF-052`, `LF-053`, `LF-054`
- Context: Settings
- Priority: medium
- Status: implemented
- Owner: TBD
- Inputs: completed call events
- Outputs: persisted call history entry
- Acceptance Criteria:
  - Persistence is behind `CallHistoryRepository`.
  - History is derived from call events.
  - Storage failures are logged.
  - Per-account file persistence under `call-history/{encodedProfileKey}.json` when real bootstrap is active.
  - Missing or corrupt history document returns safe empty state with warning log.
  - Profile switch reload refreshes history projection for the active `SettingsAccountKey` without showing the previous account list.
  - History list labels are enriched through `contactDirectory` read model without mutating stored `displayLabel` snapshots.
  - History detail route (`/history/:entryId`) shows iPhone-like hero, grouped redial action, and metadata with localized not-found handling.
  - Delete entry removes one row from disk and projection after explicit AlertDialog confirmation; success navigates back to history list.
  - History detail opens an existing matched contact or starts a new contact form with safe history-number prefill without storing business data in route params.
  - `missed` outcome applies only to unanswered incoming calls canceled by the remote party; unanswered outgoing or local-rejected calls use `canceled`.
  - Each history entry stores `endReason` (`local_hangup` | `remote_cancel` | `failure` | `unknown`) and exposes it in detail metadata.
  - Each history entry stores total `durationSec` (ring + talk), plus separate `ringDurationSec` and `talkDurationSec`.
  - History list secondary line shows call start clock time only (no duration).
  - Persisted schema v2; v1 documents migrate safely (outgoing legacy `missed` → `canceled`, `endReason=unknown`).
  - Dialpad can walk unique `remoteNumber` values from the loaded history projection (ArrowDown = newer, ArrowUp = older) and recall the newest number via Call when the input is empty.
- Test Coverage:
  - Unit: history entry mapping, `CallHistoryCallTracker`, `deriveCallHistoryShell`, `contactDirectory`, `callHistoryProjection`, `parsePersistedCallHistoryDocument`, `DeleteCallHistoryEntryUseCase`, `dialpadHistoryRecall`
  - Integration: `InMemoryCallHistoryRepository`, `FileCallHistoryRepository`, `ListCallHistoryUseCase`, `RedialFromHistoryUseCase`, `DeleteCallHistoryEntryUseCase`, `createRealAccountBootstrap`
  - Renderer: `HistoryPanelShell`, `HistoryDetailPanel`, `HistoryDeleteConfirmationModal`, `HistoryShellRoutePanel`, `useCallHistoryDetailShell`, `useContactEditShell`, navigation guards
  - E2E: deferred until harness exists; manual smoke: `handoffs/Shell-Navigation-Phase6-Smoke-Checklist.md`
- Implementation evidence: `handoffs/P09-F013-Call-History-Display-Logic-Handoff.md`, `src/domain/settings/CallHistoryEntry.ts`, `persistedCallHistoryMigration.ts`, `CallHistoryCallTracker.ts`, `deriveCallHistoryShell.ts`, `deriveCallHistoryDetailShell.ts`, `HistoryDetailPanel.tsx`, `resolveHistorySecondaryTimeLabel.ts` ? gate `39afae2` (2026-07-09)

## F-026: Caller Identity Presentation

- Legacy IDs: _none_
- Context: Settings
- Priority: medium
- Status: **in progress** (Phase 9 UX polish done ? final gate in Phase 10)
- Owner: TBD
- Inputs: contacts projection, remote number, optional SIP/display label snapshot
- Outputs: `CallerPresentation` read model for shell projections
- Acceptance Criteria:
  - Contact `displayName` beats SIP/display label when normalized phone matches.
  - SIP/display label beats number only when no contact matches and label differs from number.
  - Number remains available as secondary label when contact or SIP label is primary.
  - Duplicate phone fallback prefers primary-phone owner, then stable `ContactId` ordering.
  - History storage is not mutated when contacts change.
  - Active call lines, incoming session card, controls bar, and outgoing pre-connect card use the same read model.
- Test Coverage:
  - Unit: `contactDirectory`, `deriveCallHistoryShell`, `deriveCallLinesShell`, `deriveIncomingCallIdentityShell`, `deriveIncomingCallControlLine`
  - Integration: deferred until profile-switch + active-call smoke harness exists
  - Renderer: history list and call lines use enriched labels via shell hooks
  - E2E: deferred until harness exists

## F-014: Recovery And Reconnect

- Legacy IDs: `LF-008`, `LF-010`, `LF-048`, `LF-049`, `LF-058`, `LF-079` (SIP path); `LF-009` **cancelled** (ADR-0004); `LF-057` **superseded** (ADR-0004)
- Context: Telephony
- Priority: critical
- Status: **implemented** (T-008 closed ? ADR-0004)
- Owner: TBD
- Inputs: transport disconnects, registration failure, manual reconnect/reregister/refresh from settings, app close
- Outputs: `SipRecoveryOrchestrationService` events; `sipSessionHealthProjection`; settings journal entries; restored header/settings projections
- Acceptance Criteria:
  - **ADR-0004 SIP-only path:** `SipRecoveryOrchestrationService` replaces connection recovery SIP orchestration; strict transport-before-registration pipeline.
  - Transport disconnect clears registration projection (`SipRegistrationCleared`); never show `registered` when socket down.
  - SIP flat retry per user settings (LF-008): transport and registration each configurable ? interval (min 5s), max attempts, no exponential backoff.
  - UserSettings v2: `sipAutoReconnectEnabled`, `sipReconnectIntervalSec`, `sipReconnectMaxAttempts`, `sipAutoReregisterEnabled`, `sipReregisterIntervalSec`, `sipReregisterMaxAttempts`, `sipAutoRegisterOnStartup`.
  - Transport WebSocket connection timeout: 10 seconds; on timeout publishes `SipTransportDisconnected` and follows auto-reconnect policy when enabled.
  - Runtime `registrationFailed` (including 403 while previously registered) publishes `RegistrationFailed`, clears effective registration, and follows auto-reregister policy when enabled.
  - Registration failures (including 401/403) follow the same auto-reregister policy when `sipAutoReregisterEnabled` is on.
  - Retry pauses while active telephony sessions exist; header shows fault immediately; scheduling resumes after `CallEnded`.
  - Manual actions in **Settings ? ????????? ???????** only: `ManualSipTransportReconnectUseCase` (timer reset, attempt # unchanged), `ReregisterSipUseCase` (transport connected guard).
  - **Removed SIP-only:** legacy recovery overlay/shell, header `control-reregister-sip`.
  - `SipConnectionJournal` in-memory ring buffer for transport + registration events (correlationId, timestamp).
  - Failure reasons normalized (`mapSipRegistrationFailureKey`) and shown in Russian in settings panel and header.
  - App shutdown IPC triggers `ShutdownCleanupUseCase` with hangup, unregister, scheduler dispose (LF-079).
  - SIP-only user logout: `hangupAll ? unregister({ all: true }) ? ua.stop() ? SipSessionReset ? idle`; all recovery timers cleared (LF-079).
  - **OCP recovery (ADR-AF-002, corrective F-028):** Server/transport and Authorization are independent projections; Application owns fresh-HTTP-token reconnect; adapter must not reconnect with a retained ephemeral token; auth-only retry reuses the open socket; `SESSION_EXIST` forces server retry (new socket).
- Test Coverage:
  - Unit: `SipSessionHealth`, `buildSipTransportRecoveryPolicy`, `buildSipRegistrationRecoveryPolicy`, `sipSessionHealthProjection`, `deriveSipStatusShell`, `deriveSipSystemStateShell`, `ReconnectScheduler`, `ManualSipTransportReconnectUseCase`, `SipRecoveryOrchestrationService` (pause/resume during active call ? Q6), `EndUserSessionUseCase`, `SessionTeardownOrchestrationService`
  - Integration: `SipRecoveryOrchestration.integration.test.ts` (transport?registration order, pause during call, uniform auth retry, manual reconnect)
  - Component: `SettingsSystemStatePanel`, `LogoutActiveSessionConfirmationModal`; header SIP status (no overlay)
  - Facade: `AccountBootstrapFacade.test.ts` (`sipAutoRegisterOnStartup` honored at bootstrap; persistent startup failure + retry)
  - E2E: deferred until harness exists
- Refactor plan: `docs/softphone/TRANSPORT-REGISTER-STATE-REFACTORING.md` (T-008)
- Corrective track (OCP dual FSM): `auth-flow/auth-flow-refactoring.md` WU-02; ADR-AF-002
- Supersedes: LF-057 overlay UX, LF-009 avatar ring (cancelled)

## F-015: Legacy Call Sync And Campaigns

- Legacy IDs: `LF-037`?`LF-040`, `LF-050`, `LF-059`, `LF-063`, `LF-064`
- Context: Integration (removed)
- Priority: critical
- Status: **removed** (ADR-0005)
- Owner: TBD
- Notes: Queue sync, campaign modals, call correlation, and platform notifications removed.


## F-016: Settings And Desktop Shell UX

- Legacy IDs: `LF-055`, `LF-056`, `LF-060`, `LF-076`, `LF-077`, `LF-082`, `LF-084`, `LF-085`, `LF-086`, `LF-087`, `LF-032` (multi-session toggle)
- Context: Settings
- Priority: high
- Status: **in_progress** (P11 WU0–WU5 + UI-4 **done**; T-008 system-state panel **done** — ADR-0004; Auth Flow gate ADR-AF-004/005 + T-034 SIP/OCP tabs **done**; open: UI-6 Radix modals, draggable LF-056)
- Owner: TBD
- Inputs: user settings, account identity, shell interactions, SIP session health projection
- Outputs: persisted settings (v2), theme, menu projections, system-state panel VM
- Acceptance Criteria:
  - Settings are per-user and validated.
  - **UserSettings v2** aggregate with v1?v2 migration; SIP recovery fields per ADR-0004 ?5.3.
  - Corrupt or unsupported schema version surfaces observable error (no silent security-sensitive defaults).
  - **Overlay navigation:** settings open fullscreen over call context; diagnostics is a settings section; call context stays mounted (`UI-Architecture.md`).
  - **Settings route alignment (shell navigation Phase 5):** `#/settings` and `#/settings/:sectionId` open the same fullscreen overlay; invalid section ids fall back to `general`; closing returns to the prior shell route via router state/history; section changes use `replace` without polluting history; active-call overlay rule unchanged.
  - **Settings entry section:** opening settings without an explicit section navigates to **Account** when SIP is not registered, otherwise **General**; canonical `#/settings` redirects to account when unauthenticated (`deriveDefaultSettingsSection`, `useOverlayShell`).
  - **Settings authorization gate (ADR-AF-004, corrective):** before SIP-ready, Account is the **only** available Settings section; sidebar + route/overlay guard disable and redirect all other sections with reason `settings.nav.disabled.authorizeFirst`; after SIP registration all permitted sections return; active-call overlay remains mounted.
  - **Account password visibility:** SIP account password fields expose show/hide toggle with accessible labels (`AccountPasswordField`, `form.password.show` / `form.password.hide` icons).
  - **Settings sidebar:** collapsed icon rail with `IconTooltip` section labels (`placement: right`); expanded labels overlay content without shrinking the panel; long labels wrap up to two lines; no duplicate overlay header ? content header shows `????????? ({??????})` and a minimal close icon.
  - **Settings sections:** Account (SIP auth), General (theme LF-082), **????????? ???????** (`system-state` ? ADR-0004), Sessions (multi-call), Diagnostics (F-017 stub), Codecs (stub), Headset (P10 stub).
  - **`SettingsSystemStatePanel`:** current server/registration state, auto-reconnect/reregister policies, manual actions (?????????????? ??????, ??????????????????) with disabled reasons, transport+registration journal.
  - Icon `settings.system-state` in Icon Registry + catalog.
  - **`multiSessionsEnabled` toggle** in settings UI (facade + port; no Use Case) ? shipped P11 WU4; enables R7-5 re-smoke via Settings ? Sessions.
  - Collapsed mode preserves critical call/status visibility.
  - **Header SIP status (ADR-0004):** unified dot + label + timer suffix via `deriveSipStatusShell`; priority idle ? transport ? registration ? registered ? DND; Russian copy per ?1.2.
  - **Removed:** legacy recovery overlay, header `control-reregister-sip`, user online/offline toggles; LF-009 avatar ring **cancelled**.
  - **Avatar user menu** on click: non-selectable identity header (login + SIP registration status/timer) → separator → contacts/history/settings/DND → separator → logout (LF-086); no online/offline presence; identity removed from header row so OperatorStatusSelector owns remaining width.
  - **Call UI skeleton (design parity 2026-06-26):** context zone top (sessions/idle/DTMF); controls zone bottom (labeled `CallControlsBar` + reference dialpad); vertical `CallSessionStack` for multi-call; `CallSessionCard` for single call; `CallIdleEmptyState` when idle.
  - **Shell always expanded (2026-06-26):** no collapse strip; dialpad and context visible before SIP registration; dialpad input, call action, and call controls (except hangup) disabled with reason until SIP registered.
  - Operator status selector always visible in header zone.
  - **Icon-only controls:** semantic `AppIcon` + 300ms hover tooltip via `IconControlButton`; `aria-label` preserved (T-001 done); tooltip auto-orients within viewport via Floating UI portal (2026-07-04).
  - **Theme (LF-082):** light default; `theme` in UserSettings; segmented control in General settings; `applyAppTheme` sets `data-theme` on documentElement; semantic tokens in `tokens.css` for light and dark.
  - **Unified action notifications (LF-060):** renderer uses `NotificationViewport` + `useNotifications`; action outcomes are bridged via `useActionNotifications`; repeated operation outcomes are not deduplicated (each attempt creates its own toast); persisted preferences (`notificationPlacement`, `notificationStacking`, `notificationDurationMs`, `notificationClosable`, `notificationMaxVisible`) are stored in `UserSettings` and edited in `SettingsGeneralPanel`.
  - **Native app icon theme sync (2026-07-01):** renderer theme change triggers typed IPC `platform:set-native-theme`; main process updates `nativeTheme.themeSource` and switches theme-aware icon asset (`icon-light.png`/`icon-dark.png`) for dock/window surfaces.
  - **Shell window layout (F-016):** compact mode anchors bottom-right on startup; settings overlay expands window to 1000px width centered; closing restores prior compact width and height at bottom-right; animation 280ms aligned with settings panel slide; `prefers-reduced-motion` skips animation; compact mode disables user resize; settings mode enables user resize.
  - **Shell lifecycle controls (F-016, LF-079):** no native File/View/Window/Help menu on Windows/Linux; macOS keeps minimal App + Edit menus (Edit roles wire Cmd+C/V/A/X/Z in inputs); macOS dev builds add a minimal View menu with `toggleDevTools` (Cmd+Option+I); Windows/Linux dev builds wire F12 and Ctrl+Shift+I via `before-input-event`; `webPreferences.devTools` is enabled only when `!app.isPackaged`; `maximizable`/`fullscreenable` disabled; Windows/Linux use native-like titlebar controls `Minimize -> Reload -> Close`; macOS uses custom traffic-light controls `Close -> Minimize -> Reload` (no maximize/fullscreen button); reload on macOS has no tooltip and replaces the green traffic-light slot; close/quit/reload run `ShutdownCleanupUseCase` before `app.quit()` or `app.relaunch()`; cleanup failure blocks quit/restart, cancels pending main shutdown state, and surfaces `shell.shutdown.failed`; facade-not-ready shutdown is acknowledged with cleanup skipped to prevent hangs; force quit/kill cannot guarantee async SIP/legacy operator logout.
- Test Coverage:
  - Unit: `validateUserSettings`, `migrateUserSettings`, `InMemorySettingsRepository` / `FileSettingsRepository` round-trip; `ShellWindowLayout`, `ShellWindowLayoutService`
  - Integration: facade `updateMultiCallSettings`, `getUserSettingsForAccount`, `saveUserSettings`, `refreshUserSettingsProjections`
  - Component: `SettingsPanel`, `SettingsFullscreenOverlay`, `SettingsSidebar`, section panels; `UserAvatar`, `RegistrationStatusDot`, `SoftphoneShellHeader`; `IconTooltip.test.tsx` (T-001); Storybook layout + settings overlay (WU0+)
  - E2E: settings and shell UX
- Implementation evidence (WU1): `SettingsRepository.setMultiCallSettings`, `AccountBootstrapFacade.updateMultiCallSettings`, `useSettingsActions`, `SettingsOverlay`, `applyMultiCallSettings` store refresh
- Implementation evidence (WU2): `CallLineRow`, `deriveCallLineStatusLabel`, `deriveCallLinesShell` (visible `>=1` line), `useCallLineRowShell`, `useCallLinesActions` per-line hold/mute/transfer, `OutgoingCallCard` pre-line-only (legacy `ConnectionOverlay` scrim **removed** T-008)
- Implementation evidence (WU3): `deriveHeaderChromeShell`, `useHeaderChromeShell`, `UserAvatar`, `RegistrationStatusDot` ? **shell collapse removed 2026-06-26**
- Implementation evidence (WU4): `UserSettings` v1, `validateUserSettings`, `migrateUserSettings`, `SettingsRepository.getUserSettings`/`saveUserSettings`, `FileSettingsRepository`, facade `getUserSettingsForAccount`/`saveUserSettings`/`refreshUserSettingsProjections`, `P11-Settings-Schema-Design.md`
- Implementation evidence (UI-4 **complete**): WU5 slices A?I + final gate ? `styles.css` deleted; `globals.css` owns reset/body/focus-visible; all renderer panels/modals/shells on `*.module.css`; `handoffs/P11-WU5-UI-4-Final-Gate-Handoff.md`
- Implementation evidence (UI-4 modules): `src/renderer/styles/tokens.css`, `globals.css`, `UserAvatar.module.css`, `RegistrationStatusDot.module.css`, `SoftphoneShellHeader.module.css` (WU5 Slice A), `SettingsOverlay.module.css`, `ShellOverlaySheet.module.css` (WU5 Slice B), `CallLineRow.module.css` (WU5 Slice C), `Dialpad.module.css` (WU5 Slice D), `ActiveCallControlsPanel.module.css`, `OutgoingCallCard.module.css`, `IncomingCallModal.module.css`, `IncomingCallActions.module.css` (WU5 Slice E), `ConnectionOverlay.module.css` (WU5 Slice F), `App.module.css`, `SoftphoneLayout.module.css`, `ShellChromeText.module.css`, `CallLinesShell.module.css`, `CallContextShell.module.css` (WU5 Slice G), `BootstrapPanel.module.css`, `AccountPanel.module.css`, `PhoneStatusBadge.module.css` (WU5 Slice H), `DialogPanel.module.css`, `TransferPanel.module.css`, `StatusSelector.module.css`, `OcpToastStack.module.css`, modals + `CallControlsShell.module.css` (WU5 Slice I), `P11-CSS-Modules-Tokens-Migration.md`, WU5 slice handoffs `P11-WU5-Slice-A` through `P11-WU5-Slice-I`
- Implementation evidence (icon tooltips **T-001 done**): `IconTooltip`, `IconControlButton`, `iconTooltipDelay.ts`, `IconTooltip.test.tsx`; 300ms hover delay (`prefers-reduced-motion: reduce` ? instant); viewport flip/shift via `@floating-ui/react-dom` portal; wired on all icon-only controls; gate `handoffs/P11-Icon-Tooltips-Agent-Prompt.md` (2026-06-25, auto-orient 2026-07-04, delay 300ms 2026-07-04)
- Implementation evidence (T-005 settings UX **done**): `SettingsFullscreenOverlay`, `SettingsPanel`, `SettingsSidebar`, `settingsSections.ts`, section panels (`SettingsGeneralPanel`, `SettingsSessionsPanel`, `SettingsAccountPanel`, `SettingsDiagnosticsPanel`, `SettingsCodecsPanel`, `SettingsHeadsetPanel`); header diagnostics opens settings diagnostics section; 7 new settings nav icons in `iconCatalog.ts` (2026-06-26)
- Implementation evidence (LF-060 notifications **done**): `NotificationViewport`, `useNotificationSonnerSync`, `useNotifications`, `useActionNotifications`, `NotificationViewport.test.tsx`, `NotificationSettings`, `validateUserSettings`/`migrateUserSettings` notification fields, `SettingsGeneralPanel` notification controls, `SoftphoneReadyShell` unified action feedback integration (update/account/call/settings/session flows), success/error icon-only distinction on neutral toast surface.
- Implementation evidence (dialpad home **2026-06-26**): `CallSessionStack`, `CallSessionCard`, `CallControlsBar`, `DtmfKeypadPanel`, reference `Dialpad`; gate `handoffs/P11-Call-UI-Design-Parity-Handoff.md`
- Implementation evidence (transfer flow parity **2026-06-29**): `TransferPanel` moved to `CallContextShell` (context mode), step chrome (1?4), explicit source/consultation cards, controls zone hides `CallControlsBar` + `Dialpad` while transfer mode active; stories `TransferPanel.stories.tsx`, `Dialpad.stories.tsx`, `CallSessionCard.stories.tsx`
- Implementation evidence (T-008 **2026-07-02**): `sipSessionHealthProjection`, `deriveSipStatusShell`, `deriveSipSystemStateShell`, `SettingsSystemStatePanel`, `useSipSystemStateActions`, `SipRecoveryOrchestrationService` ? `TRANSPORT-REGISTER-STATE-REFACTORING.md`
- Implementation evidence (shell navigation settings route **2026-07-07**): `parseShellRoute` `/settings` routes, `useOverlayShell` route-driven open/close/section, `settingsNavigationState.ts`, `ShellNavigationController` settings routes; config writes unchanged via `useSettingsActions` ? facade
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
- Outputs: diagnostic records, legacy operator log messages, filtered logs, exported file
- Acceptance Criteria:
  - Logs use correlation IDs and contain no secrets.
  - Remote log transport uses a typed gateway, not globals.
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
  - Priority (high ? low): incoming ringtone > ringback > busy/failed.
  - Multiple ringing incoming lines produce one ringtone; earliest request wins until answered/released, then next ringing line plays.
  - Incoming ringtone supersedes ringback and terminal tones; ringback resumes when incoming tone request ends.
  - `releaseAll` clears pending tone requests and stops active playback.
- Test Coverage:
  - Unit: `resolveActiveTonePlayback`, `TonePlaybackCoordinator`
  - Integration: `ArbiterMediaGateway` with `CallEngine` multi-line scenarios
  - E2E: deferred (manual multi-call smoke)
- Implementation evidence: `src/domain/media/resolveActiveTonePlayback.ts`, `src/application/services/telephony/TonePlaybackCoordinator.ts`, `src/adapters/media/ArbiterMediaGateway.ts`, bootstrap wiring in `createMockAccountBootstrap` / `createRealAccountBootstrap`

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
  - Integration: manual smoke ? install, authorize SIP, place call
  - E2E: deferred until installer harness exists
- Implementation evidence: `electron-builder.yml`, `.env.production`, `package.json` dist scripts, `.github/workflows/release.yml`, `guides/install-instruction.md`

## F-020: Manual In-App Update Check

- Legacy IDs: none
- Context: Integration
- Priority: medium
- Status: implemented
- Owner: domain-agent
- Inputs: startup background manifest fetch; user ?????????? ??????????? in Settings ? General; `VITE_UPDATE_MANIFEST_URL`; installed app version from main process
- Outputs: non-blocking startup update banner when newer version exists; update status projection in Settings; optional `shell.openExternal` to HTTPS download/release page; structured logs
- Acceptance Criteria:
  - No electron-updater, no silent download/install, no code-signing requirement.
  - Remote manifest validated from `unknown`; semver compare for update vs up-to-date.
  - States: idle, checking, updateAvailable, upToDate, unavailable, invalidManifest, error.
  - Startup background check runs once per app session after ready shell mount; Strict Mode safe; failures silent (no error/unavailable/invalidManifest in Settings snapshot).
  - Non-blocking update modal overlay on `updateAvailable` only; anchored below shell window controls via `--incoming-call-banner-top` (same inset as incoming-call overlay); ??????? or ????????? persists dismissed `latestVersion` in `UserSettings` and `localStorage` until manifest reports a newer version; does not interrupt calls.
  - ???????? ???????? ????????? opens manifest `downloadUrl` (releases page), not `platforms.*` direct installer URL.
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
- Implementation evidence: `src/domain/updates/`, `src/application/use-cases/updates/CheckForUpdatesUseCase.ts`, `src/adapters/updates/FetchUpdateMetadataAdapter.ts`, `src/adapters/updates/LocalStorageUpdateBannerDismissStore.ts`, `src/adapters/platform/PreloadPlatformInfoGateway.ts`, `src/adapters/platform/PreloadExternalUrlGateway.ts`, `src/shared/ipc/OpenExternalUrlContract.ts`, `src/renderer/hooks/useAppUpdate.ts`, `src/renderer/components/updates/UpdateAvailableBanner.tsx`, `src/renderer/components/settings/panels/SettingsGeneralPanel.tsx`, `src/renderer/shells/SoftphoneReadyShell.tsx`, `guides/Manual-Update-Manifest.md`, `docs/softphone/release/update-manifest.json`, `guides/GitHub-Releases-Update-Guide.md`

## F-021: Interface Internationalization And Language Settings

- Legacy IDs: none
- Context: Settings
- Priority: high
- Status: implemented
- Owner: TBD
- Inputs: user language preference, translation catalog, UI message keys
- Outputs: persisted language setting, localized renderer UI, translation coverage checks
- Acceptance Criteria:
  - Language selector exists in Settings ? General.
  - Language is persisted per user in `UserSettings`.
  - Selected language applies immediately without restart.
  - All touched UI and UI-facing logic add keys for every supported locale.
  - No new hardcoded user-visible strings outside approved translation modules/tests/stories.
  - Supported interface locales are `ru`, `en`, `fr`, `de`, `bg`; catalogs stay key-parity complete for migrated modules.
  - Settings ? General language selector renders full locale labels and does not reuse numeric input styling.
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
  - v2?v3 migration injects defaults without breaking existing fields.
  - At least one voice audio codec enabled; `telephone-event` cannot be disabled.
  - Reorder/toggle helpers are pure domain functions for UI wiring.
  - New sessions use configured **audio** codec order (adapter WU-4 ? **done**, hardened).
  - Settings Codecs panel with drag-and-drop and checkboxes (UI WU-5 ? **done**).
  - Video codec prefs persisted; applied to RTC when **F-027** video sessions are enabled (until then video UI/SDP remain future).
  - Codec wiring ready before outbound offer and incoming answer; re-INVITE local SDP munged.
  - `setCodecPreferences` failures logged; call setup continues with SDP munging fallback.
  - Negotiated audio codec diagnostics via WebRTC stats after session confirmed.
- Test Coverage:
  - Unit: `validateCodecPreferences`, `reorderCodecPreferences`, `validateUserSettings` v3, `migrateUserSettings` v2?v3, `SettingsCodecsPanel.test.tsx`
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
- Status: **implemented** (Step 10 verification PASS 2026-07-06; F-023 test slice 75/75; repo-wide 1187/1189 ? 1 pre-existing flake out of scope)
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
  - Optional secure storage via `SecretStoragePort` + Electron `safeStorage` IPC (**Path B implemented** for remember-password on saved profiles).
  - ?Forget remembered password? deletes only local secure SIP password secret; profile metadata and per-account settings retained.
  - Active authorized account may display in-memory session password in account form password field (not preloaded from secure storage for inactive profiles).
  - **Draft lifecycle (ADR-AF-001, corrective):** opted-in draft profile metadata + secrets may persist before SIP-ready; failed candidate does not become `activeProfileKey` / active SIP session or apply candidate settings; success marker only after SIP registration; query VMs expose secret availability booleans only.
- Test Coverage:
  - Unit: profile key derivation, normalization edge cases
  - Adapter: `InMemorySettingsRepository` per-account isolation; `FileSettingsRepository` cross-instance persistence, corrupt JSON
  - Integration: facade authorize ? switch ? save ? restore A/B/A
  - Secret: save/load/delete if credential persistence implemented
  - Component: settings account panel profile label (if UI changed)
  - E2E: deferred until harness exists
- Design: `docs/softphone/P11-Local-Account-Profiles-Design.md`
- Corrective track: `auth-flow/auth-flow-refactoring.md` WU-01; ADR-AF-001
- Implementation evidence (Step 2 domain): `src/domain/settings/deriveSettingsAccountKey.ts`, `deriveSettingsAccountKey.test.ts`, `resolveSettingsAccountKey.ts`, `resolveSettingsAccountKey.test.ts`
- Implementation evidence (Step 3 ports): `src/ports/settings/SettingsRepository.ts` (`getActiveProfileKey`, `setActiveProfileKey`, `listKnownProfileKeys`), `InMemorySettingsRepository.ts`, `InMemorySettingsRepository.test.ts`, `FileSettingsRepository.ts` delegation
- Implementation evidence (Step 4 disk): `src/ports/filesystem/FileSystemPort.ts`, `src/infrastructure/filesystem/NodeFileSystemAdapter.ts`, `src/adapters/settings/profileStoragePaths.ts`, `profilesIndexDocument.ts`, `parsePersistedUserSettings.ts`, `FileSettingsRepository.ts`, `FileSettingsRepository.test.ts`
- Implementation evidence (Step 5 secrets Path A): `src/ports/secrets/SecretStoragePort.ts`, `src/adapters/settings/assertPersistedProfileJsonExcludesSecrets.ts`, `assertPersistedProfileJsonExcludesSecrets.test.ts`
- Implementation evidence (Path B remember-password): `src/shared/ipc/SecretStorageContract.ts`, `src/main/secrets/registerSecretStorageIpc.ts`, `src/adapters/secrets/PreloadSecretStorageAdapter.ts`, `InMemorySecretStorageAdapter.ts`, `AccountBootstrapFacade.ts` (`forgetRememberedSipPassword`, `getActiveSipAccount`), `deriveSavedProfileCredentialPromptState.ts`, `useAccountActions.ts`, `AccountPanel.tsx`, `messages.ts` + `catalogs/bgMessages.ts`
- Implementation evidence (Step 6 application): `AuthorizeSipAccountUseCase.ts` (`setActiveProfileKey` when `promoteActiveSession`), `PromoteAuthorizedSipSessionUseCase.ts` (post-SIP-ready promotion), `application/settings/resolveSettingsAccountKey.ts`, `AccountBootstrapFacade.ts` (`applyActiveProfileSettingsSideEffects`, profile-aware save/load), `AccountBootstrapFacade.test.ts` (A?B?A restore)
- Implementation evidence (WU-01 draft lifecycle): `PersistDraftAccountArtifactsUseCase.ts`, `savedAccountProfileLifecycle.ts`, `migrateProfileScopedSecrets.ts`
- Implementation evidence (Step 7 composition): `createRealAccountBootstrap.ts`, `createRealBootstrapSettingsRepository.ts`, `resolveAxatalkProfilesStorageRoot.ts`, `registerProfilesPersistenceIpc.ts`, `PreloadFileSystemAdapter.ts`, `createRealAccountBootstrap.test.ts`, `resolveRealBootstrapDiskOptions.ts`
- Implementation evidence (Step 8 UI): `formatSettingsAccountIdentityLabel.ts`, `deriveActiveProfileSettingsSyncKey`, `SettingsAccountPanel.tsx` (account form only), `accountBootstrapProjection.ts` (`sipDomain`), `SettingsAccountPanel.test.tsx`, `SettingsOverlay.stories.tsx` (light + dark registered)
- Implementation evidence (Step 9 migration): `deriveLegacyUsernameOnlySettingsAccountKey.ts`, `loadUserSettingsWithLegacyMigration.ts`, `AuthorizeSipAccountUseCase.ts`, `AccountBootstrapFacade.ts` (`loadUserSettingsForAccountKey`), `loadUserSettingsWithLegacyMigration.test.ts`, `FileSettingsRepository.test.ts` (legacy on-disk), `AccountBootstrapFacade.test.ts` (legacy authorize)
- Implementation evidence (Step 10 verification): `npm run lint`, `typecheck`, `i18n:check`, `registry:check` PASS; F-023 test slice 75/75; preload IPC response parsing fix; `useSettingsActions.test.ts` preload mock parity
- Related: **F-016** (settings UX), **F-001** (SIP authorize), extends **LF-077** stub from WU4

## F-024: Saved SIP Account Profiles (Quick Sign-In)

- Legacy IDs: `LF-077` (saved profile list + quick sign-in UX; extends F-023 per-account persistence)
- Context: Settings
- Priority: high
- Status: **implemented** (corrective pass 2026-07-06); **corrective Auth Flow track in progress** (ADR-AF-001/003/004 WU-01…WU-05 done; WU-06 verification pending)
- Owner: TBD
- Inputs: saved profile list from facade, manual/saved authorize, delete profile, profile selection (no live-session switch)
- Outputs: tab-style profile navigation in Settings ? Account, password-only saved tab when unauthenticated, full form when registered, save-on-authorize checkbox on New, delete confirmation, safe server error display
- Acceptance Criteria:
  - Tab navigation shows localized ?New? first; saved tabs show username with domain/server disambiguation when needed; keyboard-accessible tablist.
  - Selected saved profiles keep their non-secret SIP/OCP configuration visible while hiding the already selected login; secure secrets are never prefilled.
  - Save profile and Remember password switches are shown only for a New draft and apply equally to SIP-only and OCP module modes.
  - A New draft matching an existing profile asks only when the entered profile data differs; the dialog offers cancel plus a split continue control (primary: continue without saving; menu: overwrite). Cancel closes without authorization.
  - Registered saved profile full form may show active in-memory session password in password field (type=password by default).
  - New tab shows full form and save-profile switch; duplicate identity disables save switch with explanation.
  - **Identity change (ADR-AF-003):** while SIP is registered, Login is disabled; operator must avatar-logout before another identity. Account must **not** unregister/switch on submit (`ensureUnregisteredBeforeAccountSwitch` removed from Account path). Removing switch-account confirmation is intentional (LF-077 behavior change).
  - Opted-in pre-auth draft/secret writes block login on failure (ADR-AF-001). Post-success `lastUsedAt` touch remains non-blocking warning only.
  - Server/SIP errors (403 license/policy, 404 not found) show sanitized server detail ? not mislabeled as wrong password unless authentication-related.
  - Local saved profile missing shows `account.error.profileNotFound`; SIP 404 shows server registration error.
  - Delete requires confirmation; after delete selection returns to New; logout resets to New.
  - Password never persisted in saved profiles JSON, logs, UI snapshots, or tests; optional remember-password uses secure storage only.
  - Optional ?Remember password on this PC? checkbox: disabled unless Save profile is checked (New tab) or a saved profile is selected; unchecking Save profile clears remember-password.
  - **Remember / save timing (ADR-AF-001):** when operator opts in, draft metadata + remembered SIP password (+ OCP API key in OCP mode) persist **before** the auth attempt; failed attempt leaves reusable draft and must not promote active session/settings; profile delete removes associated secrets; logout keeps remembered password.
  - Secure storage failure for an opted-in artifact is visible and blocks login only for that requested artifact (never silent drop).
  - Per-account settings load after successful registration from New or saved profile; failed auth does not apply target profile settings.
  - Account contains no logout control, no Retry server action, and no transport/registration progress statuses; transport recovery and detailed failure diagnostics remain in System State.
  - Successful feedback distinguishes SIP registration from OCP+SIP readiness; failed authorization feedback offers navigation to System State.
- Test Coverage:
  - Unit: `formatSavedAccountProfileSelectorLabel`, `deriveSavedAccountProfileSelectorOptions`, `mapAccountAuthorizationError`, `sanitizeRegistrationServerMessage`, `deriveSavedProfilePanelMode`, `deriveSavedProfileCredentialPromptState`, `matchesSipAccountIdentity`
  - Facade: `AccountBootstrapFacade.test.ts` / `AccountBootstrapFacade.accountSignIn.test.ts` (metadata non-blocking; active-session reject without unregister; settings A→B→A after explicit logout; `signInAccount` / Account VM)
  - Hook: `useAccountActions.test.ts` (T-037: overwrite confirm bypasses already-accepted prompt and calls `signInAccount`)
  - Component: `SavedAccountProfileSelector`, `DeleteSavedAccountProfileConfirmationModal`, `OverwriteSavedAccountCredentialsConfirmationModal` (Cancel + ButtonGroup split continue/overwrite), `SettingsAccountPanel`, `AccountPanel` (SIP/OCP mode tabs, dual-status recovery, no Account logout/switch/generic retry, startup registration CTA)
  - Bootstrap: `createRealAccountBootstrap.test.ts`, mock repository injection

  - E2E: deferred
- Implementation evidence: `AccountBootstrapFacade.ts` (`forgetRememberedSipPassword`, `getActiveSipAccount`), `deriveSavedProfileCredentialPromptState.ts`, `mapAccountAuthorizationError.ts`, `SavedAccountProfileSelector.tsx`, `AccountPanel.tsx`, `useAccountActions.ts` (`confirmOverwriteExistingCredentials` → `handleSubmit(true, true)`, T-037), `useSettingsActions.ts`, `SettingsAccountPanel.tsx`, `createMockAccountBootstrap.ts`, `messages.ts` (ru/en/fr/de/bg)
- Implementation evidence (WU-01 ADR-AF-001): `savedAccountProfileLifecycle.ts`, `persistedSavedAccountProfiles.ts` (schema v2 + v1 migrate), `PersistDraftAccountArtifactsUseCase.ts`, `PromoteAuthorizedSipSessionUseCase.ts`, `deriveSavedAccountProfileAvailability.ts`, `ResolveSavedAccountProfileAvailabilityUseCase.ts`, `AuthorizeSipAccountUseCase.ts` (`promoteActiveSession`), `AccountBootstrapFacade.ts` (pre-auth draft persist + deferred promote), `FileSavedAccountProfileRepository.ts` / `InMemorySavedAccountProfileRepository.ts` (`markProfileSuccessful`)
- Handoff: `docs/softphone/handoffs/P11-F024-Saved-Account-Profiles-Handoff.md`; corrective: `handoffs/P11-Auth-Flow-Refactoring-Handoff.md`

## F-025: Local Contacts

- Legacy IDs: _none_ (new product feature; audited legacy softphone had no standalone contacts module)
- Context: Settings
- Priority: medium
- Status: **in progress** (Phase 9 UX polish done ? final gate in Phase 10)
- Owner: TBD
- Inputs: contact metadata (display name, primary/secondary phone, company, notes)
- Outputs: persisted `Contact` records, domain events, projection, facade CRUD/call API
- Acceptance Criteria:
  - Persistence is behind `ContactRepository`.
  - Contact identity uses branded `ContactId` aligned with shell route param validation.
  - Display name and phone fields are validated in Domain before persistence.
  - Create/update/delete publish `ContactCreated` / `ContactUpdated` / `ContactDeleted` events.
  - `CallContactUseCase` initiates outgoing call via existing `MakeCallUseCase` on primary phone.
  - UI consumes projections only (Phase 4); no repository/Domain imports in renderer components.
  - Per-account file persistence under `contacts/{encodedProfileKey}.json` when real bootstrap is active.
  - Missing or corrupt contacts document returns safe empty state with warning log.
  - Profile switch reload refreshes contacts projection for the active `SettingsAccountKey` without showing the previous account list.
  - Normalized phone numbers are unique across contacts at create/update time (`validateContactPhoneUniqueness`).
  - Add-from-history opens matched contacts or a create form prefilled from history number; duplicate creation is rejected by existing phone uniqueness validation.
  - CSV import/export uses typed `contacts-csv:*` IPC dialogs, `ContactCsvCodec`, `ImportContactsCsvUseCase`, and `ExportContactsCsvUseCase`; import skips duplicate normalized phones and reports row-level failures without unsafe partial mutation.
- Test Coverage:
  - Unit: contact validation, `validateContactPhoneUniqueness`, projection reducer, `deriveContactsShell` disabled reasons, `parsePersistedContactsDocument`, `ContactCsvCodec`, `ImportContactsCsvUseCase`, `ExportContactsCsvUseCase`, `ContactsCsvFileContract`
  - Integration: in-memory and file repository CRUD, Use Case orchestration (`ContactUseCases`, `CallContactUseCase`), `createRealAccountBootstrap`
  - Renderer: `ContactsShellRoutePanel`, `ContactsPanelShell`, `ContactDetailsPanel`, `ContactsImportSummaryPanel`, `useContactEditShell`, `useContactActions`, navigation guards
  - E2E: deferred until harness exists; manual smoke: `handoffs/Shell-Navigation-Phase6-Smoke-Checklist.md`

## F-027: Video Calls

- Legacy IDs: _none_ (new product feature; behavioral parity with legacy OS-1509 video ? see `video-integration/video-integration.md`)
- Context: Media | Telephony | Settings
- Priority: high
- Status: **in progress** (WU1-WU7 + Settings Video UI done; WU9a–WU9c video UX: answer gate, screen-share picker/caps, fullscreen modal + session views expanded|hidden|fullscreen + outbound sender sync; WU8 SBC smoke next)
- Owner: TBD
- Inputs: per-call media mode (audio|video), device prefs, session view, capture probe, SIP/WebRTC session
- Outputs: video-capable calls, cam/mic/screen controls, view modes, projections, Domain events
- Acceptance Criteria:
  - Per-call `mediaMode` (ADR-0008); no global `audioOnly` as primary UX.
  - Dialpad: audio Call + Video call button; Video call disabled with semantic reason keys until ready/guards fail.
  - Incoming: «Answer with video» only when remote INVITE SDP offers active video (`IncomingRemoteVideoOfferedChanged`); audio-only inbound hides the action.
  - Video-mode calls negotiate video m-line; local camera privacy-muted until user enables.
  - Single Media mute/source path (`replaceTrack` / capture port); no dual JsSIP mute paths.
  - Stub video track when camera unavailable (preserve SDP video m-line).
  - Remote no-video via SDP and/or SIP INFO and live receiver tracks mapped to `remoteVideoPresent`.
  - Session views: expanded (minimal) | hidden (no video blocks) | fullscreen (edge-to-edge modal); local PiP (hidden in fullscreen when local camera off); screen share from expanded or fullscreen with `track.onended`.
  - Screen share opens in-app source picker (screen/window via IPC `desktopCapturer`; screens+windows enumerated separately; PNG data-URL previews via `toPNG` + CSP `img-src data:`); picker UI exposes tabs for screens, applications, and Google Chrome tabs (Chrome tab list filters window sources by title); main grants only the user-selected pending source (`useSystemPicker: false`); cancel never mutates video projection.
  - Screen capture caps: getDisplayMedia ≤1920×1080 @15–30fps; outbound `contentHint=detail` + maxFramerate/maxBitrate on sender after replaceTrack.
  - Fullscreen session view expands Electron shell to display work area and opens edge-to-edge video modal with oval controls (mic/camera/screen-off = red bg + white icon; hangup = Phone on red; macOS-like blur bar; light theme: white default icons + soft white hover); frosted close (X) with light/dark glass; dialpad video-call ready matches call green; close returns to expanded/minimal; PiP clamped ≥24px (`--space-lg`) from edges; view-mode menu omits the active mode; fullscreen layout stays bound to the video session (incoming banner overlays without shrinking); answer exits video fullscreen to expanded + main dialpad surface; call end / leave fullscreen restore compact main-display bounds.
  - Inbound video answer syncs outbound RTCRtpSender to the captured local video track (`ensureOutboundVideoSenderSynced`) so remote receives video without requiring hold/unhold.
  - Settings: preferred devices, default view, auto-fullscreen, video codecs applied on video sessions.
  - Existing audio mute/hold/headset/DTMF paths remain green; default `mediaMode: audio` until JsSIP video WU.
  - UI binds projections only; no gUM/SIP/MediaStream in Domain or Zustand.
- Test Coverage:
  - Unit: `CallMediaMode`, `CallVideoMediaState`, `resolveVideoCallAvailability`, video media events
  - Integration: MakeCall/answer media mode through CallEngine + mock telephony (WU3); mock capture (WU4+)
  - Adapter: Browser capture + JsSIP video SDP/capture/remote-presence/codec paths (WU4?WU5)
  - Component: dial dual actions, video surfaces (WU6+)
  - E2E: deferred; manual SBC smoke WU8
- Design: `docs/softphone/P13-Video-Calls-Design.md`
- ADR: `docs/softphone/adr/ADR-0008-video-calls-media-mode.md`
- Implementation evidence (WU1): `src/domain/media/CallMediaMode.ts`, `LocalVideoSource.ts`, `SessionViewMode.ts`, `CallVideoMediaState.ts`, `resolveVideoCallAvailability.ts`, `events/videoMediaEvents.ts`, `src/ports/media/LocalMediaCapturePort.ts`, unit tests for mode/state/availability
- Implementation evidence (WU2): `UserSettings` v5 ? `preferredAudioInputDeviceId`, `preferredVideoInputDeviceId`, `defaultSessionView`, `autoFullscreenOnConference`, `conferenceNumberSubstring`; `VideoCallSettings.ts`; `migrateUserSettings` v0?v4?v5; `docs/softphone/P13-Video-Call-Settings-Schema.md`
- Implementation evidence (WU3): `MakeCallUseCase`, `callEngineTypes`, `TelephonyGateway` optional `mediaMode`; `CallVideoMediaProjection`; `CallEngine` make/answer selection and `CallMediaModeSelected`; mock command evidence; `JsSipTelephonyAdapter` accepts video intent but keeps `buildJsSipCallMediaOptions` audio-only; application and adapter tests
- Implementation evidence (WU4): `BrowserLocalMediaCaptureAdapter.ts`, `createStubVideoTrack.ts`, `replaceOutboundVideoTrack.ts`, `MockLocalMediaCapturePort.ts`, adapter unit tests (probe/capture/stub/screen onended/mute replaceTrack/release)
- Implementation evidence (WU5): `buildJsSipCallMediaOptions.ts`, `JsSipTelephonyAdapter.ts`, `detectRemoteVideoPresence.ts`, video codec wiring, `createRealAccountBootstrap.ts`; 1629 tests passed

- Implementation evidence (WU6 dial): Dialpad dual actions (`dialpad-call` + `dialpad-video-call`); `facade.makeCall(number, callId?, mediaMode?)`; `useSoftphoneCallActions.handleDialpadVideoCall`; icon `dial.videoCall`; i18n ru/en/fr/de/bg
- Implementation evidence (WU6 surfaces): `CallVideoSurface`; `callVideoMediaUiProjection` in Zustand; Use Cases mute/source/view; `MediaGateway.bindCallVideoSurfaces`; cam/screen/expand on `CallControlsBar`; camera availability via telephony handler; i18n ru/en/fr/de/bg
- Implementation evidence (WU7): `answerCallById(callId, mediaMode?)`; `handleAnswerIncomingWithVideo`; Answer with video on `IncomingCallSessionCard` + `IncomingCallOverlay`; hold disables cam/screen on controls bar; i18n ru/en/fr/de/bg
- Implementation evidence (WU8 prep): handoffs/P13-Video-Calls-WU8-SBC-Smoke-Checklist.md; resolveInitialSessionView; screen-share onended wiring; SIP INFO `no-video-remote`; default/auto session view on make/answer
- Implementation evidence (Settings Video UI): `SettingsVideoPanel`; `useVideoSettingsPanel`; `LocalMediaCapturePort.listInputDevices` / `startCameraPreview` / `stopCameraPreview`; facade bind/list/preview; Settings nav `video`; i18n ru/en/fr/de/bg
- Implementation evidence (WU9a inbound video-answer gate): hide Answer with video unless remote SDP offers video; remote bind stability; work-area fullscreen; expanded screen share; display-media handler
- Implementation evidence (WU9b screen-share picker + caps): `DisplayCaptureContract` + IPC list/set-pending; `registerDisplayCaptureIpc`; pending source store; `installDisplayMediaRequestHandler` grants selected source only; `ScreenSharePickerDialog` + `useScreenSharePicker`; `applyScreenShareEncodingPolicy`; capture constraints 1080p/15–30fps; i18n ru/en/fr/de/bg
- Implementation evidence (WU9c video UX refactor): session views `expanded|hidden|fullscreen`; `resolveFullscreenVideoSession` keeps fullscreen modal/layout while incoming overlays; `ensureOutboundVideoSenderSynced` after inbound video answer + unmute path; `VideoFullscreenModal` close→expanded; PiP 24px inset; screen-share CSP/`toPNG` previews; shell compact restore snapshot guard

## F-028: OCP Module Integration

- Legacy IDs: `LF-018`, `LF-019`, `LF-041`, `LF-042`, `LF-043`, `LF-044`, `LF-045`, `LF-046`, `LF-047`, `LF-048`, `LF-049`
- Context: Integration
- Priority: high
- Status: **corrective in progress** (E-01…E-13 + unified auth 2026-07-16 remain shipped baseline; Auth Flow Refactoring WU-00 done 2026-07-16 — **not** production-ready until plan smoke + WU-06)
- Owner: TBD
- Inputs: OCP HTTP authenticate + WebSocket session, operator status/reason payloads, SIP telephony domain events, host-page commands
- Outputs: operator status FSM, OCP gateway commands, dual Server/Authorization projections, telephony bridge events, Account-owned authorization progress
- Acceptance Criteria:
  - SIP telephony works without OCP; OCP is optional integration module.
  - Operator status transitions validated in Domain before gateway commands.
  - Idle operators can change Ready↔Break reasons (including Break→Break) and leave Preparing-to-work to Ready/Break/Logout.
  - Busy operators keep the status selector enabled; Ready/Break selection reserves via `update_post_call_status` with user toast.
  - During Post-call processing, UI offers finish-vs-reserve (two-step modal); finish uses `intent: apply`, reserve uses `intent: reserve`.
  - Single `OcpGateway` WebSocket; no global `window.ws` patching; **one-socket invariant** proven by tests (ADR-AF-002).
  - Settings → Integrations is a parent nav group; OCP Module is a child leaf (extensible for future integrations); **pre-auth gated** with other non-Account sections until local account session (ADR-AF-005 / ADR-AF-004 amended).
  - Operator status selector visible only when `ocpSession.isAuthenticated === true`.
  - Ephemeral `softphone_auth_token` via `GET https://{ocpDomain}/proxy/authenticate?login={sipUsername}` with header `Ocp-Proxy-Api-Key`; **`ocpDomain` is the OCP proxy host** (`ocpIntegration.domain` / `profile.ocpDomain`), **never** the SIP PBX domain from `entity:creds`; token is never persisted; Application acquires a **fresh** token before every new socket (ADR-AF-002).
  - **Account sole OCP sign-in (ADR-AF-003):** Settings → Account OCP module mode owns login/domain/key input and the only sign-in command; Save profile / Remember password available in OCP mode; complete OCP profiles hide domain/key; incomplete profiles ask only missing fields.
  - **Mode-isolated Account validation:** SIP-only and OCP Module validate independently — OCP new-draft requires only login/domain/API key and must not fail on empty SIP password/server leftovers or Remember-password without a boundary SIP password (deferred until entity:creds).
  - **Saved SIP identity from creds:** after OCP SIP-ready, opted-in saved profile SIP `domain` / `server` / password come from `entity:creds`; `ocpDomain` stays the OCP proxy host. Provisional drafts keyed by OCP host are migrated/deleted (never leave OCP Domain in SIP fields).
  - **Account session before SIP-ready (ADR-AF-005):** Login promotes profile/settings immediately; SIP `403`/register failure does not undo the session or re-enable Login; Settings gate uses `hasActiveAccountSession`.
  - **OCP Module edit-only after account session (ADR-AF-003/005):** no first-time Connect/Disconnect/login picker/generic Retry; active-profile configuration only (enabled, autoConnect, domain, API key rotate/save/delete); Server/Authorization status owned by System State OCP tab.
  - SIP credentials from `entity:creds` always authorize+register when OCP connects (no `autoSipAuth` toggle).
  - **Dual FSM recovery (ADR-AF-002):** independent Server (`disconnected|connecting|connected|reconnecting|failed`) and Authorization (`idle|pending|authorized|timeout|rejected`) projections; `Retry server` / `Retry authorization` / `Reconnect` semantics as in the plan; `SESSION_EXIST` → server retry only; auth-only retry never opens a second socket; canonical UI surface is System State OCP tab (`deriveOcpSystemStateShell`; tab disabled when `ocpIntegration.enabled === false`).
  - **Unified OCP-backed sign-in:** `OcpBackedSignInOrchestrationService` owns HTTP→WS→creds→SIP authorize→SIP register with attempt/correlation ID; account settings unlock on Login; typed `ocp_authenticated_sip_failed` when OCP live but phone registration fails.
  - **INVALID_TOKEN:** adapter does not reconnect with stale token; Application-owned recovery per ADR-AF-002 (capped / manual as implemented in WU-02).
  - **Identity lock:** if a local account session is active, Facade rejects new OCP/SIP sign-in (no silent unregister); avatar logout is the only logout entry point (OCP reason cascade preserved).
  - Disconnect OCP keeps SIP; Logout cascades SIP via `EndUserSessionUseCase`.
  - **Intentional avatar logout (ADR-AF-002):** disarm Application-owned OCP transport recovery before disconnect; after successful OCP end, reset session/operator/campaign projections to cold-start idle (no reconnecting banner). Unexpected socket drops still recover with fresh HTTP token.
  - Credentials never appear in Domain Events; `Ocp-Proxy-Api-Key` stored via `SecretStoragePort`.
  - `callType: internal | external | sdk` on status-change commands for audit trail.
  - External OCP authenticate payload is `{ ocpDomain, login, apiKey }` (`OcpHostApiContract`); Facade entry points ready for future `ExternalCommandRouter` (no `window.Softphone`).
  - All user-visible strings localized (`ru`, `en`, `fr`, `de`, `bg`).
  - Staging smoke (`ocp-integration/OCP-Smoke-Checklist.md`) required before production-ready claim — **not** checked as of WU-00.
- Test Coverage:
  - Unit: `OperatorStatus`, `OperatorStatusMachine`, `OperatorProfile`, OCP domain events; `ocpDualFsm`, `OcpBackedSignInOrchestrationService`, `OcpSipCredentialService`, `OcpInvalidTokenReauthService`, `OcpAuthenticateAndConnectService` (fresh-token + same-socket retry), `OcpTransportRecoveryService`, `authorizationProgressProjection`, `authorizationRetryContext`
  - Integration: mock `OcpGateway`, Use Cases, telephony bridge, `OcpFullFlow.integration.test.ts` (E-13 transport-only); Facade connect waits for SIP-ready; `AccountBootstrapFacade.test.ts` (`retryAuthorization` after SESSION_EXIST); WU-02: fresh-token / same-socket / SESSION_EXIST / stale-attempt / no adapter reconnect; WU-03: `signInAccount` / `getAccountSignInViewModel` / `dispatchAccountRecoveryAction` / active-session reject
  - Renderer: **WU-04 done** — `AccountPanel` / `SettingsAccountPanel` mode tabs + OCP InputGroup; no Account logout/switch/generic retry; **WU-05 done** — Settings pre-auth gate + edit-only OCP Module; **T-034 done** — System State SIP/OCP tabs own Server/Authorization; Account keeps in-progress recovery actions only
  - E2E: deferred — manual smoke `ocp-integration/OCP-Smoke-Checklist.md` + plan WU-06 checklist (unchecked)
- Design: `ocp-integration/OCP-IMPLEMENTATION-PLAN.md`, `ocp-integration/ocp-integration.md`
- Corrective track: `auth-flow/auth-flow-refactoring.md`; ADRs ADR-AF-001…004; handoff `handoffs/P11-Auth-Flow-Refactoring-Handoff.md`
- Implementation evidence (E-01): `src/domain/integration/ocp/OperatorStatus.ts`, `OperatorStatusReason.ts`, `OperatorProfile.ts`, `OcpTransitionRules.ts`, `OperatorStatusMachine.ts`, `events/*`, unit tests
- Implementation evidence (E-02): `src/ports/integration/OcpGateway.ts`, `src/domain/integration/ocp/OcpConnectionConfig.ts`, `OcpConnectionState.ts`, `protocol/OcpCommand.ts`, `protocol/OcpIncomingMessage.ts`, `protocol/OcpMessageEnvelope.ts`, exhaustive union tests
- Implementation evidence (E-03): `src/adapters/integration/ocp/OcpWebSocketAdapter.ts`, `parseOcpMessage.ts`, `buildOcpCommandPayload.ts`, `src/adapters/mock/MockOcpGateway.ts`, `src/shared/scheduling/ReconnectScheduler.ts`, adapter tests
- Implementation evidence (E-04): `src/application/use-cases/integration/ocp/ChangeOperatorStatusUseCase.ts`, `ConnectOcpUseCase.ts`, `LogoutOperatorUseCase.ts`, `ReservePostCallStatusUseCase.ts`, `AcceptCampaignUseCase.ts`, `RejectCampaignUseCase.ts`, `DisconnectOcpUseCase.ts`, `src/ports/integration/OcpOperatorReadModel.ts`, `src/ports/settings/DndReadModel.ts`, Use Case unit tests with `MockOcpGateway`
- Implementation evidence (E-05): `src/application/projections/integration/operatorStatusProjection.ts`, `ocpSessionProjection.ts`, `ocpReasonsProjection.ts`, `campaignEventProjection.ts`, `OcpProjectionHub`, `OcpTelephonyBridgeService`, `OcpDndBridgeService`, `OcpNotificationService`, `OcpSipCredentialService`, bootstrap wiring in `createRealAccountBootstrap` / `createMockAccountBootstrap`, unit tests
- Implementation evidence (E-06 logic): `OcpIntegrationSettings`, `UserSettings` schema v7 + `migrateUserSettings` v6→v7, `validateUserSettings` ocpIntegration (superseded by v8 HTTP-auth delta below)
- Implementation evidence (HTTP auth 2026-07-15): UserSettings schema **v8** (`linked`, no `autoSipAuth`); `OCP_PROXY_API_KEY_SECRET_ID`; `OcpProxyAuthenticatePort` + `OcpProxyAuthenticateHttpAdapter` + `MockOcpProxyAuthenticatePort`; `OcpAuthenticateAndConnectService` (HTTP→WS→15s authenticated); Facade `connectOcp`/`signInViaOcp`/`getOcpSignInAvailability`/`authenticateOcpFromHost({ocpDomain,login,apiKey})`; `ocpSessionProjection.authFeedback` toasts; always-on `OcpSipCredentialService`; UI Integrations api-key + Account checkbox
- Implementation evidence (unified auth gate fixes 2026-07-16): `authorizationRetryContext`; Facade `retryAuthorization`/`retryStartupRegistration`/`hasStartupRegistrationFailure`; Account + Integrations single retry + startup CTA; typed test doubles (`sipUseCaseTestDoubles`, `AccountActionsFacadeBinding`); handoff `docs/softphone/handoffs/P11-Unified-Authorization-Gate-Handoff.md`
- Implementation evidence (unified auth 2026-07-16): `authorizationProgressProjection`; `OcpBackedSignInOrchestrationService`; `OcpSipCredentialService.waitAndApplyNext` + identity match; `OcpInvalidTokenReauthService`; Facade `connectOcp`/`signInViaOcp` return ok only on `sip_ready`; Account two-method UX + progress; Integrations progressive «Connect and sign in»; i18n `account.authProgress.*` / `account.profile.signInViaOcp*` / `settings.integrations.ocp.connectAndSignIn`
- Implementation evidence (login picker logic 2026-07-15): Domain `resolveOcpConnectLoginTarget` / `buildOcpConnectLoginOptions`; Facade `listOcpConnectLoginOptions`, `getOcpModulePanelState`, scoped `updateOcpSettings`/`saveOcpProxyApiKey` via `{ accountKey }`; `connectOcp({ login, accountKey? })` picker path vs active-SIP autoConnect/retry; cross-profile save does not apply live recovery side-effects
- Implementation evidence (T-031 UI 2026-07-15): `useOcpSettingsPanel` login-scoped wiring; `OcpModuleSettingsCard` login InputGroup + DropdownMenu picker (saved profiles) + clear; Connect disabled without login; i18n ru/en/fr/de/bg (`settings.integrations.ocp.login*`); component tests
- Implementation evidence (T-021 / E-06 UI): Settings nav Integrations parent group + OCP Module child (`settings-nav-integrations` / `settings-nav-integrations-ocp`); `SettingsIntegrationsPanel` + `OcpModuleSettingsCard`; `useOcpSettingsPanel`; Zustand OCP projection sync via `OcpProjectionHub.subscribe`; `CallbackOcpNotificationPresenter` + `mapOcpNotificationToToastDescriptor` → `useNotifications`; i18n ru/en/fr/de/bg; component tests
- Implementation evidence (E-07 UI): `OperatorStatusSelector` widget + `useOperatorStatusSelector`; pill chip (`width: auto`, max-width, ellipsis + title tooltip, translucent timer); `OcpStatusDropdown` Ready/Break subtitle groups; `OcpStatusTimer` / `OcpConnectionBanner` / `OcpProxyStatusScreen`; header slot in `SoftphoneShellHeader` + ReadyShell wiring; change-status Use Case bind; i18n `ocp.status.*` / `ocp.dropdown.*` / `ocp.connection.*` / `ocp.proxyStatus.*` / `ocp.operatorStatus.*`; stories + unit tests
- Implementation evidence (E-08 UI): avatar «Выйти» reads live `OcpProjectionHub`; opens `OcpLogoutReasonModal` for any live OCP session (`connected|authenticated|connecting|reconnecting`); footer actions right-aligned; authenticated → `LogoutOperator` + SIP; connected-only → `disconnectOcp` + SIP; otherwise SIP-only; i18n `ocp.logout.modal.*`; hook/component tests
- Implementation evidence (T-026 UI polish 2026-07-14): status selector visual polish + truncation tooltip; dropdown group subtitle hierarchy; logout footer end-align; Settings Integrations nested nav; icon `settings.integrations.ocp`; tests + i18n keys `settings.nav.integrations.ocp`
- Implementation evidence (E-09 UI): `OcpCampaignEventModal` (UI Kit Dialog, no Escape/outside dismiss) when `campaignEventProjection.activeCampaign !== null`; `useOcpCampaignModal` → Accept/Reject Use Cases + `clearActiveCampaign`; toast sink already via T-021; i18n `ocp.campaign.modal.*`; hook/component tests
- Implementation evidence (E-10 logic): `OcpTelephonyBridgeService` call lifecycle (`get_main_acallid` / `dlg_stop` + correlation map); `selectIsCallButtonBlocked`; `OcpTelephonyBridge.integration.test.ts`; i18n keys `ocp.dialpad.reservedToCall`, `ocp.incomingCall.rejectWithBreakReason`
- Implementation evidence (T-025 / E-10 UI): `useDialpadShell` blocks dial/video on `RESERVED_TO_CALL`; `IncomingCallRejectControl` choice menu (without break / with break); `OcpRejectBreakReasonModal` + `useOcpRejectWithBreak` → RejectCall + ReservePostCallStatus; overlay + session card wiring; i18n `ocp.incomingCall.rejectWithoutBreak` / `ocp.incomingCall.breakModal.*`; component/hook tests
- Implementation evidence (E-11): `OcpSipCredentialService` → `AuthorizeSipAccountUseCase` (`source: "ocp"`, password redacted in events) + `RegisterAccountUseCase`; guards `autoSipAuth` / `sipRegistered`; Facade wiring; unit tests
- Implementation evidence (E-12): `OcpHostApiContract` + parsers (`ocp:authenticate` / status / `ocp:logout` / `ocp:disconnect`); Facade `authenticateOcpFromHost` / `changeOcpStatusFromHost` / `logoutOcpFromHost` / `disconnectOcpFromHost` / `getOcpConnectionState` (for future ExternalClientGateway); **no** `window.Softphone`; unit tests (contract + facade)
- Implementation evidence (E-13): `src/application/integration/OcpFullFlow.integration.test.ts` (connect→auth→break→dlg_stop→logout; authenticate→terminate→sessionClosed; reconnect×6→failed; SESSION_EXIST); i18n parity `ocp.*` / `settings.integrations.*` (ru/en/fr/de/bg); smoke `ocp-integration/OCP-Smoke-Checklist.md`; Legacy LF-018/019/041–049 → F-028
- Implementation evidence (audit remediation 2026-07-14): `OcpSessionLifecycleService` (LF-049 terminate → `sessionClosed` + `OperatorSessionEnded`/`OperatorLoggedOut`); `OcpSipCascadeBridgeService` (SIP teardown on `OperatorLoggedOut`); Facade UI command surface (`changeOcpOperatorStatus`, `logoutOcpOperator`, `reserveOcpPostCallStatus`, accept/reject campaign, projection getters/`subscribeOcpProjections`); Domain Events published on real paths; `OcpNotificationPresenter.setHandler` (no adapter `instanceof`); `maybeAutoConnectOcp` after bootstrap
- Implementation evidence (T-027 status UX 2026-07-14): FSM Ready/Break/Preparing idle targets; `resolveOperatorStatusChangeMode`; `ChangeOperatorStatusUseCase` intent `auto|apply|reserve` + reserved outcome/event; selector stays enabled when busy; reservation toast; `OcpPostCallStatusModal` finish/reserve; i18n `ocp.status.reservedToast` / `ocp.postCall.modal.*`
- Implementation evidence (T-028 UI polish 2026-07-14): reason-only chip (no «Входящий»/«Готов» fallback); sticky last reason on RINGING; no box-shadow; hover border `--color-status-online`; shrink/ellipsis + title tooltip; compact fonts; single-step post-call modal (status + choices + Cancel/Confirm, no close X)
- Implementation evidence (T-029 selector UX 2026-07-14): dropdown pins current reason first (`currentItems` + `ocp.dropdown.currentGroup`), Ready/Break lists exclude current; Break→Break remains `change_status_to_break`; header slot fills to softphone edge (`max-width: 100%`, `min-width: 0`, ellipsis); truncated label uses `IconTooltip`; i18n ru/en/fr/de/bg
- Implementation evidence (T-045 selector server-driven label 2026-07-19): chip label follows `ocpOperatorStatusProjection` only (no optimistic click override); dropdown flat Ready → Separator → Break (no «Текущий» / group subtitles); current reason stays in its list with `aria-current`; removed unused `ocp.dropdown.*Group` keys
- Implementation evidence (T-045 follow-up 2026-07-19): idle Ready/Break show reason («Доступен»); system statuses RINGING/TALKING show canonical i18n («Звонок»/«Разговор»); renamed `ocp.operatorStatus.ready` away from «Готов»; no sticky previous reason during calls
- Implementation evidence (T-047 system reason_id 2026-07-19): Domain `resolveOperatorReasonId` — wire `reason_id: null` → `status.value` (system statuses); applied in `parseOcpMessage` + `reduceOperatorStatusFromUsers`; unit tests
- Implementation evidence (T-045 toast fix 2026-07-19): `resolveNotificationDescriptorTitle` passes `messageParams` into reserved toast; post-call Confirm closes in `finally`; reserve notify cannot stick modal submitting
- Implementation evidence (T-046 header identity → avatar menu 2026-07-19): `UserAvatarMenu` non-selectable identity (`user-menu-identity`) + separator; `SoftphoneShellHeader` no longer renders inline `UserHeaderIdentity`; `OperatorStatusSelector` label slot `width:0`/`min-width:0` + ellipsis + `IconTooltip` so long status cannot widen shell; tests for menu identity order and truncation host
- Implementation evidence (T-046 follow-up break scroll 2026-07-19): `OcpStatusDropdown` pins Ready; Break group scrolls with max 6 visible (`OCP_STATUS_BREAK_VISIBLE_COUNT`); story `ManyBreakReasonsScroll`
- Implementation evidence (T-046 follow-up current option chrome 2026-07-19): current Ready green / Break orange (`--color-status-online` / `--color-status-dnd`) border+text only; current inert; hover same accents; `isCurrent` only when `status` is READY|BREAK and `reasonId` equals option id (Preparing/Ringing/Talking/unmatched → no active)
- Implementation evidence (Auth Flow WU-04 UI 2026-07-16): `AccountPanel` SIP/OCP Tabs + OCP InputGroup fields; `useAccountActions` → `signInAccount` / dual-FSM recovery; removed Account logout, switch modal, generic retry; i18n `account.mode.tabsAria` / `account.server.*` / `account.authorization.*`; tests + `ui:catalog`; handoff WU-04 evidence
- Implementation evidence (Auth Flow WU-05 2026-07-16): `deriveSettingsNavigationAvailability` + `resolveAllowedSettingsSection`; `useOverlayShell` route guard; `SettingsSidebar` disabled + `settings.nav.disabled.authorizeFirst`; `OcpModuleSettingsCard` / `useOcpSettingsPanel` edit-only active profile (no Connect/Disconnect/login picker/retry); dual status read-only + `ocp-module-open-account-recovery`; i18n `settings.integrations.ocp.editOnly.*` / `activeProfile` / `openAccountForRecovery`
- Implementation evidence (ADR-AF-005 2026-07-16 logic): `AccountSessionActivated` event; promote-before-register in `authorizeManualAccount` / `OcpSipCredentialService`; Settings gate + Login lock on `hasActiveAccountSession`; `deriveOcpSystemStateShell` + i18n `settings.systemState.ocp.*` / tab keys
- Implementation evidence (T-034 UI 2026-07-16): `SettingsSystemStatePanel` SIP/OCP Tabs; `SettingsSystemStateOcpTab` + `useOcpSystemStateShell`; OCP tab disabled when module off; stripped `account-server-status` / `ocp-module-*-status`; tests + `ui:catalog`; overlay tests aligned to `hasActiveAccountSession`
- Implementation evidence (mode-isolated Account validation 2026-07-17): `validateAccountSignInCommand` OCP path ignores SIP fields; `buildAccountSignInCommand` derives provisional SIP identity from OCP draft only and omits `rememberPassword` without boundary SIP password; `PersistDraftAccountArtifactsUseCase` soft-skips empty SIP password when `ocpDomain` present; Facade OCP draft persist aligned; tests in `accountSignInCommand.test.ts` / `accountActionsHelpers.test.ts` / `AccountBootstrapFacade.accountSignIn.test.ts`
- Implementation evidence (Auth Flow Hardening 2026-07-17): three-axis account/OCP/SIP outcomes; five-stage OCP progress with stage timeouts and socket epoch; atomic profile/secret compensation; selected-profile secret boundary (ADR-AF-006); persistent Account errors; unified Application logout outcome.
- Implementation evidence (T-039 logout→Login re-enable 2026-07-17): `EndUserSessionUseCase` publishes `UserSessionEnded` after best-effort SIP teardown (partial failures included; concurrent teardown still blocked); `useAccountActions` refreshes Account sign-in VM when `hasActiveAccountSession` clears; tests `EndUserSessionUseCase.test.ts` / `useAccountActions.test.ts`
- Implementation evidence (T-040 logout idle reset 2026-07-17): `AccountLogoutOrchestrationService` disarms `OcpTransportRecoveryService` before intentional disconnect and resets `OcpProjectionHub` to idle; `cancelAll` clears `wasLive`; failed logout re-arms tracking; tests `AccountLogoutOrchestrationService.test.ts` / `OcpTransportRecoveryService.test.ts` / `OcpProjectionHub.test.ts`
- Implementation evidence (OCP vs SIP domain on reconnect 2026-07-17): `entity:creds` must not overwrite session OCP hostname; `resolveOcpProxyAuthenticateDomain` + Facade `connectOcp`/`reconnect` heal SIP-polluted `ocpIntegration.domain`; tests `resolveOcpProxyAuthenticateDomain.test.ts` / `ocpSessionProjection.test.ts` / `AccountBootstrapFacade.test.ts`
- Implementation evidence (OCP saved SIP profile from creds 2026-07-17): `persistOcpDerivedSipArtifacts` writes SIP domain/server/password from active SipAccount after creds; migrates/deletes provisional OCP-host draft; `buildAccountSignInCommand` keeps rememberPassword until creds; tests `AccountBootstrapFacade.accountSignIn.test.ts` / `accountActionsHelpers.test.ts`
- Implementation evidence (single `/proxy/authenticate` on Reconnect 2026-07-17): `OcpTransportRecoveryService.ignoreTransportDrops` after `cancelAll` until next `connecting|connected`; prevents delayed twin HTTP from async WS close racing hub progress; tests `OcpTransportRecoveryService.test.ts`

## F-029: User Notification Journal

- Legacy IDs: none
- Context: Settings
- Priority: high
- Status: verification in progress
- Owner: TBD
- Inputs: sanitized user-facing notification descriptors from the central Application capture sink
- Outputs: rolling 24-hour journal entries and popup-present/suppressed decision
- Acceptance Criteria:
  - Every notification is recorded even when popup display is disabled.
  - Entries retain date/time, stable account identity and label, title, module, function, level, correlation id, and `suppressedAtEmission`.
  - Secret-like values are redacted before persistence.
  - Settings offers identity/module filters, title search, and pagination.
  - Entries older than 24 hours are pruned automatically.
- Test Coverage:
  - Domain: sanitization, persistence parsing and rolling retention.
  - Application: capture, popup suppression, filtering and pagination.
  - Adapters: atomic file persistence and corrupt-document recovery.
  - Renderer: Settings history as UI Kit `Table` (time/user/title/module/level/popup), suppressed marker and page controls.
  - Account display labels show only the local part before `@` in filters and table rows.
  - Settings nav uses animated `settings.notifications` (`Bell` / `BellIcon`).
  - SIP-only sign-in success is two journaled toasts (`account.success.sipTransportConnected`, `account.success.sipRegistrationSucceeded`); SIP connect/register errors attach toast action `account.notification.openSystemStateAction` («Состояние системы»).
- Architecture: ADR-AF-007; `UserNotificationCaptureService` → `UserNotificationJournalRepository` → file/in-memory adapters.
- Implementation evidence: `RecordUserNotificationUseCase`, `QueryUserNotificationJournalUseCase`, `FileUserNotificationJournalRepository`, `useNotifications`, `SettingsNotificationHistoryPanel`, `NotificationHistoryTable`, `toUserNotificationAccountDisplayLabel`, `deriveAccountSignInNotificationFeedback`.