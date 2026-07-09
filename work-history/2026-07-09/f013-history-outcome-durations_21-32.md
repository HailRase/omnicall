# F-013 Call History Display Logic

**Дата:** 2026-07-09 21:32
**Статус:** выполнено
**Коммит:** `39afae2`

## Где
- `src/domain/settings/CallHistoryEntry.ts`
- `src/domain/settings/persistedCallHistory*.ts`
- `src/application/read-models/CallHistoryCallTracker.ts`
- `src/application/projections/contacts/deriveCallHistory*.ts`
- `src/renderer/hooks/useCallHistory*.ts`, `HistoryDetailPanel.tsx`, i18n catalogs
- `docs/softphone/handoffs/P09-F013-Call-History-Display-Logic-Handoff.md`

## Что
- `missed` только для входящих без ответа, сброшенных абонентом; исходящие/локальный reject → `canceled`
- Добавлены `endReason` (`local_hangup` / `remote_cancel` / `failure` / `unknown`) и поля ring/talk duration
- Общая `durationSec` = ring + talk; в списке истории только время начала звонка
- Schema v2 + миграция v1 (outgoing legacy `missed` → `canceled`)
- Минимальный UI wiring деталей + i18n (ru/en/fr/de/bg)

## Зачем
- Исправить нелогичный outcome «пропущен» для исходящих и дать оператору причину завершения и раздельные длительности.

## Результат
- `npm run test` — 1585 passed, 1 skipped
- `npm run lint` / `typecheck` / `i18n:check` — green
