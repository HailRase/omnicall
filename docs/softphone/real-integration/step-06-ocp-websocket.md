# Step 06: Real OCP WebSocket (R5)

## Goal

OCP auth, status change, queue sync, campaigns on real WebSocket.

## Feature IDs

F-009, F-010, F-015, LF-001–004, LF-037–040

## Tasks

1. `WebSocketOperatorPlatformGateway` — authenticate, changeAgentStatus, getBreakReasons, updatePostCallStatus, requestLogout, reconnectTransport, disconnect handler
2. `WebSocketOcpSyncGateway` — parseInboundMessage, respondToCampaign, sendDlgStop
3. Document whether legacy uses one WS or two; share connection if required
4. Dev URL: `?mode=ocp&adapters=real&token=...&domain=...`
5. Verify StatusSelector, campaigns, toasts on real OCP

## UX

- Auth loading / session exists / invalid token (LF-002–004)
- StatusSelector only in OCP mode
- Campaign modal on real `campaign_event`
- Connection overlay OCP row on disconnect

## Smoke

See `SMOKE-CHECKLIST.md` § R5.

## Gate

- SIP-only works without OCP
- OCP smoke on dev stand

## Update PROGRESS

Mark step 06 `done`.
