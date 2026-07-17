# Секреты сохранённого профиля

**Дата:** 2026-07-17 13:36
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/components/account/`

## Что
- Добавлен узкий boundary-call загрузки SIP password и OCP API key.
- Секреты загружаются только в локальное состояние выбранной формы.
- Полный профиль выполняет вход одной кнопкой без ложного overwrite.
- Поля остаются замаскированными существующими password controls.
- Подключено действие удаления сохранённого SIP password.

## Зачем
Дать пользователю прозрачный вход из сохранённого профиля без повторного ввода и без утечки секретов в projections.

## Результат
Focused facade/hook/component matrix пройдена; `npm run typecheck` — успешно.
