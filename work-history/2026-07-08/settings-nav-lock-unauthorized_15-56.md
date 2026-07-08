# Settings nav lock for guests

**Дата:** 2026-07-08 15:56
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/settings/deriveSettingsSectionDisabledReason.ts`
- `src/renderer/components/settings/SettingsSidebar.tsx`
- `src/renderer/hooks/useOverlayShell.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`

## Что
- Projection `deriveSettingsSectionDisabledReason`: все секции кроме account disabled без SIP
- Sidebar: disabled + tooltip `settings.nav.disabled.authorizeFirst`
- Route guard: `#/settings/*` (кроме account) редиректит на account; diagnostics shortcut тоже
- i18n для 5 локалей, тесты projection/sidebar/overlay shell

## Зачем
Неавторизованный пользователь должен работать только с вкладкой «Аккаунт» в настройках.

## Результат
20 targeted tests passed; typecheck + i18n:check — green.
