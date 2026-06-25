# P11 WU5 Slice G + Icons Foundation

**Дата:** 2026-06-25 16:56
**Статус:** выполнено
**Коммит:** —

## Где
- Slice G: `App.module.css`, `SoftphoneLayout.module.css`, `ShellChromeText.module.css`, `CallLinesShell.module.css`, `CallContextShell.module.css`
- Icons: `src/renderer/components/icons/`, `docs/softphone/Icon-Registry.md`, `Icon-Agent-Guide.md`
- Agent: `.cursor/rules/icons.mdc`, `.cursor/skills/icons/SKILL.md`
- Deferred: `handoffs/P11-Icon-Tooltips-Agent-Prompt.md`

## Что
- Мигрирован layout shell на CSS Modules (App, SoftphoneLayout, call context/lines, shared hint/error)
- `styles.css` сокращён до auth panels + focus-visible (~65 строк)
- Установлены `lucide-react`, `lucide-animated`, `motion`
- Добавлены `AppIcon`, `iconCatalog.ts` (18 semantic ids, status planned)
- Созданы registry, agent guide, rule, skill; tooltips вынесены в отдельный prompt

## Зачем
Продолжение UI-4 (Slice G) + единая инфраструктура иконок для агентов без визуального редизайна.

## Результат
- `npm run test` — 694 passed, 1 skipped
- `npm run lint` / `typecheck` / `ui:catalog` — OK (42 components)
