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

## Removed per ADR-0005

**Legacy operator-platform integration removed** from product (ADR-0005). Operator-context legacy IDs below are **deprecated** — not in scope. Core telephony (`LF-006`–`LF-008`, `LF-011`–`LF-035`, etc.) remains active.

Deprecated operator-related IDs (non-exhaustive): `LF-001`–`LF-005`, `LF-018`–`LF-019`, `LF-037`–`LF-040`, `LF-041`–`LF-049`, `LF-050`, `LF-059`, `LF-062`–`LF-064`, `LF-078`, `LF-085` (operator auth path). SIP recovery (`LF-008`, `LF-057` SIP row) remains active.


## Context Values

- `Operator` (deprecated): legacy auth, statuses, campaigns, post-call — removed per ADR-0005.
- `Telephony`: SIP registration, calls, hold, transfer, DTMF, call lifecycle.
- `Media`: audio elements, ringing, tones, remote streams, audio diagnostics.
- `Headset`: WebHID, native headset adapters, headset synchronization.
- `Settings`: user configuration, theme, debug options, history limits.
- `Integration`: host-page API, DOM events, external contracts, logging export.
- `UI`: shell behavior, overlays, menus, visual states.

## Phase Values

- `P01`: Authorization and account bootstrap.
- `P02`: Dialpad and outgoing call foundation.
- `P03`: Incoming call foundation.
- `P04`: Active call controls.
- `P05`: Multi-call and transfer.
- `P06`: Operator status and post-call workflows.
- `P07` (deprecated): legacy call sync and campaigns — removed per ADR-0005.
- `P08`: Connection loss, recovery, and cleanup.
- `P09`: History, logging, and diagnostics.
- `P10`: Headset integration.
- `P11`: Settings, personalization, and shell UX.
- `P12`: External host API compatibility.

## Legacy Coverage Matrix

