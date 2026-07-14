# OCP Module — Manual Smoke Checklist

**Feature:** F-028  
**Stage:** E-13  
**Updated:** 2026-07-14  

Use against a real or staging OCP WebSocket. Automated coverage is in `OcpFullFlow.integration.test.ts` (mock + adapter).

| ID | Scenario | Pass criteria | Result |
| --- | --- | --- | --- |
| SM-1 | Settings → Integrations → OCP → connect | Status READY in header after auth | ☐ |
| SM-2 | READY → BREAK (reason) | Orange status dot / break label | ☐ |
| SM-3 | Incoming call while authenticated | `get_main_acallid` in WS logs | ☐ |
| SM-4 | Call ends | `dlg_stop` in WS logs (with acallId when known) | ☐ |
| SM-5 | Logout with reason | `change_status_to_logout` + disconnect; SIP cascade if authenticated | ☐ |
| SM-6 | WS disconnect ~10s | Connection banner → reconnect attempts | ☐ |
| SM-7 | SESSION_EXIST | Blocking proxy screen; no reconnect loop | ☐ |
| SM-8 | External command (prep) | `changeOcpStatusFromHost({ targetStatus: 'break', reasonId })` via Facade/host contract → status command sent (future WS gateway) | ☐ |

## Notes

- SM-8 validates the E-12 command surface; browser SDK / `ExternalClientGateway` is still future (EXT).
- Do not log OCP tokens or SIP passwords in smoke notes.
