# Обновление сценариев профиля аккаунта

**Дата:** 2026-07-17 09:57
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/`
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/components/settings/panels/SettingsAccountPanel.tsx`
- `src/renderer/i18n/`

## Что
- Убрана кнопка «Повторить сервер» из формы Account.
- Скрыты переключатели сохранения у выбранных сохранённых профилей.
- Для сохранённого профиля показаны SIP/OCP-поля без повторного поля логина; API-ключ не предзаполняется.
- Убрано действие «Забыть сохранённый пароль».
- Добавлено подтверждение перезаписи данных при входе из нового профиля с уже существующей идентичностью.
- Отмена подтверждения продолжает авторизацию без изменения сохранённых секретов.
- Выбранный SIP-профиль сохраняет контекст при редактировании: пароль виден, а изменения требуют подтверждения перед перезаписью.
- Удалена кнопка и renderer-логика повторной SIP-регистрации из раздела Account.
- Обновлены локализации и целевые тесты Account.

## Зачем
- Сделать выбор сохранённого профиля предсказуемым и исключить лишний ввод уже выбранного логина.
- Предотвратить непреднамеренную перезапись сохранённых данных авторизации.

## Результат
- `npx vitest run src/renderer/components/account/AccountPanel.test.tsx src/renderer/components/settings/panels/SettingsAccountPanel.test.tsx src/renderer/hooks/useAccountActions.test.ts src/renderer/hooks/accountActionsHelpers.test.ts` — PASS (40 tests).
- `npm run typecheck && npm run i18n:check` — PASS.
- `npm run lint` — PASS.
- `npx vitest run src/renderer/hooks/useAccountActions.test.ts` — PASS (12 tests, после доработки выбранного профиля).
