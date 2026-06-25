# T-001 Icon Tooltips (F-016)

**Дата:** 2026-06-25 21:07
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/icons/IconTooltip.tsx`, `IconControlButton.tsx`, `iconTooltipDelay.ts`
- Все icon-only контролы renderer (shell, call, dialpad, operator, modals, recovery, transfer, toasts)
- `docs/softphone/Icon-Registry.md`, `Icon-Agent-Guide.md`, `handoffs/P11-Icon-Tooltips-Agent-Prompt.md`

## Что
- `IconTooltip`: задержка 1000ms, `role="tooltip"`, hide on pointer leave
- `prefers-reduced-motion: reduce` → мгновенный показ; `prefers-reduced-transparency` → solid tooltip
- `IconControlButton`: AppIcon + tooltip из catalog / disabledReason
- `resolveIconTooltipLabel` в iconCatalog
- Тесты: `IconTooltip.test.tsx` (fake timers)
- TASK-QUEUE T-001 → `done`

## Зачем
Визуальные подписи для icon-only UI без нарушения a11y (`aria-label` сохранены).

## Результат
- `npm run test` — 697 passed, 1 skipped
- `npm run lint` / `typecheck` / `ui:catalog` — green
