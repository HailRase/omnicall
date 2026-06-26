# Enterprise Softphone Implementation Roadmap

## Type

DOCUMENT.

This document defines the implementation order for the Electron rewrite.

## Product priority (ADR-0002)

**OCP plugin is DEFERRED.** See `OCP-PLUGIN-BACKLOG.md`.

Active track: **P11** shell/settings UX (**WU0–WU5 + UI-4 + post-WU5 polish done**), **F-008 DTMF real**, P10 headset, P12 host API. RAT R1–R4 + step 08 **closed**. **RAT transfer (step 07): backlog** — `real-integration/TRANSFER-REAL-ADAPTER-BACKLOG.md`. See `STATUS.md`.

**Not in active scope:** P06/P07 real OCP integration, RAT step 06 R5 smoke, operator platform on production stand — until user resumes OCP backlog.

## Roadmap Rules

- Implement phases in order unless an ADR approves a change.
- Each task must reference `LF-XXX` legacy IDs.
- Each task must update Feature Registry status.
- Each phase must leave the app in a usable state.
- Critical flows require unit and integration tests before moving forward.
- UX/UI states must be designed before UI implementation starts.

## Agent Start Protocol

Every implementation agent must begin with:

1. Read `MASTER_SYSTEM_PROMPT.md`.
2. Read `Architecture-Constitution.md`.
3. Read `Legacy-Feature-Coverage.md`.
4. Read the current phase in this roadmap.
5. Identify the first incomplete task.
6. Confirm affected `LF-XXX` IDs.
7. Design Domain Events and Use Cases before UI or adapters.

## Target Runtime Shape

```txt
Electron Main
  ├─ app lifecycle
  ├─ windows
  ├─ tray
  ├─ updater
  ├─ native notifications
  └─ infrastructure services

Electron Preload
  └─ narrow typed IPC facade

Renderer
  ├─ React UI
  ├─ Zustand projections
  └─ Use Case bindings

Core
  ├─ Domain
  ├─ Application
  ├─ Ports
  └─ Adapters
```

## Phase 00: Platform Foundation

Legacy IDs:

- none directly

Goal:

Create the technical foundation required to implement legacy parity safely.

Implement:

1. Electron + React + TypeScript + Vite project shell.
2. Strict TypeScript configuration.
3. Test runner for Domain and Application.
4. Folder structure:

```txt
src/
├── main/
├── preload/
├── renderer/
├── application/
├── domain/
├── ports/
├── adapters/
├── infrastructure/
└── shared/
```

5. Dependency boundary linting.
6. Logging interface and test logger.
7. Correlation ID generator.
8. Typed result/error model.

Gate:

- Domain tests run without Electron.
- Renderer cannot access Node directly.
- No `any`.
- No feature code without `LF-XXX`.

## Phase 01: Authorization And Account Bootstrap

Legacy IDs:

- `LF-001` through `LF-007`
- `LF-011`
- `LF-085`

Goal:

Support both optional OCP bootstrap and SIP-only account bootstrap.

Order:

1. Define `SipAccount`, `OperatorSession`, `RegistrationState`.
2. Define events:
   - `OcpAuthenticationRequested`
   - `OcpAuthenticationSucceeded`
   - `OcpAuthenticationFailed`
   - `SipCredentialsReceived`
   - `RegistrationRequested`
   - `RegistrationSucceeded`
   - `RegistrationFailed`
3. Define ports:
   - `OperatorPlatformGateway`
   - `TelephonyGateway`
   - `SettingsRepository`
4. Implement Use Cases:
   - `AuthenticateOcpUseCase`
   - `AuthorizeSipAccountUseCase`
   - `RegisterAccountUseCase`
5. Implement mock gateways first.
6. Implement UI states:
   - loading
   - invalid token
   - session exists
   - access denied
   - offline
   - online
   - DND
7. Add OCP plugin adapter after mocks.
8. Add JsSIP adapter only after registration Use Case tests pass.

