# OCP Module — Manual Smoke Checklist

**Feature:** F-028
**Stage:** E-13 + Auth Flow Hardening (2026-07-17)
**Updated:** 2026-07-17

Use against a real or staging OCP WebSocket. Automated coverage is in `OcpFullFlow.integration.test.ts` (mock + adapter) and `OcpBackedSignInOrchestrationService.test.ts`.

| ID | Scenario | Pass criteria | Result |
| --- | --- | --- | --- |
| SM-1 | Settings → Integrations → OCP → Connect and sign in | Progress stages visible; READY in header only after SIP registered | ☐ |
| SM-2 | READY → BREAK (reason) | Orange status dot / break label | ☐ |
| SM-3 | Incoming call while authenticated | `get_main_acallid` in WS logs | ☐ |
| SM-4 | Call ends (local hangup, remote end, reject, outbound fail) | Exactly one `dlg_stop` with `payload.acallid` = SIP session id (`type: dlg_stop_calls`); no `call_id` | ☐ |
| SM-5 | Logout with reason | `change_status_to_logout` + disconnect; SIP cascade if authenticated | ☐ |
| SM-6 | WS disconnect ~10s | Connection banner → reconnect attempts (capped) | ☐ |
| SM-7 | SESSION_EXIST | Non-blocking toast; retry connect allowed; no reconnect loop | ☐ |
| SM-8 | HTTP authenticate | GET `https://{ocpDomain}/proxy/authenticate?login=` + `Ocp-Proxy-Api-Key` (OCP host, **not** SIP PBX); token not persisted | ☐ |
| SM-8b | System State → OCP → Reconnect | Fresh token request hits **OCP Domain** again (same host as initial sign-in), even when SIP domain from creds differs; **exactly one** `/proxy/authenticate` (no delayed twin ~5s later) | ☐ |
| SM-9 | Auth timeout 15s | Toast when `users`/authenticated never arrives | ☐ |
| SM-10 | Saved account OCP one-click | Linked profile defaults to account-linking method; sign-in without SIP password; success only after SIP ready | ☐ |
| SM-11 | OCP login picker / progressive setup | Login → domain → API key → one Connect and sign in; no Enable-first for first-time; settings scoped per login | ☐ |
| SM-12 | External command (prep) | `changeOcpStatusFromHost({ targetStatus: 'break', reasonId })` via Facade/host contract → status command sent (future WS gateway) | ☐ |
| SM-13 | OCP connected, SIP register fails | OCP may stay up; UI shows phone registration failed + one Retry; no premature success toast | ☐ |
| SM-14 | INVALID_TOKEN | No infinite WS reconnect; one auto HTTP re-auth; further Retry manual | ☐ |
| SM-15 | Disconnect OCP vs Logout | Disconnect keeps SIP; Logout tears OCP + SIP once | ☐ |
| SM-16 | Creds identity mismatch | Active SIP differs from OCP creds → mismatch feedback; no silent ignore | ☐ |
| SM-17 | Five-stage OCP sign-in | HTTP token → OCP submit → credentials → SIP transport → SIP auth; exact active/failed stage visible | ☐ |
| SM-18 | Stage timeout restart | Timeout at each injected boundary shows exact stage; Restart begins fresh HTTP flow/socket | ☐ |
| SM-19 | Saved profile secret UX | Domain/server/secrets visible, secrets masked by default, one-click sign-in has no false overwrite | ☐ |
| SM-20 | Notification journal | Auth errors remain in 24h history; popup-off entry is marked suppressed; identity/module/search/page work | ☐ |

## Notes

- SM-12 validates the E-12 command surface; browser SDK / `ExternalClientGateway` is still future (EXT).
- Do not log OCP tokens or SIP passwords in smoke notes.
- Do not claim production readiness until SM-1…SM-20 are checked on staging.

## /ui wiring contract (T-031 + unified auth)

Facade methods (no React in Application):

- `listOcpConnectLoginOptions()` → empty ⇒ plain login `Input`; non-empty ⇒ input-select / Combobox
- `getOcpModulePanelState({ login, accountKey? })` → `{ target, settings, hasApiKey, loginOptions }` when login changes
- Persist domain / toggles: `updateOcpSettings(ocp, { accountKey: target.accountKey })`
- Persist api-key: `saveOcpProxyApiKey(key, { accountKey })` / `deleteOcpProxyApiKey({ accountKey })`
- Connect / sign-in: `connectOcp({ login, accountKey })` / `signInViaOcp` — **ok only after SIP ready**
- Account: two methods (account linking vs phone password); progress from `ocpSession.authorizationProgress`
