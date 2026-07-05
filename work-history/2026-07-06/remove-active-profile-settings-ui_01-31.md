# Remove Active profile block from settings Account

**Дата:** 2026-07-06 01:31
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SettingsAccountPanel.tsx`
- `src/renderer/hooks/useSettingsAccountProfileShell.ts` (удалён)
- `src/application/projections/deriveSettingsAccountProfileShell.ts`
- i18n `settings.account.activeProfile*`

## Что
- Убран UI-блок «Активный профиль» из раздела Аккаунт
- Удалены prop `activeProfileIdentity`, hook, projection shell, CSS, i18n ключи (ru/en/fr/de)
- Сохранён `deriveActiveProfileSettingsSyncKey` для reload настроек после авторизации
- Обновлены тесты, stories, I18N-Coverage, Feature Registry, design doc

## Зачем
По запросу пользователя — профиль не должен отображаться отдельным блоком в настройках.

## Результат
- lint, i18n:check, settings tests: PASS