Gate:

- SIP-only mode works without OCP.
- OCP mode can receive SIP credentials and register.
- Registration state is event-derived.
- UI never imports JsSIP or WebSocket adapter.

## Phase 02: Dialpad And Outgoing Call Foundation

Legacy IDs:

- `LF-020`
- `LF-025`
- `LF-026`
- `LF-033`
- `LF-034`
- `LF-035`

Goal:

Let the user enter a number and start an outgoing call through Call Engine.

Order:

1. Define `PhoneNumber` value object.
2. Define `Call`, `CallId`, `CallDirection`, `CallState`.
3. Define events:
   - `OutgoingCallRequested`
   - `OutgoingCallStarted`
   - `CallProgressReceived`
   - `CallAnswered`
   - `CallFailed`
   - `DtmfSent`
   - `DtmfFailed`
4. Implement `CallStateMachine`.
5. Implement `CallEngine.makeCall`.
6. Implement `MakeCallUseCase`.
7. Implement `SendDtmfUseCase`.
8. Implement `MediaGateway` for remote audio and tones.
9. Build Dialpad UX:
   - numeric input
   - delete
   - clear
   - long press `0` to `+`
   - call button states
10. Add outgoing call card.
11. Add progress/busy/failed tones.
12. Add real JsSIP call adapter after mock coverage.

Gate:

- Number entry works before telephony adapter exists.
- Outgoing call works with mock gateway.
- JsSIP is hidden behind `TelephonyGateway`.
- Remote audio is owned by Media service.

## Phase 03: Incoming Call Foundation

Legacy IDs:

- `LF-012` through `LF-017`
- `LF-036`
- `LF-061`
- `LF-090`

Goal:

Support incoming ringing, modal UX, answer, reject, DND reject, auto-answer, and caller metadata.

Order:

1. Define incoming call adapter event mapping.
2. Define events:
   - `IncomingCallReceived`
   - `IncomingCallRingingStarted`
   - `CallAnswered`
   - `CallRejected`
   - `CallAutoAnswered`
   - `CallRejectedByDnd`
   - `CallRejectReasonSelected`
3. Implement `AnswerCallUseCase`.
4. Implement `RejectCallUseCase`.
5. Implement auto-answer policy.
6. Implement DND reject policy.
7. Implement display-name parser as boundary utility.
8. Build incoming modal UX:
   - caller number
   - display name
   - queue placeholder
   - answer
   - reject
   - reject reason selector
   - auto-answer countdown
9. Map legacy `soft-phone-break-reason` through Host adapter.

Gate:

- Incoming call can be answered and rejected with mock gateway.
- DND path rejects without showing invalid controls.
- Auto-answer is deterministic and cancellable by call end.
- Reject reason is emitted through Integration adapter, not DOM from UI.

## Phase 04: Active Call Controls

Legacy IDs:

- `LF-022`
- `LF-024`
- `LF-027`

Goal:

Support core active call controls.

Order:

1. Define events:
   - `CallHeld`
   - `CallResumed`
   - `CallMuted`
   - `CallUnmuted`
   - `CallHangupRequested`
   - `CallEnded`
2. Implement Use Cases:
   - `HoldCallUseCase`
   - `ResumeCallUseCase`
   - `MuteCallUseCase`
   - `UnmuteCallUseCase`
   - `HangupCallUseCase`
3. Add active call control panel.
4. Add disabled states for invalid transitions.
5. Add keyboard accessibility.

Gate:

- Invalid controls are disabled by projection.
- State machine rejects invalid transitions.
- Active call UI never inspects raw adapter sessions.

## Phase 05: Multi-Call And Transfer

Legacy IDs:

- `LF-021`
- `LF-023`
- `LF-028` through `LF-032`

Goal:

Support multiple sessions, exclusive hold, blind transfer, attended transfer, and failed transfer recovery.

Order:

