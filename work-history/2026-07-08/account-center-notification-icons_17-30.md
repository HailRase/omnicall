# Центрирование входа по сохранённому паролю и насыщенные иконки уведомлений

**Дата:** 2026-07-08 17:30
**Статус:** выполнено
**Коммит:** `995fbd3`

## Где
- `src/renderer/components/settings/panels/SettingsAccountPanel.tsx`
- `src/renderer/components/settings/panels/SettingsAccountPanel.module.css`
- `src/renderer/components/settings/panels/SettingsAccountPanel.test.tsx`
- `src/renderer/components/notifications/NotificationToast.module.css`

## Что
- Добавлен режим `rememberedPasswordSignInOnly` для экрана «Войти» + «Забыть сохранённый пароль» в настройках аккаунта
- Контейнер формы центрируется по вертикали и горизонтали только в этом режиме
- Добавлен `data-testid="settings-account-form-remembered-sign-in"` для тестов
- Иконки success/error в toast используют `--color-status-online` и `--color-status-failed`
- Обновлены тесты SettingsAccountPanel

## Зачем
Улучшить UX экрана быстрого входа по сохранённому паролю и сделать статусные иконки уведомлений более контрастными.

## Результат
- `SettingsAccountPanel.test.tsx`: 12 passed
- `npm run lint`, `npm run typecheck`: OK
- Полный `npm run test`: 1538 passed (1 skipped), pre-existing unhandled Sonner teardown в NotificationViewport
