# Step 02: JsSIP Registration (R1)

## Goal

Real SIP register / unregister / reconnect on dev SBC. LF-007, LF-008 transport hooks.

## Feature IDs

F-001 (real path), LF-005, LF-006, LF-007, LF-011

## Tasks

1. Add `@hailrase/jssip` dependency — fork of upstream JsSIP with a micro-fix; see `JSSIP-FORK.md` (non-deprecated API only).
2. Implement `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`:
   - `register`, `unregister`, `reconnectTransport`
   - `setTransportDisconnectedHandler` — fire on WebSocket disconnect
   - Stub other `TelephonyGateway` methods with typed `not_implemented` errors
   - Internal session map by `CallId` — JsSIP objects never cross port
3. Map registration success/failure through existing `RegisterAccountUseCase` flow (events unchanged).
4. Wire in `createRealAccountBootstrap` when `mode=real`.
5. Adapter unit tests: event mapping; optional integration test gated by `SIP_SANDBOX=1`.
6. Reuse `mapTelephonyIncomingNotification.ts` in step 04 — do not duplicate.

## UX / LF

- `AccountPanel` manual SIP (LF-006): credentials → `RegistrationSucceeded`
- `PhoneStatusBadge` Online/Offline from projection (LF-011)
- Registration failure: visible error; retry via existing recovery (LF-008 prep)
- Loading state while registering

## Smoke

See `SMOKE-CHECKLIST.md` § R1.

## Gate

- Mock tests unchanged
- Real register smoke passes on dev SBC
- No password in logs

## Do NOT

- Implement makeCall / answer yet
- Touch CallEngine logic

## Update PROGRESS

Mark step 02 `done`.
