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
  - Reject reason is validated and emitted through `HostIntegrationGateway` as `soft-phone-break-reason`.
- Test Coverage:
  - Unit: state machine incoming transitions, auto-answer policy, DND policy, display-name parser, reject reason validation, answer/reject use cases
  - Integration: mock incoming adapter event to events/projection, ringtone start, answer/reject gateway calls, DND 486, host break-reason mapping, ended-before-answer recovery
  - E2E: deferred until incoming call harness exists

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
- Test Coverage:
  - Unit: number validation and transitions
  - Integration: mock gateway make-call progress/answer/failure + media tones
  - E2E: deferred until dedicated Electron E2E harness exists

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
- Test Coverage:
  - Unit: state machine valid/invalid transitions + use case command tests (including `ActiveCallControlFailed` on gateway failure)
  - Integration: mock telephony hold/resume/hangup success and failure paths
  - Renderer: `ActiveCallControlsPanel` disabled reasons, error banner, retry, keyboard Enter/Space on enabled control
  - E2E: deferred until dedicated Electron E2E harness exists

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

## F-006: Blind Transfer

- Legacy IDs: `LF-028`, `LF-030`, `LF-031`
- Context: Telephony
- Priority: high
- Status: in_progress
- Owner: TBD
- Inputs: active call ID, target number
- Outputs: `CallTransferRequested`, `CallTransferred`, or `CallTransferFailed`
- Acceptance Criteria:
  - WU1 (policy foundation): multi-call policy domain + `AllOtherCallsHeld` / `SecondSessionBlocked` events gate outgoing and incoming second sessions (`LF-021`, `LF-032`); exclusive hold before resume (`LF-023`).
  - WU2: blind transfer runs through `BlindTransferUseCase` → `CallEngine` → `TelephonyGateway.blindTransfer`; domain events `CallTransferRequested`, `CallTransferred`, `CallTransferFailed`; eligibility rules in Domain; mock adapter success/failure paths; `transferProjection` read model.
- Test Coverage:
  - WU1: `MultiCallPolicy.test.ts`, `CallEngine.multiCallPolicy.test.ts`, `multiCallProjection.test.ts`, `MultiCallPolicy.integration.test.ts`
  - WU2: `TransferEligibility.test.ts`, `CallStateMachine.test.ts` (transfer transitions), `MockTelephonyGateway.blindTransfer.test.ts`, `BlindTransferUseCase.test.ts`, `CallEngine.blindTransfer.test.ts`, `transferProjection.test.ts`
  - WU4: E2E transfer UI with mock gateway (deferred)

## F-007: Attended Transfer

- Legacy IDs: `LF-029`, `LF-030`, `LF-031`, `LF-032`
- Context: Telephony
- Priority: high
- Status: in_progress
- Owner: TBD
- Inputs: source call, consultation call, transfer command; WU1: `MultiCallSettings.multiSessionsEnabled`
- Outputs: attended transfer events; WU1: `AllOtherCallsHeld`, `SecondSessionBlocked`
- Acceptance Criteria:
  - WU1: `SettingsRepository.getMultiCallSettings()` drives second-session block (`LF-032`); hold-all before outgoing (`LF-021`); exclusive hold on resume (`LF-023`); dialpad and incoming answer disabled reasons from `multiCallProjection`.
  - WU3+: attended transfer orchestration (`AttendedTransferUseCase`), consultation call model, multi-line read model; failure returns calls to valid state.
- Test Coverage:
  - WU1: domain policy unit tests; CallEngine hold-all / block / exclusive-resume; projection + integration chain
  - WU3+: unit multi-call transition graph; integration mock gateway; E2E deferred until call harness exists

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
- Status: implemented
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

## F-010: Operator Status Management

- Legacy IDs: `LF-018`, `LF-019`, `LF-041`, `LF-042`, `LF-043`, `LF-044`, `LF-045`, `LF-046`, `LF-047`, `LF-048`, `LF-049`, `LF-062`, `LF-078`
- Context: Operator
- Priority: critical
- Status: planned
- Owner: TBD
- Inputs: status change command, optional reason
- Outputs: `AgentStatusChanged` or failure event
- Acceptance Criteria:
  - Status rules are not in UI components.
  - Post-call status transitions are explicit.
  - OCP absence does not break SIP-only mode.
- Test Coverage:
  - Unit: status transition rules
  - Integration: mock operator gateway
  - E2E: status selector

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
- Status: planned
- Owner: TBD
- Inputs: transport disconnects, registration failure, renderer restart
- Outputs: recovery events and restored projections
- Acceptance Criteria:
  - Reconnect policy is explicit.
  - Retry behavior uses backoff and jitter.
  - Recovery flow is observable with correlation IDs.
- Test Coverage:
  - Unit: retry policy
  - Integration: gateway reconnect simulation
  - E2E: deferred until harness exists

## F-015: OCP Call Synchronization And Campaigns

- Legacy IDs: `LF-037`, `LF-038`, `LF-039`, `LF-040`, `LF-050`, `LF-059`, `LF-063`, `LF-064`
- Context: Operator
- Priority: critical
- Status: planned
- Owner: TBD
- Inputs: OCP queue info, campaign events, reserved states, call lifecycle events
- Outputs: queue projection, campaign modal state, OCP updates, `dlg_stop`
- Acceptance Criteria:
  - Queue and `main_acallid` mapping is exact.
  - Campaign UX exists only when OCP plugin is enabled.
  - `dlg_stop` is sent exactly once for ended or failed calls.
- Test Coverage:
  - Unit: OCP message mapping and ID matching
  - Integration: mock OCP gateway
  - E2E: campaign and queue UI with mock OCP

## F-016: Settings And Desktop Shell UX

- Legacy IDs: `LF-055`, `LF-056`, `LF-060`, `LF-076`, `LF-077`, `LF-082`, `LF-084`, `LF-085`, `LF-086`, `LF-087`
- Context: Settings
- Priority: high
- Status: planned
- Owner: TBD
- Inputs: user settings, account identity, shell interactions
- Outputs: persisted settings, collapsed UI state, theme, menu projections
- Acceptance Criteria:
  - Settings are per-user and validated.
  - Collapsed mode preserves critical call/status visibility.
  - Electron shell behavior does not contain business logic.
- Test Coverage:
  - Unit: settings validation and migration
  - Integration: settings repository
  - E2E: settings and collapsed shell UX

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
