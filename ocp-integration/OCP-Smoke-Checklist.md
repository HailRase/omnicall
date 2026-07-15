# OCP Module — Manual Smoke Checklist

**Feature:** F-028  
**Stage:** E-13  
**Updated:** 2026-07-15  

Use against a real or staging OCP WebSocket. Automated coverage is in `OcpFullFlow.integration.test.ts` (mock + adapter).

| ID | Scenario | Pass criteria | Result |
| --- | --- | --- | --- |
| SM-1 | Settings → Integrations → OCP → connect | Status READY in header after auth | ☐ |
| SM-2 | READY → BREAK (reason) | Orange status dot / break label | ☐ |
| SM-3 | Incoming call while authenticated | `get_main_acallid` in WS logs | ☐ |
| SM-4 | Call ends | `dlg_stop` in WS logs (with acallId when known) | ☐ |
| SM-5 | Logout with reason | `change_status_to_logout` + disconnect; SIP cascade if authenticated | ☐ |
| SM-6 | WS disconnect ~10s | Connection banner → reconnect attempts | ☐ |
| SM-7 | SESSION_EXIST | Non-blocking toast; retry connect allowed; no reconnect loop | ☐ |
| SM-8 | HTTP authenticate | GET `/proxy/authenticate?login=` + `Ocp-Proxy-Api-Key`; token not persisted | ☐ |
| SM-9 | Auth timeout 15s | Toast when `users`/authenticated never arrives | ☐ |
| SM-10 | Saved account OCP checkbox | Shown only when linked+apiKey; sign-in without SIP password | ☐ |
| SM-11 | OCP login picker | Explicit login required; select saved or type new; Connect disabled empty; OCP settings scoped per login | ☐ |
| SM-12 | External command (prep) | `changeOcpStatusFromHost({ targetStatus: 'break', reasonId })` via Facade/host contract → status command sent (future WS gateway) | ☐ |

## Notes

- SM-12 validates the E-12 command surface; browser SDK / `ExternalClientGateway` is still future (EXT).
- Do not log OCP tokens or SIP passwords in smoke notes.

## /ui wiring contract (T-031)

Facade methods (no React in Application):

- `listOcpConnectLoginOptions()` → empty ⇒ plain login `Input`; non-empty ⇒ input-select / Combobox
- `getOcpModulePanelState({ login, accountKey? })` → `{ target, settings, hasApiKey, loginOptions }` when login changes
- Persist domain / toggles: `updateOcpSettings(ocp, { accountKey: target.accountKey })`
- Persist api-key: `saveOcpProxyApiKey(key, { accountKey })` / `deleteOcpProxyApiKey({ accountKey })`
- Connect: `connectOcp({ login, accountKey: target.accountKey })` — reject empty login
- SIP-only authorize + Account «Authorize via OCP» checkbox paths unchanged