1. Define multi-call policy model.
2. Define call relationship model for attended transfer.
3. Define events:
   - `AllOtherCallsHeld`
   - `SecondSessionBlocked`
   - `TransferModeStarted`
   - `TransferModeCancelled`
   - `CallTransferRequested`
   - `CallTransferred`
   - `CallTransferFailed`
   - `CallAutoUnheldAfterTransferFailure`
4. Implement Use Cases:
   - `StartTransferUseCase`
   - `CancelTransferUseCase`
   - `BlindTransferUseCase`
   - `AttendedTransferUseCase`
5. Add transfer UX:
   - transfer mode visual state
   - target entry
   - blind transfer action
   - attended consultation action
   - cancel transfer
   - failure recovery banner
6. Add multisession settings dependency.
7. **WU6:** Multi-call completeness per `P05-Multi-Call-Product-Decisions.md` (incoming hold-all, fail-safe, UI lines panel).
8. **RAT step 08:** Real multi-call smoke (`step-08-multi-call-real.md`).

Gate:

- Failed transfer restores valid call state.
- Multi-call policy is test-covered.
- No mutable transfer flags exist on adapter sessions.

## Phase 06: Operator Status And Post-Call Workflows

Legacy IDs:

- `LF-018`
- `LF-019`
- `LF-041` through `LF-048`
- `LF-062`
- `LF-078`

Goal:

Support OCP operator statuses, DND rules, break reasons, post-call processing, and logout.

Order:

1. Define `Agent`, `AgentStatus`, `StatusReason`.
2. Define status state machine.
3. Define events:
   - `AgentStatusChangeRequested`
   - `AgentStatusChanged`
   - `AgentStatusChangeRejected`
   - `BreakReasonsReceived`
   - `PostCallStatusUpdated`
   - `AgentLogoutRequested`
   - `AgentLoggedOut`
4. Implement Use Cases:
   - `ChangeAgentStatusUseCase`
   - `UpdatePostCallStatusUseCase`
   - `LogoutOperatorUseCase`
5. Build status selector UX.
6. Build status duration timer.
7. Build logout reason modal.
8. Integrate DND status constraints.
9. Integrate reject reason post-call update.

Gate:

- SIP-only mode hides or disables OCP-specific status controls cleanly.
- Invalid status transitions are impossible.
- Logout cascade has tests.

## Phase 07: OCP Call Synchronization And Campaigns

Legacy IDs:

- `LF-037` through `LF-040`
- `LF-050`
- `LF-059`
- `LF-063` through `LF-065`

Goal:

Support OCP queue/campaign/call synchronization and notifications.

Order:

1. Define typed OCP message schemas.
2. Define exact call ID mapping for `main_acallid`.
3. Define events:
   - `QueueInfoReceived`
   - `CampaignEventReceived`
   - `CampaignEventAnswered`
   - `CallButtonBlocked`
   - `OcpNotificationReceived`
   - `ExternalCallEventPublished`
   - `DlgStopRequested`
   - `DlgStopSent`
4. Implement OCP gateway message parser.
5. Implement `SyncMainAcallIdUseCase`.
6. Implement campaign Use Cases.
7. Implement OCP notification projection.
8. Build campaign modal UX.
9. Build toast UX.
10. Implement `dlg_stop` exactly-once policy.

Gate:

- No infinite interval polling.
- Queue name mapping is exact, not substring-based.
- Campaign modal can close according to product rules.
- OCP sync is absent in SIP-only mode.

## Phase 08: Connection Loss, Recovery, And Cleanup

Legacy IDs:

- `LF-008` through `LF-010`
- `LF-048`
- `LF-049`
- `LF-057`
- `LF-058`
- `LF-079`

Goal:

Make disconnects, reconnects, server termination, and app shutdown safe and observable.

Order:

