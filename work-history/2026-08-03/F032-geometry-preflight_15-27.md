# F-032 Geometry Feature — Docs Sync + Preflight

**Дата:** 2026-08-03 15:27
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-applications/WindowGeometry*`
- `src/main/externalApplications/clampExternalApplicationWindowBounds.ts`
- `docs/softphone/Feature-Registry.md` (F-032)
- `docs/softphone/P14-External-Applications-Design.md`
- `docs/softphone/adr/ADR-0024-external-applications-screen-pop-windows.md`
- `docs/softphone/STATUS.md`, `I18N-Coverage.md`, `UI-Component-Catalog.md`

## Что
- Прогнан preflight: `i18n:check`, targeted vitest (63), eslint/stylelint geometry paths, `tsc` web/node — green
- Подтверждены: General geometry только для `electron_window`, overlays session-only, open path передаёт x/y + workArea clamp
- Исправлен a11y: remove-кнопка overlay-card больше не внутри `aria-hidden`
- Синхронизированы AC/evidence F-032, P14, ADR-0024, STATUS, UI catalog; убраны комментарии «Agent-3»

## Зачем
- Закрыть Agent 4/4: верификация поверхности geometry Agents 1–3, устранение найденных дефектов и выравнивание документации с кодом

## Результат
- Preflight зелёный; docs aligned; residual risk — preview на primary `screen.avail*` без multi-monitor IPC (осознанно out of scope)
- Команды: `npm run i18n:check` ✓; vitest geometry suite 63/63 ✓; eslint/stylelint/tsc ✓
