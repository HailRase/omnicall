# P11 UI foundation docs and tooling

**Дата:** 2026-06-25 13:44
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/UI-Architecture.md`, `UI-Design-System.md`, `UI-Component-Catalog.md`
- `docs/softphone/handoffs/P11-WU0-Shell-Layout-Agent-Prompt.md`
- `docs/softphone/real-integration/UI-SMOKE-ENABLERS.md`
- `scripts/generate-ui-catalog.mjs`, `.storybook/`
- `package.json` (radix, framer-motion, clsx, storybook)
- `eslint.config.js` (component import guards)
- RAT: `PROGRESS.md`, `MASTER-AGENT-PROMPT.md`, `SMOKE-CHECKLIST.md`, Feature Registry F-016

## Что
- Зафиксирован UI стек: CSS Modules path, Radix Dialog (incoming/campaign), framer-motion, overlay navigation
- FSD mapping без entities/; settings через facade+port без Use Case
- Установлены зависимости и Storybook 8; скрипт `ui:catalog`
- Обновлены RAT/roadmap/registry под P11 WU0 и F-008 next

## Зачем
Подготовка к реализации shell layout и settings без production-кода в этой сессии.

## Результат
- `npm run lint` OK; `npm run test` 640 passed, 1 skipped
- `npm run ui:catalog` — 34 components indexed
- Production renderer код не менялся
