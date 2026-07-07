# Interface Internationalization Architecture

## Supported languages

- `ru` (default, migration baseline)
- `en` (international locale)
- `fr` (international locale)
- `de` (international locale)
- `bg` (international locale)

## Ownership and boundaries

- Domain emits technical reasons/events only; no localized sentences.
- Application projections expose semantic message keys + params when state-driven messages are needed.
- Renderer resolves user-visible copy (labels, aria, hints, banners, tooltips, placeholders).
- Language is persisted in `UserSettings` v2 (`language`) per `SettingsAccountKey`.

## Translation resources

- Catalog source: `src/renderer/i18n/messages.ts`.
- Runtime API: `src/renderer/i18n/runtime.ts` (`useI18n`, `setRendererLanguage`, typed `translate*`).
- Allowed hardcoded copy: i18n catalog files, tests, stories, approved fixtures only.

## Current coverage status

- Renderer UI-facing modules (`components`, `helpers`, `shells`, UI-facing `hooks`) are migrated to i18n runtime.
- UI-facing Application projections expose semantic keys/params instead of localized sentences.
- Coverage matrix with full module list is maintained in `docs/softphone/I18N-Coverage.md`.

## Verification

- `npm run typecheck`
- `npm run test -- src/renderer/i18n/messages.test.ts`
- `npm run i18n:check`
- `npm run lint`
