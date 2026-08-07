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

## Language switch invariants (F-021)

- `Settings → General` writes `UserSettings.language` via `useSettingsActions.onLanguageChange`.
- Runtime applies immediately (`setRendererLanguage`) and updates local settings state optimistically before persist completes.
- `useNotifications.notify` identity must stay stable across language / `resolveTitle` changes (refs), so Settings integration hooks do not re-bootstrap.
- Integration panel bootstrap (`useSdkSettingsPanel`, etc.) must not apply a full `UserSettings` snapshot on mount; full projection refresh is reserved for intentional saves/imports.
- Gateway origin mirror-save must re-read latest `UserSettings` before write so concurrent language/theme edits are not overwritten.

## Verification

- `npm run typecheck`
- `npm run test -- src/renderer/i18n/messages.test.ts`
- `npm run test -- src/renderer/hooks/useSettingsActions.test.ts src/renderer/hooks/useSdkSettingsPanel.test.ts src/renderer/hooks/useNotifications.test.ts`
- `npm run i18n:check`
- `npm run lint`
