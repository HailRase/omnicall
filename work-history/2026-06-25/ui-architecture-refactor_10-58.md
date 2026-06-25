# UI Architecture refactor

**Дата:** 2026-06-25 10:58
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/UI-Architecture.md`
- `src/renderer/shells/`
- `src/renderer/hooks/useAccountActions.ts`, `usePhoneStatusActions.ts`
- `src/application/projections/deriveOperatorControlDisabledReason.ts`, `deriveAuthShellFlags.ts`, `deriveActiveCallControlsShell.ts`
- `eslint.config.js`, `.cursor/rules/ux-ui-electron-react.mdc`

## Что
- Добавлен канонический гайд `UI-Architecture.md`; ссылки в README, Constitution, rules, skills
- `App.tsx` утоньшен (~90 строк); feature wiring вынесен в shells
- `AccountPanel` сделан presentational; facade убран из компонента
- Domain-логика (`getAllowedAgentStatusTransitions`) перенесена в Application
- ESLint запрещает `@domain` импорты в renderer
- `rejectReasons` для incoming call берутся из projection, не хардкод

## Зачем
Закрепить «тупой UI» и модульность renderer без регрессии telephony flows.

## Результат
- `npm run test` — 625 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
