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
- Test Coverage:
  - Unit: registration state transitions
  - Integration: mock telephony gateway
  - E2E: deferred until SIP sandbox exists

## F-002: Incoming Call

- Legacy IDs: `LF-012`, `LF-013`, `LF-014`, `LF-015`, `LF-016`, `LF-017`, `LF-036`, `LF-061`, `LF-090`
- Context: Telephony
- Priority: critical
- Status: planned
- Owner: TBD
- Inputs: incoming session event from telephony adapter
- Outputs: `IncomingCallReceived`, ringing projection, answer/reject commands
- Acceptance Criteria:
  - Incoming call never enters UI directly from JsSIP.
  - Ringing state is produced by the call state machine.
  - UI can answer or reject only through Use Cases.
- Test Coverage:
  - Unit: incoming call transition
  - Integration: adapter event to use-case flow
  - E2E: incoming call UI with mock gateway

## F-003: Outgoing Call

- Legacy IDs: `LF-020`, `LF-025`, `LF-026`, `LF-033`, `LF-034`, `LF-035`
- Context: Telephony
- Priority: critical
- Status: planned
- Owner: TBD
- Inputs: phone number, make-call command
- Outputs: `OutgoingCallStarted`, `CallConnecting`, `CallAnswered`, `CallFailed`
- Acceptance Criteria:
  - Dialpad calls `MakeCallUseCase`.
  - Phone number is validated before adapter invocation.
  - Other active calls follow explicit hold policy.
- Test Coverage:
  - Unit: number validation and transitions
  - Integration: mock gateway call invocation
  - E2E: Dialpad with mock gateway

## F-004: Hold And Resume

- Legacy IDs: `LF-021`, `LF-022`, `LF-023`
- Context: Telephony
- Priority: critical
- Status: planned
- Owner: TBD
- Inputs: call ID, hold/resume command
- Outputs: `CallHeld` or `CallResumed`
- Acceptance Criteria:
  - Invalid transitions are impossible.
  - Hold policy for multiple sessions is explicit.
  - UI does not inspect raw SIP session state.
- Test Coverage:
  - Unit: state machine transitions
  - Integration: mock gateway hold/resume
  - E2E: active call controls

## F-005: Mute And Unmute

- Legacy IDs: `LF-024`, `LF-073`
- Context: Media
- Priority: critical
- Status: planned
- Owner: TBD
- Inputs: call ID, mute/unmute command
- Outputs: `CallMuted` or `CallUnmuted`
- Acceptance Criteria:
  - Media operation is isolated from SIP session objects.
  - Headset LED sync consumes events, not adapter internals.
  - UI state is a projection.
- Test Coverage:
  - Unit: media state transitions
  - Integration: media gateway mock
  - E2E: call controls

## F-006: Blind Transfer

- Legacy IDs: `LF-028`, `LF-030`, `LF-031`
- Context: Telephony
- Priority: high
- Status: planned
- Owner: TBD
- Inputs: active call ID, target number
- Outputs: `CallTransferRequested`, `CallTransferred`, or `CallTransferFailed`
- Acceptance Criteria:
  - Transfer runs through `TransferCallUseCase`.
  - Transfer rules live in Domain.
  - Adapter-specific REFER behavior is hidden.
- Test Coverage:
  - Unit: transfer eligibility
  - Integration: mock telephony gateway transfer
  - E2E: transfer UI with mock gateway

## F-007: Attended Transfer

- Legacy IDs: `LF-029`, `LF-030`, `LF-031`, `LF-032`
- Context: Telephony
- Priority: high
- Status: planned
- Owner: TBD
- Inputs: source call, consultation call, transfer command
- Outputs: attended transfer events
- Acceptance Criteria:
  - Multi-call relationships are explicit.
  - No mutable flags are stored on adapter session objects.
  - Failure returns calls to a valid state.
- Test Coverage:
  - Unit: multi-call transition graph
  - Integration: mock gateway scenario
  - E2E: deferred until call harness exists

## F-008: DTMF

- Legacy IDs: `LF-025`
- Context: Telephony
- Priority: high
- Status: planned
- Owner: TBD
- Inputs: active call ID, tone
- Outputs: `DtmfSent` or `DtmfFailed`
- Acceptance Criteria:
  - Tone is validated before gateway call.
  - UI cannot call SIP session directly.
  - Errors are observable.
- Test Coverage:
  - Unit: tone validation
  - Integration: mock gateway DTMF
  - E2E: dialpad in active call

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
  - OCP is implemented as an integration plugin.
  - WebSocket messages are typed and validated.
- Test Coverage:
  - Unit: OCP message parsing
  - Integration: mock OCP gateway
  - E2E: optional plugin startup

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
