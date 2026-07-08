# Remove Legacy Operator Platform Integration

**Дата:** 2026-07-08 14:55
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/adr/ADR-0005-remove-legacy-operator-integration.md`
- `src/domain/`, `src/ports/`, `src/application/`, `src/adapters/`, `src/infrastructure/bootstrap/`
- `src/renderer/` (shells, hooks, store, i18n, call UI)
- `docs/softphone/Feature-Registry.md`, `Legacy-Feature-Coverage.md`
- `.cursor/rules/`, `.cursor/skills/`, `.cursor/commands/`, `guides/`
- `docs/softphone/Implementation-Roadmap.md`, `Architecture-Constitution.md`, `UX-UI-Design-Blueprint.md`
- `docs/softphone/real-integration/PROGRESS.md`, `00-SNAPSHOT.md`, `env.local.example`

## Что
- Принят ADR-0005; legacy operator integration удалена из domain, ports, application, adapters, bootstrap
- `AccountBootstrapFacade` и bootstrap factories переведены на SIP-only (регистрация, звонки, recovery, settings, contacts/history)
- Удалены operator UI, campaign modal, projection stubs, operator i18n-ключи
- Финальная doc/rules cleanup: roadmap, constitution, UX blueprint, RAT docs, handoffs, Feature Registry F-010
- Удалены dead queue/campaign UI: `QueueInfoLabel`, `mapQueueLabelState`, queue badges, `queue.*` i18n
- Сохранены `PhoneStatus` (online/offline/dnd), SIP DND, SIP recovery, transfer, shell UX

## Зачем
Продукт — standalone SIP softphone; dormant operator-platform код и документация больше не нужны и мешали разработке.

## Результат
- `npm run typecheck` — OK
- `npm run lint` — OK
- `npm run i18n:check` — OK
- `npm run test` — 1473 passed, 1 skipped (296 files)
- Финальный `rg` по banned-токенам (`docs`, `.cursor`, `src`, `scripts`, `guides`, `work-history`) — **0 совпадений**
- Финальный `rg` по queue/campaign leftovers в `src` — **0 совпадений**
