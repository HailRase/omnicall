# Legacy Softphone Feature Coverage

## Type

DOCUMENT.

This document guarantees that no legacy feature is lost during the Electron rewrite.

## Coverage Rules

- Every legacy feature from the audit receives an `LF-XXX` ID.
- Every implementation phase must reference affected `LF-XXX` IDs.
- No `LF-XXX` can be removed without a documented decision.
- A phase is complete only when all listed legacy features pass acceptance checks.
- Aggregated features in `Feature-Registry.md` must link back to these legacy IDs.
- Product parity requires all `LF-001` through `LF-090` to be implemented or explicitly deprecated by ADR.

## Deferred by product decision (ADR-0002)

**OCP plugin is DEFERRED** to far backlog. See `OCP-PLUGIN-BACKLOG.md`.

Operator-context legacy features remain in the matrix below for **future parity** when backlog resumes. They are **not** in active implementation scope. Core telephony (`LF-006`–`LF-008`, `LF-011`–`LF-035`, etc.) stays priority.

Deferred Operator / OCP-related IDs (non-exhaustive): `LF-001`–`LF-004`, `LF-018`–`LF-019`, `LF-037`–`LF-040`, `LF-041`–`LF-049`, `LF-050`, `LF-059`, `LF-062`–`LF-064`, `LF-078`, `LF-085` (OCP auth path). SIP recovery (`LF-008`, `LF-057` SIP row) remains active.

## Context Values

- `Operator`: OCP auth, statuses, campaigns, post-call processing.
- `Telephony`: SIP registration, calls, hold, transfer, DTMF, call lifecycle.
- `Media`: audio elements, ringing, tones, remote streams, audio diagnostics.
- `Headset`: WebHID, native headset adapters, headset synchronization.
- `Settings`: user configuration, theme, debug options, history limits.
- `Integration`: host-page API, DOM events, external contracts, logging export.
- `UI`: shell behavior, overlays, collapsed mode, menus, visual states.

## Phase Values

- `P01`: Authorization and account bootstrap.
- `P02`: Dialpad and outgoing call foundation.
- `P03`: Incoming call foundation.
- `P04`: Active call controls.
- `P05`: Multi-call and transfer.
- `P06`: Operator status and post-call workflows.
- `P07`: OCP call synchronization and campaigns.
- `P08`: Connection loss, recovery, and cleanup.
- `P09`: History, logging, and diagnostics.
- `P10`: Headset integration.
- `P11`: Settings, personalization, and shell UX.
- `P12`: External host API compatibility.

## Legacy Coverage Matrix

