# F-032 window geometry orchestration (Agents 1–4)

**Дата:** 2026-08-03 15:28
**Статус:** выполнено
**Коммит:** —

## Где
- Domain/IPC/Main: `ExternalApplicationsSettings`, parse, `OpenExternalApplicationWindowContract`, `registerExternalApplicationWindowIpc`, `clampExternalApplicationWindowBounds`
- UI: `WindowGeometryEditor*`, `WindowGeometryPreview*`, `WindowGeometryOverlays*`, `ExternalApplicationsGeneralTab`
- Docs: Feature Registry F-032, P14, ADR-0024, I18N-Coverage, UI Catalog, STATUS

## Что
- Запущены 4 субагента `cursor-grok-4.5-high-fast` по мастер-промптам
- Agent 1: persist + open path `window.x/y`
- Agent 2: presets + 1:10 preview + drag/keyboard position
- Agent 3: session-only multi-app overlays
- Agent 4: preflight (i18n/tests/lint/tsc), a11y fix, docs sync

## Зачем
- Полный UX геометрии screen-pop окон по запросу пользователя (размер, позиция, наложение)

## Результат
- Цепочка агентов завершена; targeted preflight зелёный (по отчёту Agent 4: 63 теста, i18n/lint/tsc)
- Work-history агентов: `F-032-window-xy-open-path_15-15`, `F032-window-geometry-editor_15-21`, `F032-geometry-overlays_15-24`, `F032-geometry-preflight_15-27`
