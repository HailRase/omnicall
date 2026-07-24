# Bootstrap splash (macOS-like)

**Дата:** 2026-07-24 17:29
**Статус:** выполнено
**Коммит:** `24bbf21`

## Где
- `src/renderer/shells/BootstrapSplashShell.tsx` (+ css/test/stories)
- `src/renderer/App.tsx`, `src/renderer/main.tsx`, `src/renderer/index.html`
- `src/main/index.ts`, `src/shared/platform/startupSplashColors.ts`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`, `locales/bg-strings.json`
- Docs: Feature-Registry F-016/LF-002, Legacy-Feature-Coverage, UI-Architecture, UX-UI-Design-Blueprint, I18N-Coverage, STATUS, CHANGELOG, UI-Component-Catalog

## Что
- Presentational branded boot/error splash instead of plain «Загрузка приложения…»
- Pre-React `#boot-splash` + `BrowserWindow.backgroundColor` to avoid white flash
- Shared splash colors synced with `--color-bg-app`; provisional `data-theme` from OS
- i18n key `bootstrap.brand`; tests + Storybook light/dark; docs synced
- Bootstrap/`initialize` gate unchanged (no SIP/facade in splash)

## Зачем
- Закрыть UX gap `booting` / LF-002 красивым macOS-like запуском без костылей и без даунгрейда поведения.

## Результат
- `vitest` BootstrapSplashShell PASS (2)
- `i18n:check` PASS; `ui:catalog` updated; eslint/stylelint на touched splash files PASS
- Full-repo `tsc` — pre-existing unrelated errors remain (не из этого среза)