| Legacy ID | Phase | Context | Priority | Legacy Feature | Legacy Modules | Acceptance Focus |
|-----------|-------|---------|----------|----------------|----------------|------------------|
| LF-001 | P01 | Operator | Critical | OCP WebSocket token authorization | `useWs`, `StatusesProvider` | OCP plugin authenticates by token and remains optional. |
| LF-002 | P01 | UI | Critical | OCP loading screen | `SoftPhonePlug` | Startup shows deterministic loading state during OCP auth. |
| LF-003 | P01 | UI | Critical | Session already exists screen | `SoftPhonePlug`, `useWs` | OCP `SESSION_EXIST` maps to recoverable UI state. |
| LF-004 | P01 | UI | Critical | Invalid token screen | `SoftPhonePlug` | Invalid token maps to explicit access error UI. |
| LF-005 | P01 | Telephony | Critical | Auto SIP authorization from WS credentials | `StatusesProvider`, `authorize` | OCP credentials trigger SIP registration through Use Cases. |
| LF-006 | P01 | Telephony | High | Manual SIP authorization from Account tab | `Account`, `authorize` | SIP-only mode can authorize without OCP. |
| LF-007 | P01 | Telephony | Critical | SIP registration on SBC | `DisplayProvider`, `initUAConfig` | Registration uses `TelephonyGateway` and emits registration events. |
| LF-008 | P08 | Telephony | High | Repeat SIP registration after failure | `DisplayProvider`, user config | WU2: `ConnectionRecoveryOrchestrationService`, `ReconnectScheduler`, `SipReconnect*`, `reconnectTransport` — see `handoffs/P08-WU2-Recovery-Orchestration-Handoff.md`. |
| LF-009 | P08 | UI | Medium | Re-registration timer UI | `RegisterTimer` | WU4: `useReconnectCountdown`, `ConnectionOverlay` countdown from `nextRetryAt` (LF-057 parity) — see `handoffs/P08-WU4-Recovery-Manual-Shutdown-Handoff.md`. |
| LF-010 | P08 | Telephony | Medium | Manual re-registration from menu | `Header`, `UserMenu` | WU4: `RetryConnectionUseCase`, `control-reregister-sip`, `control-retry-connection` — see `handoffs/P08-WU4-Recovery-Manual-Shutdown-Handoff.md`. |
| LF-011 | P01 | UI | High | phoneStatus Online/Offline/DND display | `DisplayProvider` | Status projection shows telephony availability accurately. |
| LF-012 | P03 | Media | Critical | Incoming call ringtone | `soundManager`, `newRTCSession` | Incoming call starts ringing through Media service. |
| LF-013 | P03 | UI | Critical | Incoming call modal | `IncomingCallModal` | Incoming call appears with caller details and actions. |
| LF-014 | P03 | Telephony | Critical | Accept incoming call | `handleAnswer` | Answer command transitions call to active via Call Engine. |
| LF-015 | P03 | Telephony | Critical | Reject incoming call | `handleHangup` | Reject command ends ringing call and emits reason. |
| LF-016 | P03 | Telephony | High | Auto-answer timeout | user config, `DisplayProvider` | Configured timeout answers call deterministically. |
| LF-017 | P03 | Telephony | High | DND auto-reject with 486 | `DisplayProvider`, `localStorage isDND` | DND rejects incoming call without UI bypass. |
| LF-018 | P06 | Operator | High | DND switches OCP to break | `useDNDValidation` | WU2: `DndAgentStatusOrchestrationService`, `AccountBootstrapFacade.setPhoneStatus` → `ChangeAgentStatusUseCase` — see `handoffs/P06-WU2-Change-Agent-Status-Handoff.md`. |
| LF-019 | P06 | Operator | High | DND blocks Ready status | `StatusSelector` | WU1/WU2: `AgentStatusTransition` + `ChangeAgentStatusUseCase` reject `dnd_blocks_ready` — see `handoffs/P06-WU1-Operator-Status-Domain-Handoff.md`. |
| LF-020 | P02 | Telephony | Critical | Outgoing call | `handleCall`, `Display` | Dialpad starts outgoing call through `MakeCallUseCase`. |
| LF-021 | P05 | Telephony | High | Hold all calls before new call | `handleHoldAll` | WU1+**WU6:** mock + integration tests. **RAT 08:** real SBC R7-1/R7-2 **PASS** 2026-06-25. |
| LF-022 | P04 | Telephony | Critical | Hold and unhold session | `onToggleHoldHandler` | Active call can transition to Held and back. |
| LF-023 | P05 | Telephony | High | Exclusive hold for other calls | `onToggleHoldHandler` | WU1+WU6 mock. **RAT 08:** real SBC R7-3 **PASS** 2026-06-25. |
| LF-024 | P04 | Media | Critical | Mute and unmute microphone | `onToggleMuteHandler` | Mute state changes through Media service and events. |
| LF-025 | P02 | Telephony | High | DTMF from dialpad | `DialPad`, `sendDTMF` | Active call sends validated DTMF tones. |
| LF-026 | P02 | UI | Low | Long press 0 produces plus | `DialPad` | Dialpad supports international number input. |
| LF-027 | P04 | Telephony | Critical | Hang up call | `handleHangup` | Hangup transitions any valid active call to terminal state. |
| LF-028 | P05 | Telephony | High | Blind transfer | `ControlPanel`, `onReferHandler` | WU2: `BlindTransferUseCase`, transfer events, mock gateway — see `handoffs/P05-WU2-Transfer-Domain-Handoff.md`. |
| LF-029 | P05 | Telephony | High | Attended transfer with multiple lines | `ActiveCall`, `onReferHandler` | WU3: `handoffs/P05-WU3-Attended-Transfer-Handoff.md` — consultation + attended transfer via mock gateway. |
| LF-030 | P05 | UI | Medium | Cancel transfer mode | `ActiveCall` | WU4: `CancelTransferUseCase`, `control-cancel-transfer`, `TransferModeCancelled` — see `handoffs/P05-WU4-Transfer-Panel-Handoff.md`. |
| LF-031 | P05 | Telephony | Medium | Auto-unhold after failed transfer | user config | WU4: `CallAutoUnheldAfterTransferFailure`, `MultiCallSettings.autoUnholdOnTransferFailure`, `transferFailureRecovery.ts`. |
| LF-032 | P05 | Telephony | High | Block second session when disabled | `isMultiSessions` | WU6 mock + integration. **RAT 08:** real R7-5 **PASS** 2026-06-25 (smoke via temp repo default); P11 settings UI backlog. |
| LF-033 | P02 | Media | Medium | Ringback tone on 183 | `isRBT` config | Outgoing progress 183 can play configured RBT. |
| LF-034 | P02 | Media | Medium | Busy and failed tones | `soundManager` | Failed outgoing calls play normalized failure tones. |
| LF-035 | P02 | Media | Critical | Remote audio element | `SoftPhone`, `DisplayProvider` | Remote audio is attached by Media service, not UI business logic. |
| LF-036 | P03 | Telephony | High | Display name from SIP | `parseDisplayName` | SIP display metadata is parsed and projected safely. |
| LF-037 | P07 | Operator | High | Queue name display | `useQueueInfoListeners` | WU3–WU4: `QueueInfoLabel`, `deriveQueueLabelState`, `na` timeout — see `handoffs/P07-WU4-OCP-Sync-Polish-Handoff.md`. |
| LF-038 | P07 | Operator | High | Campaign data on incoming call | `useCampaignEvent`, `IncomingModal` | WU3: campaign context line in `CallerIdentityBlock` — see `handoffs/P07-WU3-OCP-Sync-UI-Handoff.md`. |
| LF-039 | P07 | UI | High | Non-progressive campaign request modal | `CampaignEventModal` | WU3: `CampaignEventModal.tsx`, `useCampaignActions` — see `handoffs/P07-WU3-OCP-Sync-UI-Handoff.md`. |
| LF-040 | P07 | Operator | High | Campaign answer or reject update | `CampaignEventModal` -> WS update | WU3: `RespondToCampaignUseCase`, `CampaignEventAnswered` — see `handoffs/P07-WU3-OCP-Sync-UI-Handoff.md`. |
| LF-041 | P06 | Operator | Critical | Operator status selector | `StatusSelector` | WU4: `StatusSelector.tsx`, `useOperatorStatusActions` — see `handoffs/P06-WU4-Operator-Status-UI-Handoff.md`. |
| LF-042 | P06 | Operator | Critical | Change status to Ready | `handleChangeToReady` | WU4: `control-change-ready` → `ChangeAgentStatusUseCase` — see WU4 handoff. |
| LF-043 | P06 | Operator | Critical | Change status to Break with reason | `handleChangeToBreak` | WU4: `BreakReasonPicker` + `ChangeAgentStatusUseCase` — see WU4 handoff. |
| LF-044 | P06 | Operator | Critical | Post-call status while busy | `PROXY_POST_CALL_STATUS` | WU3: `UpdatePostCallStatusUseCase`, `PostCallStatusUpdated` — see `handoffs/P06-WU3-Post-Call-Break-Reasons-Handoff.md`. |
| LF-045 | P06 | Operator | High | Status transition validation | `USER_STATUS_RULES` | WU1/WU2: `AgentStatusTransition` + `ChangeAgentStatusUseCase` — see `handoffs/P06-WU1-Operator-Status-Domain-Handoff.md`. |
| LF-046 | P06 | UI | Medium | Status duration timer | `StatusTimer` | WU4: `StatusTimer.tsx`, `useOperatorStatusTimer` — see WU4 handoff. |
| LF-047 | P06 | Operator | High | Logout with reason | `StatusReasonsModal`, `Header` | WU4: `LogoutReasonModal`, `LogoutOperatorUseCase`, `AgentLogoutRequested` — see WU4 handoff. LF-048 cascade P08. |
| LF-048 | P08 | Operator | Critical | OCP logout cascade | `ocpLogout`, `softphoneLogoutEvent` | WU4–WU5: `ServerTerminateCleanupService`, `SafeLogoutUseCase`, `SessionTeardownOrchestrationService` (SIP cascade) — see `handoffs/P08-WU4-Recovery-Manual-Shutdown-Handoff.md`, `P08-WU5-User-Session-Logout-Handoff.md`. |
| LF-049 | P08 | Operator | Critical | Server-side terminate | `useWs entity terminate` | WU3: `parseOcpInboundMessage` server_terminate → `ProcessOcpInboundMessageUseCase` → `ServerTerminateReceived`; overlay `server_terminate`; scheduler stop — see `handoffs/P08-WU3-Recovery-Overlay-Handoff.md`. |
| LF-050 | P07 | Operator | High | Block call button from OCP RESERVED | `useBlockedCallButton` | OCP reserved state disables calling deterministically. |
| LF-051 | P12 | Integration | High | External call button block | `setCallButtonDisabled` | Host API can block call button through typed adapter. |
| LF-052 | P09 | Telephony | Medium | Redial or call from journal | `Display`, `Journal` | History entries can initiate calls via Use Case. |
| LF-053 | P09 | Settings | Medium | Call history in local storage | `call-history`, `Journal` | Call events persist through repository abstraction. |
| LF-054 | P09 | Settings | Low | Limit call history to 100 records | `saveCall` | Repository enforces retention policy. |
| LF-055 | P11 | UI | Medium | Collapse and expand UI | `CollapseButton`, `Display` | Desktop shell supports compact softphone mode. |
| LF-056 | P11 | UI | Low | Draggable widget | `DraggableButton` | Widget/window drag behavior is predictable in Electron. |
| LF-057 | P08 | UI | High | Lost WS overlay | `WSConnectionOverlay` | WU3: `ConnectionOverlay`, `useConnectionRecoveryShell`, `deriveConnectionRecoveryShell` — see `handoffs/P08-WU3-Recovery-Overlay-Handoff.md`. |
| LF-058 | P08 | Operator | High | WS reconnect 6 attempts by 5 seconds | `useWs` | WU2: `OCP_RECONNECT_POLICY_CONFIG`, `OcpReconnect*`, orchestration + integration test — see `handoffs/P08-WU2-Recovery-Orchestration-Handoff.md`. |
| LF-059 | P07 | UI | Medium | OCP toast notifications | `NotificationProvider` | WU4: `OcpToastStack`, `ocpNotificationProjection`, `useOcpNotifications` — see `handoffs/P07-WU4-OCP-Sync-Polish-Handoff.md`. |
| LF-060 | P11 | Settings | Low | Toast position and z-index settings | user config | User config controls notification placement. |
| LF-061 | P03 | Operator | High | Reject reason selection | `IncomingCallModal` | Reject flow can capture valid break reason. |
| LF-062 | P06 | Operator | High | WS post-call update on reject | `IncomingCallModal` | WU3: `PostCallRejectOrchestrationService` + facade `rejectCall` — see `handoffs/P06-WU3-Post-Call-Break-Reasons-Handoff.md`. |
| LF-063 | P07 | Operator | Critical | main_acallid synchronization | `useOCPEvents`, `useWs` | WU1–WU4: exact correlation registry + `dlg_stop` orchestration — see `handoffs/P07-WU4-OCP-Sync-Polish-Handoff.md`. |
| LF-064 | P07 | Operator | Critical | dlg_stop on ended or failed | `handleSaveCallHistory`, `useSoftPhoneDlgStop` | WU4: `SendDlgStopUseCase`, `DlgStopPolicy`, `CallEndDlgStopOrchestrationService` — see `handoffs/P07-WU4-OCP-Sync-Polish-Handoff.md`. |
| LF-065 | P12 | Integration | Critical | External call events to OCP | `externalEvents`, `useOCPEvents` | Internal call events map to legacy host/OCP events. |
| LF-066 | P09 | Integration | Medium | User action logging in IndexedDB | `loggerDB` | User actions persist through logging repository. |
| LF-067 | P09 | Integration | Medium | Send logs to OCP | `window.ws.sendLog` | OCP logging uses typed gateway, not global `window.ws`. |
| LF-068 | P09 | Telephony | Low | SIP message logging | `initUAConfig` socket wrap | SIP diagnostics can be enabled without leaking secrets. |
| LF-069 | P09 | Integration | Medium | Export logs to Excel | `Logs`, `xlsx` | Logs export works through explicit diagnostics UI. |
| LF-070 | P09 | UI | Low | SIP and non-SIP log filter | `Logs` | Diagnostics UI filters log categories. |
| LF-071 | P10 | Headset | High | WebHID headset connection | `headsetConnection` | Device connection is isolated behind `HeadsetGateway`. |
| LF-072 | P10 | Headset | High | HID hook controls answer, hangup, hold | `usePhoneCommands`, orchestrator | Hardware commands enter through Use Cases. |
| LF-073 | P10 | Headset | Medium | HID mute sync and LED | `ledOutputSync`, `useHidLedSync` | LED state follows media projection. |
| LF-074 | P10 | UI | Medium | Headset UI block during sync | `useHeadsetCallController` | UI prevents conflicting actions during headset sync. |
| LF-075 | P10 | Headset | Medium | Native Jabra adapter | `headsetAdapters` | Vendor implementation stays inside adapter. |
| LF-076 | P11 | Settings | High | Auto-answer, RBT, multisession settings | `Common`, `setUserConfig` | User settings affect Use Cases through repositories. |
| LF-077 | P11 | Settings | High | Per-user config in local storage | `JSSIP_CONFIGS` | Settings persist per account behind repository. |
| LF-078 | P06 | Settings | Medium | Break reasons from OCP in config | `setBreakReasons` | WU3: `BreakReasonsSyncService`, `BreakReasonsReceived`, `SettingsRepository.setAllowedBreakReasons` — see `handoffs/P06-WU3-Post-Call-Break-Reasons-Handoff.md`. |
| LF-079 | P08 | Telephony | Critical | beforeunload SIP cleanup | `DisplayProvider` | WU4–WU5: `ShutdownCleanupUseCase`, `EndUserSessionUseCase`, `SessionTeardownOrchestrationService`, IPC `app:before-close`, `useAppShutdown`, `control-end-session` — see `handoffs/P08-WU4-Recovery-Manual-Shutdown-Handoff.md`, `P08-WU5-User-Session-Logout-Handoff.md`. |
| LF-080 | P12 | Integration | Critical | `window.Softphone` external API | multiple files | One host adapter owns the legacy external API. |
| LF-081 | P12 | Integration | High | `ocpModule` external status API | `useStatusSelectorAPIAdapter` | Host status API maps to operator Use Cases. |
| LF-082 | P11 | Settings | Low | Light and dark theme placeholder | `ThemeProvider` | Theme is persisted and applied consistently. |
| LF-083 | P09 | Settings | Low | Debug JsSIP setting | Common settings | Debug flag controls SIP diagnostics safely. |
| LF-084 | P11 | Settings | Low | Disabled codecs tab | `SettingModal` | Codecs tab is either implemented or explicitly hidden by ADR. |
| LF-085 | P01 | UI | Low | AccessDenied without username | `Common`, `Account` | Missing account identity shows deterministic access state. |
| LF-086 | P11 | UI | Medium | Avatar and user menu | `Avatar`, `UserMenu` | Account menu exposes user and actions clearly. |
| LF-087 | P11 | UI | Medium | Status in collapsed header | `Header` | Collapsed mode still shows operator/phone state. |
| LF-088 | P09 | Media | Low | Audio debug logger | `audioLogger` | Audio diagnostics are available without production noise. |
| LF-089 | P09 | Integration | Low | Clear logs older than 8 hours | `addUserActionLog` | Log retention policy is enforced. |
| LF-090 | P03 | Integration | Medium | `soft-phone-break-reason` event | `IncomingCallModal` | Reject reason is emitted through typed host adapter. |

## Coverage Completion Definition

Product parity is complete only when:

1. Every row has implementation evidence.
2. Every row has acceptance evidence.
3. Every critical and high row has tests or an ADR-approved deferral.
4. Every external contract has compatibility tests.
5. Every optional OCP feature is verified in SIP-only mode.