1. Define reconnect policy.
2. Define events:
   - `OcpDisconnected`
   - `OcpReconnectScheduled`
   - `OcpReconnectSucceeded`
   - `OcpReconnectFailed`
   - `SipReconnectScheduled`
   - `SipReconnectSucceeded`
   - `SipReconnectFailed`
   - `ServerTerminateReceived`
   - `AppShutdownRequested`
3. Implement retry scheduler with cleanup.
4. Implement lost connection overlay.
5. Implement manual retry.
6. Implement server-side terminate handling.
7. Implement app shutdown cleanup.
8. Implement manual SIP re-registration.

Gate:

- Timers are cleaned.
- Retry behavior is test-covered.
- Shutdown does not leave active SIP sessions unmanaged.
- Lost connection UI is understandable and actionable.

## Phase 09: History, Logging, And Diagnostics

Legacy IDs:

- `LF-052` through `LF-054`
- `LF-066` through `LF-070`
- `LF-083`
- `LF-088`
- `LF-089`

Goal:

Support call history, diagnostics, SIP/audio logging, export, filters, and retention.

Order:

1. Define `CallHistoryEntry`.
2. Define `DiagnosticLogEntry`.
3. Define repositories:
   - `CallHistoryRepository`
   - `DiagnosticLogRepository`
4. Define events:
   - `CallHistoryRecorded`
   - `DiagnosticLogRecorded`
   - `DiagnosticsExportRequested`
   - `OldLogsPruned`
5. Implement history persistence.
6. Implement redial from history.
7. Implement diagnostics UI.
8. Implement SIP debug toggle.
9. Implement audio debug logger.
10. Implement Excel export adapter.
11. Implement log retention.

Gate:

- No secrets in logs.
- History retention is enforced.
- Export works without coupling UI to storage.

## Phase 10: Headset Integration

Legacy IDs:

- `LF-071` through `LF-075`

Goal:

Support WebHID and native headset controls through adapters.

Order:

1. Define `HeadsetDevice`, `HeadsetState`, `HeadsetCommand`.
2. Define `HeadsetGateway`.
3. Define events:
   - `HeadsetConnected`
   - `HeadsetDisconnected`
   - `HeadsetAnswerPressed`
   - `HeadsetHangupPressed`
   - `HeadsetHoldPressed`
   - `HeadsetMutePressed`
   - `HeadsetLedSyncRequested`
4. Implement WebHID adapter.
5. Implement native Jabra adapter.
6. Map hardware commands to Use Cases.
7. Implement LED sync from projections.
8. Implement headset sync UI block.

Gate:

- Vendor details remain inside adapters.
- Headset commands do not bypass Call Engine.
- UI cannot become inconsistent during hardware sync.

## Phase 11: Settings, Personalization, And Shell UX

Legacy IDs:

- `LF-055`
- `LF-056`
- `LF-060`
- `LF-076`
- `LF-077`
- `LF-082`
- `LF-084`
- `LF-086`
- `LF-087`
- `LF-032` (multi-session toggle — UI enabler for R7-5 re-smoke)

Goal:

Complete user configuration and desktop shell UX.

**UI foundation (2026-06-25):** docs `UI-Architecture.md`, `UI-Design-System.md`, `UI-Component-Catalog.md`; Storybook 8; overlay navigation; CSS Modules UI-4 **complete**.

**Completed work units (sync with `STATUS.md`):**

| WU | Topic | Handoff |
| --- | --- | --- |
| WU0 | Shell layout zones | `handoffs/P11-WU0-Shell-Layout-Handoff.md` |
| WU1 | Settings overlay + multiSessions | `handoffs/P11-WU1-Settings-Overlay-Handoff.md` |
| WU2 | Call line UX | `handoffs/P11-WU2-Call-Line-UX-Handoff.md` |
| WU3 | Header collapsed | `handoffs/P11-WU3-Header-Collapsed-Handoff.md` |
| WU4 | Settings schema v1 | `handoffs/P11-WU4-Settings-Schema-Handoff.md` |
| WU5 | UI-4 CSS Modules slices A–I | `handoffs/P11-WU5-UI-4-Final-Gate-Handoff.md` |

