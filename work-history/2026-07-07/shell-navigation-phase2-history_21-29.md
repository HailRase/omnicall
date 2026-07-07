# Shell Navigation Phase 2 — Call History (F-013)

**Дата:** 2026-07-07 21:29
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/CallHistory*.ts`, `events/callHistoryEvents.ts`
- `src/ports/settings/CallHistoryRepository.ts`
- `src/adapters/settings/InMemoryCallHistoryRepository.ts`
- `src/application/use-cases/{Record,List,RedialFromHistory}*.ts`
- `src/application/services/CallHistoryRecordingOrchestrationService.ts`
- `src/application/projections/callHistoryProjection.ts`, `deriveCallHistoryShell.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/components/history/`, `shells/history/`, hooks `useCallHistory*`
- `docs/softphone/Feature-Registry.md` (F-013 → implemented)

## Что
- Domain: `CallHistoryEntry`, `CallHistoryRecorded`, retention LF-054 (100 rows).
- Application: tracker + orchestration on call end events, list/redial Use Cases, facade API.
- UI: history panel overlay on `#/history`, entry в user menu, redial → MakeCallUseCase.
- i18n: ru/en/fr/de/bg keys для history.
- Tests: domain mapping, repository retention, navigation tests retained.

## Зачем
- Phase 2 master prompt: F-013 через navigation model без поломки call shell.

## Результат
- `npm run test` — 1539 passed, 1 skipped
- `npm run lint` / `npm run typecheck` — green
- `npm run i18n:check` — pre-existing FormField fail (не в scope)
- Не сделано: file persistence, contacts, settings route Phase 5
