# CSS Modules: kebab-case + dot notation

**Дата:** 2026-07-04 19:12
**Статус:** выполнено
**Коммит:** `5699d23`

## Где
- `src/renderer/**/*.module.css` — 49 файлов, селекторы kebab-case
- `src/renderer/**/*.{ts,tsx}` — dot notation (`styles.rowPanel`)
- `electron.vite.config.ts` — `css.modules.localsConvention: "camelCase"`
- `eslint.config.js`, `.stylelintrc.json`, `.cursor/rules/css-modules.mdc`
- `scripts/refactor-css-modules.mjs`, `scripts/generate-css-module-types.mjs`
- `src/**/*.module.css.d.ts` — 49 сгенерированных типов

## Что
- Массовый рефакторинг: `.rowPanel` → `.row-panel`, `styles["rowPanel"]` → `styles.rowPanel`
- Модификаторы с `_` переведены в kebab (`state-indicator-positive`)
- Динамические классы через `Record` (StateIndicator, RegistrationStatusDot, UserHeaderIdentity)
- ESLint: `@typescript-eslint/dot-notation` + `no-restricted-syntax` для `styles`/`*Styles`
- Stylelint: `selector-class-pattern` для `*.module.css`
- Генератор типов `npm run css:types` для совместимости с `noPropertyAccessFromIndexSignature`
- Правило `.cursor/rules/css-modules.mdc` + секция в `ux-ui-electron-react.mdc`

## Зачем
Единый стиль CSS Modules: kebab-case в CSS, dot notation в TS; lint-контроль для будущих агентов.

## Результат
- `npm run test` — 1034 passed, 1 skipped
- `npm run lint` — ok (eslint + stylelint)
- `npm run typecheck` — ok
- Визуальное поведение не менялось (только имена классов + access pattern)