**Completed (post-WU5 polish — sync with `STATUS.md`):**

| Topic | Handoff |
| --- | --- |
| Dialpad home + session tabs + avatar recovery ring | `handoffs/P11-Post-WU5-Shell-Polish-Handoff.md` |

**Completed (TASK-QUEUE — sync with `STATUS.md`):**

| ID | Topic | Handoff / evidence |
| --- | --- | --- |
| T-001 | Icon tooltips (1s delay) | `handoffs/P11-Icon-Tooltips-Agent-Prompt.md` |
| T-002 | AppIcon wiring | `Icon-Registry.md`, `iconCatalog.ts` |
| T-005 | Fullscreen settings panel | `work-history/2026-06-26/fullscreen-settings-sidebar_12-40.md` |

**Remaining (priority order — see `TASK-QUEUE.md`):**

1. **F-008 DTMF real** — `/adapter` — T-003, `JsSipTelephonyAdapter.sendDtmf`
2. Settings UX completeness (account, behavior, audio, notifications, diagnostics panels)
3. UI-6 Radix + motion on incoming/campaign modals
4. Collapse/expand polish, theme, toast placement
5. **P10** headset foundation — `/logic` — T-004
6. Draggable widget or Electron window drag (ADR if needed)
7. Codecs placeholder or ADR

Gate (phase):

- Settings are per-user.
- Settings changes produce explicit events.
- Electron shell UX does not leak business logic.

**Phase gate status (2026-06-26):** WU0–WU5 + post-WU5 polish **closed** (743 tests). **Open for phase close:** UI-6 Radix modals, theme LF-082, draggable LF-056, toast placement LF-060, codecs placeholder LF-084.

## Phase 12: External Host API Compatibility

Legacy IDs:

- `LF-051`
- `LF-065`
- `LF-080`
- `LF-081`

Goal:

Preserve host-page integration compatibility while centralizing all global API behavior.

Order:

1. Define `ExternalSoftphoneApi` contract.
2. Define compatibility matrix for legacy methods.
3. Implement one `HostSoftphoneApiAdapter`.
4. Map methods:
   - `authorize`
   - `logout`
   - `answer`
   - `hangup`
   - `callNumber`
   - `getActiveCallId`
   - `isRegistered`
   - `isSoftPhoneWsConnected`
   - `setCallButtonDisabled`
   - `setBreakReasons`
   - `ocpModule.changeStatusToReady`
   - `ocpModule.changeStatusToBreak`
   - `ocpModule.blockSoftPhoneNotification`
   - `onInit`
5. Map legacy external call events.
6. Add compatibility tests.
7. Document deprecations.

Gate:

- `window.Softphone` is mutated in one file only.
- Every legacy method maps to Use Case or query.
- Compatibility tests cover old host API.

## Final Product Parity Gate

Before declaring parity:

1. Check every `LF-001` through `LF-090`.
2. Check every critical legacy feature has test evidence.
3. Check SIP-only mode.
4. Check OCP plugin mode.
5. Check host API compatibility.
6. Check reconnect and shutdown.
7. Check headset flows.
8. Check UX states for loading, error, ringing, active, failed, disconnected, collapsed.
9. Check no forbidden dependency exists.
10. Check ADRs for all intentional deviations.

## Recommended Agent Work Units

Each agent should implement one work unit:

- one phase if small
- one `LF-XXX` cluster if phase is large
- one Use Case plus tests
- one UI flow after Domain/Application is complete
- one adapter after mock gateway tests pass

Do not assign an agent "build softphone".

Assign:

```txt
Implement P02 outgoing call foundation for LF-020, LF-025, LF-026, LF-033, LF-034, LF-035.
Read roadmap, feature coverage, architecture constitution, feature-slice skill.
Start with Domain events and CallStateMachine tests.
```