| Legacy ID | Phase | Context | Priority | Legacy Feature | Legacy Modules | Acceptance Focus |
|-----------|-------|---------|----------|----------------|----------------|------------------|
| LF-001 | P01 | Operator | Critical | Legacy WebSocket token authorization (removed) | `useWs`, `StatusesProvider` | legacy operator integration authenticates by token and remains optional. |
| LF-002 | P01 | UI | Critical | Legacy loading screen (removed) | `SoftPhonePlug` | Startup shows deterministic loading state during legacy operator auth. |
| LF-003 | P01 | UI | Critical | Session already exists screen | `SoftPhonePlug`, `useWs` | Legacy `SESSION_EXIST` maps to recoverable UI state. |
| LF-004 | P01 | UI | Critical | Invalid token screen | `SoftPhonePlug` | Invalid token maps to explicit access error UI. |
| LF-005 | P01 | Telephony | Critical | Auto SIP authorization from WS credentials | `StatusesProvider`, `authorize` | Legacy credentials trigger SIP registration through Use Cases. |
| LF-006 | P01 | Telephony | High | Manual SIP authorization from Account tab | `Account`, `authorize` | SIP-only mode can authorize without legacy operator integration. OCP Module mode validates login/domain/API key independently (T-036 / `validateAccountSignInCommand` + `buildAccountSignInCommand`). |
| LF-007 | P01 | Telephony | Critical | SIP registration on SBC | `DisplayProvider`, `initUAConfig` | Registration uses `TelephonyGateway` and emits registration events. |
| LF-008 | P08 | Telephony | High | Repeat SIP registration after failure | `DisplayProvider`, user config | F-014: `SipRecoveryOrchestrationService`, `sipSessionHealthProjection`, `SipRecoveryOrchestration.integration.test.ts` — T-008 / ADR-0004. |
| LF-009 | P08 | UI | Medium | Re-registration timer UI | `RegisterTimer` | **Cancelled** (ADR-0004, 2026-07-02): avatar recovery ring and overlay timer UX superseded by header unified SIP status + Settings «Состояние системы» panel. |
| LF-010 | P08 | Telephony | Medium | Manual re-registration from menu | `Header`, `UserMenu` | F-014: `ReregisterSipUseCase`, `SettingsSystemStatePanel`, `useSipSystemStateActions`, section `system-state` — T-008 / ADR-0004 (legacy header menu superseded). |
| LF-011 | P01 | UI | High | phoneStatus Online/Offline/DND display | `DisplayProvider` | WU3: `deriveHeaderChromeShell`, `RegistrationStatusDot` on avatar + expanded `PhoneStatusBadge` — see `P11-Header-Collapsed-UX-Design.md`. |
| LF-012 | P03 | Media | Critical | Incoming call ringtone | `soundManager`, `newRTCSession` | Incoming call starts ringing through Media service. |
| LF-013 | P03 | UI | Critical | Incoming call overlay | `IncomingCallOverlay` | Incoming call appears with caller details and accept/reject actions (banner under header). |
| LF-014 | P03 | Telephony | Critical | Accept incoming call | `handleAnswer` | Answer command transitions call to active via Call Engine. |
| LF-015 | P03 | Telephony | Critical | Reject incoming call | `handleHangup` | Reject command ends ringing call and emits reason. |
| LF-016 | P03 | Telephony | High | Auto-answer timeout | user config, `DisplayProvider` | Configured timeout answers call deterministically. |
| LF-017 | P03 | Telephony | High | DND auto-reject with 486 | `DisplayProvider`, `localStorage isDND` | DND rejects incoming call without UI bypass. |
| LF-018 | P06 | Operator | High | DND switches operator to break (removed) | `useDNDValidation` | **ADR-0005** legacy removed. Parity via **F-028**: `OcpDndBridgeService` → break / `ReservePostCallStatusUseCase`. |
| LF-019 | P06 | Operator | High | DND blocks Ready status | `legacy status selector` | **ADR-0005** legacy removed. Parity via **F-028**: `ChangeOperatorStatusUseCase` rejects `dnd_blocks_ready`. |
| LF-020 | P02 | Telephony | Critical | Outgoing call | `handleCall`, `Display` | Dialpad starts outgoing call through `MakeCallUseCase`. |
| LF-021 | P05 | Telephony | High | Hold all calls before new call | `handleHoldAll` | WU1+**WU6:** mock + integration tests. **RAT 08:** real SBC R7-1/R7-2 **PASS** 2026-06-25. |
| LF-022 | P04 | Telephony | Critical | Hold and unhold session | `onToggleHoldHandler` | P11 WU2: per-line hold on `CallLineRow`; mute survives local resume — `telephonyCallControlOperations.ts`, `CallEngine.test.ts`. |
| LF-023 | P05 | Telephony | High | Exclusive hold for other calls | `onToggleHoldHandler` | WU1+WU6 mock. **RAT 08:** real SBC R7-3 **PASS** 2026-06-25. |
| LF-024 | P04 | Media | Critical | Mute and unmute microphone | `onToggleMuteHandler` | `mediaCallControlOperations.ts`, `BrowserMediaAdapter.ts`; mute survives hold/unhold renegotiation — `CallEngine.test.ts`, `CallEngine.remoteHold.test.ts`, `BrowserMediaAdapter.test.ts`. |
| LF-025 | P02 | Telephony | High | DTMF from dialpad | `DialPad`, `sendDTMF` | Active call sends validated DTMF tones. |
| LF-026 | P02 | UI | Low | Long press 0 produces plus | `DialPad` | Dialpad supports international number input. |
| LF-027 | P04 | Telephony | Critical | Hang up call | `handleHangup` | Hangup transitions any valid active call to terminal state. |
| LF-028 | P05 | Telephony | High | Blind transfer | `ControlPanel`, `onReferHandler` | WU2: `BlindTransferUseCase`, transfer events, mock gateway — see `handoffs/archive/P05/P05-WU2-Transfer-Domain-Handoff.md`. |
| LF-029 | P05 | Telephony | High | Attended transfer with multiple lines | `ActiveCall`, `onReferHandler` | WU3: `handoffs/archive/P05/P05-WU3-Attended-Transfer-Handoff.md` — consultation + attended transfer via mock gateway. |
| LF-030 | P05 | UI | Medium | Cancel transfer mode | `ActiveCall` | WU4: `CancelTransferUseCase`, `control-cancel-transfer`, `TransferModeCancelled` — see `handoffs/archive/P05/P05-WU4-Transfer-Panel-Handoff.md`. |
| LF-031 | P05 | Telephony | Medium | Auto-unhold after failed transfer | user config | WU4: `CallAutoUnheldAfterTransferFailure`, `MultiCallSettings.autoUnholdOnTransferFailure`, `transferFailureRecovery.ts`. |
| LF-032 | P05 | Telephony | High | Block second session when disabled | `isMultiSessions` | WU6 mock + integration. **RAT 08:** real R7-5 **PASS** 2026-06-25 (initial: repo default; re-smoke via P11 settings `multiSessionsEnabled` toggle). |
| LF-033 | P02 | Media | Medium | Ringback tone on 183 | `isRBT` config | Outgoing progress 183 can play configured RBT. |
| LF-034 | P02 | Media | Medium | Busy and failed tones | `soundManager` | Failed outgoing calls play normalized failure tones. |
| LF-035 | P02 | Media | Critical | Remote audio element | `SoftPhone`, `DisplayProvider` | Remote audio is attached by Media service, not UI business logic. |
| LF-036 | P03 | Telephony | High | Display name from SIP | `parseDisplayName` | SIP display metadata is parsed and projected safely. |
| LF-037 | P07 | Operator | High | Queue name display | `useQueueInfoListeners` | WU3–WU4: `QueueInfoLabel`, `deriveQueueLabelState`, `na` timeout — see `removed archives|
| LF-038 | P07 | Operator | High | Campaign data on incoming call | `useCampaignEvent`, `IncomingCallOverlay` | WU3: campaign badge in overlay — see `removed archives|
| LF-039 | P07 | UI | High | Non-progressive campaign request modal | `CampaignEventModal` | WU3: `CampaignEventModal.tsx`, `useCampaignActions` — see `removed archives|
| LF-040 | P07 | Operator | High | Campaign answer or reject update | `CampaignEventModal` -> WS update | WU3: `legacy campaign use case`, `CampaignEventAnswered` — see `removed archives|
| LF-041 | P06 | Operator | Critical | Legacy operator status selector (removed) | `legacy status selector` | **ADR-0005** legacy removed. Parity via **F-028**: `OperatorStatusSelector` + `OcpStatusDropdown` (E-07). |
| LF-042 | P06 | Operator | Critical | Change status to Ready | `handleChangeToReady` | **ADR-0005** legacy removed. Parity via **F-028**: `ChangeOperatorStatusUseCase` → `change_status_to_ready`. |
| LF-043 | P06 | Operator | Critical | Change status to Break with reason | `handleChangeToBreak` | **ADR-0005** legacy removed. Parity via **F-028**: `ChangeOperatorStatusUseCase` → `change_status_to_break` + reason pickers. |
| LF-044 | P06 | Operator | Critical | Post-call status while busy | `PROXY_POST_CALL_STATUS` | **ADR-0005** legacy removed. Parity via **F-028**: `ReservePostCallStatusUseCase` / `update_post_call_status` + `FinishPostCallAppealUseCase` (T-048 finish footer). |
| LF-045 | P06 | Operator | High | Status transition validation | `USER_STATUS_RULES` | **ADR-0005** legacy removed. Parity via **F-028**: `OperatorStatusMachine` + Use Case guards. |
| LF-046 | P06 | UI | Medium | Status duration timer | `StatusTimer` | **ADR-0005** legacy removed. Parity via **F-028**: `OcpStatusTimer` (E-07). |
| LF-047 | P06 | Operator | High | Logout with reason | `StatusReasonsModal`, `Header` | **ADR-0005** legacy removed. Parity via **F-028**: `LogoutOperatorUseCase` + `OcpLogoutReasonModal` (E-08). |
| LF-048 | P08 | Operator | Critical | Legacy logout cascade (removed) | `ocpLogout`, `softphoneLogoutEvent` | **ADR-0005** legacy removed. Parity via **F-028**: `AccountLogoutOrchestrationService` owns OCP operator logout/disconnect → SIP teardown → local account end; renderer consumes one typed outcome. **T-040:** intentional logout disarms OCP transport recovery and resets projections to idle (no reconnect banner). |
| LF-049 | P08 | Operator | Critical | Server-side terminate | `useWs entity terminate` | **ADR-0005** legacy removed. Parity via **F-028**: `OcpSessionLifecycleService` on `{ entity: terminate }` → transport `disconnected` + dual-FSM legacy `sessionClosed` + `OperatorSessionEnded`/`OperatorLoggedOut` + SIP cascade; evidence `OcpSessionLifecycleService.test.ts`, `OcpFullFlow.integration.test.ts`. |
| LF-050 | P07 | Operator | High | Block call button from legacy RESERVED state | `useBlockedCallButton` | legacy operator platform reserved state disables calling deterministically. |
| LF-051 | P12 | Integration | High | External call button block | `setCallButtonDisabled` | Host API can block call button through typed adapter. |
| LF-052 | P09 | Telephony | Medium | Redial or call from journal | `Display`, `Journal` | History entries can initiate calls via Use Case. |
| LF-053 | P09 | Settings | Medium | Call history in local storage | `call-history`, `Journal` | Call events persist through repository abstraction. Evidence: `CallHistoryEntry` v2 (`endReason`, ring/talk durations), `persistedCallHistory` schema v2 + v1 migrate, `CallHistoryCallTracker`, `RecordCallHistoryUseCase`. |
| LF-054 | P09 | Settings | Low | Limit call history to 100 records | `saveCall` | Repository enforces retention policy. |
| LF-055 | P11 | UI | Medium | Collapse and expand UI | `CollapseButton`, `Display` | Desktop shell supports compact softphone mode; shell window layout expands for settings (F-016) — `ShellWindowLayout`, `ShellWindowController`. |
| LF-056 | P11 | UI | Low | Draggable widget | `DraggableButton` | Startup/settings anchor via `ShellWindowController.placeCompactAtStartup` + `resolveShellWindowTargetBounds` (F-016); full drag handle deferred. |
| LF-057 | P08 | UI | High | Lost WS overlay | `WSConnectionOverlay` | **Superseded** (ADR-0004, 2026-07-02): legacy overlay removed; recovery UX in header SIP status + Settings «Состояние системы». **ADR-AF-005 + T-034 (2026-07-16):** OCP Server/Authorization in System State OCP tab (`SettingsSystemStateOcpTab` / `deriveOcpSystemStateShell`). Prior evidence: `handoffs/archive/P08/P08-WU3-Recovery-Overlay-Handoff.md`. |
| LF-058 | P08 | Operator | High | WS reconnect 6 attempts by 5 seconds | `useWs` | WU2: `legacy reconnect policy`, `Legacy reconnect*`, orchestration + integration test — see `handoffs/archive/P08/P08-WU2-Recovery-Orchestration-Handoff.md`. **F-028 / ADR-AF-002 (2026-07-16):** Application `OcpTransportRecoveryService` owns capped fresh-HTTP-token reconnect; `OcpWebSocketAdapter` no longer schedules stale-token reconnect. **2026-07-17:** fresh-token HTTP host is OCP proxy domain only — `entity:creds` SIP domain must not replace it (`resolveOcpProxyAuthenticateDomain`). |
| LF-059 | P07 | UI | Medium | Legacy toast notifications (removed) | `NotificationProvider` | WU4: `legacy toast stack`, `legacy notification projection`, `legacy notifications hook` — see `removed archives|
| LF-060 | P11 | Settings | Low | Toast position and z-index settings | user config | User config controls notification placement. |
| LF-061 | P03 | Operator | High | Reject reason selection | `RejectReasonSelector` (post-call/logout) | Incoming overlay rejects without reason picker; break reasons remain in post-call/logout flows. |
| LF-062 | P06 | Operator | High | WS post-call update on reject | `IncomingCallModal` | WU3: `legacy post-call reject orchestration` + facade `rejectCall` — see `removed archives|
| LF-063 | P07 | Operator | Critical | Legacy call-id synchronization (removed) | `legacy events hook`, `useWs` | WU1–WU4: exact correlation registry + `legacy end-call sync` orchestration — see `removed archives|
| LF-064 | P07 | Operator | Critical | Legacy end-of-call sync (removed) | `handleSaveCallHistory`, `legacy end-of-call hook` | WU4: `legacy end-call sync use case`, `legacy end-call policy`, `legacy end-call orchestration` — see `removed archives|
| LF-065 | P12 | Integration | Critical | External call events to legacy platform (removed) | `externalEvents`, `legacy events hook` | Internal call events map to legacy host/legacy operator platform events. |
| LF-066 | P09 | Integration | Medium | User action logging in IndexedDB | `loggerDB` | User actions persist through logging repository. |
| LF-067 | P09 | Integration | Medium | Send logs to legacy platform (removed) | `window.ws.sendLog` | Legacy logging uses typed gateway, not global `window.ws`. |
| LF-068 | P09 | Telephony | Low | SIP message logging | `initUAConfig` socket wrap | SIP diagnostics can be enabled without leaking secrets. |
| LF-069 | P09 | Integration | Medium | Export logs to Excel | `Logs`, `xlsx` | Logs export works through explicit diagnostics UI. |
| LF-070 | P09 | UI | Low | SIP and non-SIP log filter | `Logs` | Diagnostics UI filters log categories. |
| LF-071 | P10 | Headset | High | WebHID headset connection | `headsetConnection` | `HeadsetGateway` + `WebHidHeadsetAdapter`, settings connect/disconnect, Electron HID permissions — `src/ports/headset/`, `src/adapters/headset/webhid/`, `src/main/index.ts` (`setupHidPermissions`). |
| LF-072 | P10 | Headset | High | HID hook controls answer, hangup, hold | `usePhoneCommands`, orchestrator | `HeadsetSessionOrchestrator`, `forwardHeadsetHardwareEvent.ts`, facade Use Cases — hardware never bypasses Call Engine. |
| LF-073 | P10 | Headset | Medium | HID mute sync and LED | `ledOutputSync`, `useHidLedSync` | `resolveDeviceCommandsFromSnapshot.ts`, `hidLedOutput.ts`, snapshot-diff reconcile in orchestrator. |
| LF-074 | P10 | UI | Medium | Headset UI block during sync | `useHeadsetCallController` | `headsetSyncBusyProjection.ts`, `applyHeadsetSyncBusyToActiveCallControls.ts`, `useCallFeatureShell.ts`. |
| LF-075 | P10 | Headset | Medium | Native Jabra adapter | `headsetAdapters` | v1: vendor profiles in Web HID (`hidParsers.ts`, `hidLedOutput.ts`); native SDK deferred per ADR-0007. |
| LF-076 | P11 | Settings | High | Auto-answer, RBT, multisession settings | `Common`, `setUserConfig` | WU1: `SettingsOverlay` multi-session toggle. WU3: settings via avatar menu. WU4: schema fields `autoAnswerTimeoutSec`, `ringbackToneEnabled`, `multiSessionsEnabled` in `UserSettings` v1 — `P11-Settings-Schema-Design.md`. **F-028 WU-05:** pre-auth Settings gate blocks Sessions/General/etc. until SIP-ready (`deriveSettingsNavigationAvailability`). |
| LF-077 | P11 | Settings | High | Per-user config in local storage | `JSSIP_CONFIGS` | WU4: `UserSettings` v3 schema. **F-023 done:** disk persistence, profile switch on authorize, composite profile key — `P11-Local-Account-Profiles-Design.md`, `FileSettingsRepository.ts`, `AccountBootstrapFacade.test.ts` (A→B→A). **F-024 done:** saved SIP profile list + quick sign-in UI — `SavedAccountProfile.ts`, `SavedAccountProfileSelector.tsx`, `handoffs/P11-F024-Saved-Account-Profiles-Handoff.md`. **Auth Flow WU-01:** draft/successful lifecycle + pre-auth opted-in secret persist — `PersistDraftAccountArtifactsUseCase.ts`, ADR-AF-001. **Auth Flow WU-03 (ADR-AF-003):** Account path rejects login while SIP registered (no silent unregister); A→B→A only after avatar/logout — `signInAccount`, `AccountBootstrapFacade.accountSignIn.test.ts`. **Auth Flow WU-04:** Account UI modes SIP/OCP; switch-confirmation modal removed; Login disabled while registered (`account.signIn.disabled.logoutFirst`) — `AccountPanel.tsx`, `useAccountActions.ts`. **T-044 (2026-07-17):** OCP saveProfile persists SIP domain/server/password from `entity:creds`, not OCP Domain — `persistOcpDerivedSipArtifacts`. |
| LF-078 | P06 | Settings | Medium | Break reasons from legacy platform (removed) | `setBreakReasons` | WU3: `legacy break-reasons sync`, `BreakReasonsReceived`, `SettingsRepository.setAllowedBreakReasons` — see `removed archives|
| LF-079 | P08 | Telephony | Critical | beforeunload SIP cleanup | `DisplayProvider` | WU4–WU5: `ShutdownCleanupUseCase`, `EndUserSessionUseCase`, `SessionTeardownOrchestrationService`, IPC `app:before-close`, `useAppShutdown`, `control-end-session` — see `handoffs/archive/P08/P08-WU4-Recovery-Manual-Shutdown-Handoff.md`, `handoffs/archive/P08/P08-WU5-User-Session-Logout-Handoff.md`. **T-039 (2026-07-17):** logout publishes `UserSessionEnded` even after partial SIP teardown so Login re-enables (ADR-AF-005). |
| LF-080 | P12 | Integration | Critical | `window.Softphone` external API | multiple files | **Not ported.** Legacy embed global rejected; external browser tabs will use `ExternalClientGateway` + `ExternalCommandRouter` (WS → Electron main). OCP command surface: F-028 E-12 Facade methods. |
| LF-081 | P12 | Integration | High | `legacy status module` external status API | `uselegacy status selectorAPIAdapter` | Host status via future ExternalCommandRouter → `ChangeOperatorStatusUseCase` with `callType: 'external'` (Facade `changeOcpStatusFromHost`). |
| LF-082 | P11 | Settings | Low | Light and dark theme | `applyAppTheme`, `UserSettings.theme` | Theme persisted per account; light default; General settings segmented control; `data-theme` + `tokens.css` light/dark tokens. Evidence: `src/domain/settings/AppTheme.ts`, `src/renderer/theme/applyAppTheme.ts`, `SettingsGeneralPanel`, `validateUserSettings.test.ts`. **F-028 WU-05:** General (theme) gated until SIP-ready (ADR-AF-004). |
| LF-083 | P09 | Settings | Low | Debug JsSIP setting | Common settings | Debug flag controls SIP diagnostics safely. |
| LF-084 | P11 | Settings | Low | Codec preferences settings panel | `SettingsCodecsPanel`, `SettingModal` | F-022: audio codec order/enablement in settings; video future-only; audio order applied on new RTC sessions via JsSIP adapter. Evidence: `SettingsCodecsPanel.tsx`, `CodecPreferencesSortableList.tsx`, `prepareJsSipSessionCodecPreferences.ts`, `wireJsSipCodecPreferences.ts`, `SettingsCodecsPanel.test.tsx`. **F-028 WU-05:** Codecs section pre-auth gated. |
| LF-085 | P01 | UI | Low | AccessDenied without username | `Common`, `Account` | Missing account identity shows deterministic access state. |
| LF-086 | P11 | UI | Medium | Avatar and user menu | `Avatar`, `UserMenu` | `UserAvatar` + `UserAvatarMenu` on avatar click (settings, DND toggle, logout); `PhoneStatusBadge` removed from header — `P11-Header-Collapsed-UX-Design.md`. **F-028 WU-05:** avatar remains sole logout; Settings open still works; deep links to gated sections redirect to Account. |
| LF-087 | P11 | UI | Medium | Status in header | `Header` | Operator/phone state visible in always-expanded shell (2026-06-26). **F-028 WU-05:** OCP Module no longer owns Connect/Disconnect; status recovery from Integrations routes to Account. |
| LF-088 | P09 | Media | Low | Audio debug logger | `audioLogger` | Audio diagnostics are available without production noise. |
| LF-089 | P09 | Integration | Low | Clear logs older than 8 hours | `addUserActionLog` | Log retention policy is enforced. |
| LF-090 | P03 | Integration | Medium | `soft-phone-break-reason` event | `RejectCallUseCase` / host gateway | Break reason emitted when supplied by post-call or operator flows (not incoming overlay). |

## Coverage Completion Definition

Product parity is complete only when:

1. Every row has implementation evidence.
2. Every row has acceptance evidence.
3. Every critical and high row has tests or an ADR-approved deferral.
4. Every external contract has compatibility tests.
5. SIP-only telephony features remain verified without legacy operator integration.
