# I18N Coverage Matrix

## Coverage baseline

- Scope audited: all non-test/non-story UI-facing modules in `src/renderer/components/**`, `src/renderer/helpers/**`, `src/renderer/shells/**`, `src/renderer/hooks/**`, and `src/application/projections/**`.
- Supported locales: `ru`, `en`, `fr`, `de`.
- Result: user-visible copy migrated to catalog/runtime; projection layer migrated to semantic key-based outputs.

| Module / Area | Copy contract | Namespace(s) | Migration status | Verification |
| --- | --- | --- | --- | --- |
| `src/renderer/i18n/messages.ts`, `src/renderer/i18n/runtime.ts` | Typed catalog + runtime translation | `settings.*`, `updates.*`, `icons.*`, `common.*`, `header.*`, `call.*`, `transfer.*`, `incoming.*`, `outgoing.*`, `campaign.*`, `activeCall.*`, `status.*`, `session.*`, `recovery.*`, `sipRegistration.*`, `dialpad.*`, `queue.*` | migrated | `src/renderer/i18n/messages.test.ts`, `npm run i18n:check` |
| `src/domain/settings/*` (`SupportedLanguage`, validation, migration) | Language value object + schema validation | n/a (domain value) | migrated | `SupportedLanguage.test.ts`, `validateUserSettings.test.ts`, `migrateUserSettings.test.ts` |
| `src/application/projections/*` (UI-facing) | Semantic reason/label keys + params, no localized sentences | `call.line.status.*`, `multi.call.disabled.*`, `header.registration.*`, `header.phone.*`, `session.logout.disabled.*`, `transfer.failure.*`, `recovery.disabled.*`, `account.panel.*` | migrated | projection unit tests |
| `src/renderer/components/settings/*` and `src/renderer/components/settings/panels/*` | i18n-driven labels, aria, hints, placeholders | `settings.*` | migrated | settings component tests |
| `src/renderer/components/header/*` | i18n-driven header/menu labels and aria | `header.*`, `registration.*` | migrated | header/menu tests |
| `src/renderer/components/call/*` and `src/renderer/components/dialpad/*` | i18n-driven call controls/cards/transfer/dtmf copy | `call.*`, `transfer.*`, `incoming.*`, `outgoing.*`, `campaign.*`, `activeCall.*` | migrated | call/dialpad component tests |
| `src/renderer/components/recovery/*` | i18n-driven recovery overlay copy | `recovery.*`, `sipRegistration.*` | migrated | recovery component tests |
| `src/renderer/components/status/*` | i18n-driven operator status/logout/timer copy | `status.*` | migrated | status component tests |
| `src/renderer/components/session/*` | i18n-driven session logout confirmation copy | `session.*`, `common.*` | migrated | session component tests |
| `src/renderer/components/account/*` | i18n-driven account form/action copy | `account.*` | migrated | account panel tests |
| `src/renderer/helpers/*` (UI-text helpers) | reason/status mapping through i18n runtime | `dialpad.*`, `transfer.*`, `activeCall.*`, `status.*`, `campaign.*`, `queue.*`, `session.*`, `header.*` | migrated | helper unit tests |
| `src/renderer/shells/*` and UI-facing `src/renderer/hooks/*` | no hardcoded user copy, use translation keys/runtime | `shell.*`, `session.*`, feature namespaces above | migrated | shell/hook tests + `i18n:check` |

## Remaining gaps

- None in audited UI-facing module scope.

## Verification commands

- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run i18n:check`
- `npm run ui:catalog`
