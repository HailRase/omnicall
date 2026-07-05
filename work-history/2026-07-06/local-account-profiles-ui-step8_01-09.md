# F-023 Step 8 — Profile label in SettingsAccountPanel

**Дата:** 2026-07-06 01:09
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/formatSettingsAccountIdentityLabel.ts`
- `src/application/projections/deriveSettingsAccountProfileShell.ts`
- `src/application/projections/accountBootstrapProjection.ts` (`sipDomain`)
- `src/renderer/hooks/useSettingsAccountProfileShell.ts`
- `src/renderer/components/settings/panels/SettingsAccountPanel.tsx`
- `src/renderer/i18n/messages.ts` (`settings.account.activeProfile*`)
- `docs/softphone/Feature-Registry.md`, `docs/softphone/I18N-Coverage.md`

## Что
- Добавлен domain-helper `formatSettingsAccountIdentityLabel` (`username@domain`, без пароля).
- Projection расширен полем `sipDomain` из `SipCredentialsReceived`; shell `deriveSettingsAccountProfileShell` + hook `useSettingsAccountProfileShell`.
- В `SettingsAccountPanel` показывается блок активного профиля при `sip_registered` (`data-testid="settings-account-active-profile"`).
- i18n ключи `settings.account.activeProfileLabel` / `activeProfileValue` для ru, en, fr, de.
- Тесты компонента (ru + en), Storybook light/dark для зарегистрированного аккаунта.

## Зачем
- Step 8 F-023: оператор видит identity активного профиля в настройках без доступа к репозиторию/файлам из renderer.

## Результат
- `npm run test` — 1173 passed
- `npm run i18n:check` — passed
- `npm run registry:check` — passed
- `npm run lint` — pre-existing error в `src/preload/index.ts` (не Step 8)
- `npm run typecheck` — pre-existing error в `useSettingsActions.test.ts` (не Step 8)
