# F-031 WU-11: фокус и реальные события

**Дата:** 2026-07-30 10:13
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/telephony/callFocusProjection.ts`
- `src/renderer/bootstrap/bindExternalServicesAutomation.ts`
- `src/renderer/stores/useAccountBootstrapStore.ts`

## Что
- Фокус линии перенесён в Application-проекцию, редуцируемую вместе с вызовами.
- Реальные committed events передаются в F-031 через post-commit binder без ожидания HTTP.
- Добавлены typed snapshot reader и тесты фокуса, binder, multi-call и OCP регрессий.
- Обновлены F-031 registry, handoff, ADR, STATUS и progress.

## Зачем
- Автоматические вебхуки используют единый event-time фокус и не влияют на путь вызова.

## Результат
- Focused tests (30), `npm run typecheck`, `npm run lint`, `npm run registry:check` — PASS.
