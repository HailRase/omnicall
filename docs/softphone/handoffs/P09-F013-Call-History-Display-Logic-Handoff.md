# P09 F-013 Call History Display Logic Handoff

- Scope: **T-013** — outcome/endReason/duration polish for **F-013** call history.
- Legacy: **LF-052**, **LF-053**, **LF-054**
- Out of scope: new history routes, delete/redial flows (already shipped in 0.8.0), recording attachment.

## Delivered

| Area | Path |
| --- | --- |
| Domain outcome rules | `src/domain/settings/CallHistoryEntry.ts` |
| Persisted schema v2 + v1 migration | `persistedCallHistory.ts`, `persistedCallHistoryMigration.ts`, `persistedCallHistoryReaders.ts` |
| Session tracker | `src/application/read-models/CallHistoryCallTracker.ts` |
| Projections | `deriveCallHistoryShell.ts`, `deriveCallHistoryDetailShell.ts`, `callHistoryProjection.ts` |
| List secondary label | `src/renderer/helpers/resolveHistorySecondaryTimeLabel.ts` |
| Detail UI | `HistoryDetailPanel.tsx`, `useCallHistoryDetailShell.ts`, `useCallHistoryShell.ts` |
| i18n | `src/renderer/i18n/messages.ts` + locale catalogs (ru/en/fr/de/bg) |

## Outcome rules

| Scenario | Outcome | endReason |
| --- | --- | --- |
| Unanswered incoming, remote cancel before answer | `missed` | `remote_cancel` |
| Unanswered outgoing or local reject/hangup before answer | `canceled` | `local_hangup` |
| Answered then ended | `completed` | `local_hangup` or `remote_cancel` per tracker |
| Adapter/gateway failure | `failed` | `failure` |

- `durationSec` = `ringDurationSec` + `talkDurationSec`
- History list secondary line: call start clock time only (no duration)

## F-013 Gate (T-013)

- [x] `missed` only for unanswered incoming remote cancel
- [x] Outgoing/local reject → `canceled`
- [x] `endReason` exposed in detail metadata
- [x] Ring/talk durations stored and shown in detail
- [x] Schema v2; v1 migrate (outgoing legacy `missed` → `canceled`)
- [x] i18n parity ru/en/fr/de/bg; `i18n:check` PASS
- [x] Unit/integration/renderer tests green
- [x] Feature Registry F-013 → `implemented`
- [x] LF-052/053/054 evidence in Legacy-Feature-Coverage

## Verification

```bash
npm run test && npm run lint && npm run typecheck && npm run i18n:check
```

Baseline pre-T-013 **1575** → **1586 tests passed**, 1 skipped (`39afae2`).

## STOP

Do not start P11 UI-6 Radix until next WU prompt.

## Next

- P11 polish: UI-6 Radix modals — `/ui`
- **F-008** DTMF real adapter — `/adapter`
