# F-032: условия, история, поведение окна

**Дата:** 2026-07-31 17:02
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/integration/external-applications/`
- `src/application/services/integration/external-applications/`
- `src/main/externalApplications/`, `src/ports/integration/`, adapters journal/window
- `src/renderer/components/settings/external-applications/`, `useExternalApplicationsPanel.ts`
- `docs/softphone/P14-External-Applications-Design.md`, Feature-Registry, STATUS, ADR-0024, I18N

## Что
- Schema **v15**: app-level `conditions` + `windowBehavior` с inert defaults (v14 → без изменения поведения)
- Условия: направление, нужен номер, очередь; fail-closed; Open now без условий
- История открытий (journal cap 100) + пункт «История» в сайдбаре
- Lifecycle окна: raise / always-on-top / leave|minimize|close после звонка (до terminal opens)
- i18n ru/en/fr/de/bg, тесты, docs sync

## Зачем
- Сделать screen-pop полезным: меньше спама окон, понятная отладка, окно живёт со звонком

## Результат
- `typecheck` PASS · targeted vitest PASS · `i18n:check` PASS · `registry:check` 80/0 · eslint touched files PASS
- SemVer MINOR для F-032 extensions — pending `/release`
