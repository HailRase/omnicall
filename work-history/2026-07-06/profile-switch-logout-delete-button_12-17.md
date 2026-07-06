# Profile switch logout + delete button styling

**Дата:** 2026-07-06 12:17
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/components/account/SavedAccountProfileSelector.*`

## Что
- При смене профиля после подтверждения вызывается `EndUserSessionUseCase` (полный logout: звонки, media, unregister) перед авторизацией нового аккаунта
- Подавлен сброс формы на промежуточном unregistered во время switch (`suppressRegistrationEndResetRef`)
- Кнопка «Удалить»: красный фон, иконка `dial.delete`, белый текст и иконка
- Обновлены тесты facade и useAccountActions

## Зачем
Смена SIP-профиля должна эквивалентна выходу из текущей сессии с последующим входом; кнопка удаления — явное деструктивное действие.

## Результат
- `npm run typecheck` — PASS
- `npm run lint` — PASS
- vitest (33 теста по затронутым модулям) — PASS
