# CSS Modules tokens foundation

**Дата:** 2026-06-25 15:54
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/styles/tokens.css`, `globals.css`, `README.md`
- `UserAvatar.module.css`, `RegistrationStatusDot.module.css`
- `docs/softphone/P11-CSS-Modules-Tokens-Migration.md`
- `docs/softphone/handoffs/P11-WU5-CSS-Modules-Tokens-Agent-Prompt.md`
- `.cursor/rules/ux-ui-electron-react.mdc`, `UI-Design-System.md`, `UI-Architecture.md`

## Что
- Введены semantic design tokens и globals entry
- `styles.css` переведён на `var(--*)`; удалены global rules для avatar/dot
- Пилотная миграция `UserAvatar` и `RegistrationStatusDot` на CSS Modules
- Agent prompt WU5 + migration guide; правило в ux-ui cursor rule

## Зачем
Зафиксировать UI-4 foundation и обязать агентов мигрировать UI на CSS Modules + tokens инкрементально.

## Результат
694 tests passed; lint и typecheck OK.
