# DND disabled when SIP not registered

**Дата:** 2026-06-30 13:12
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/helpers/mapAvatarMenuDndDisabledReason.ts`
- `src/renderer/hooks/useUserAvatarMenuActions.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/components/header/UserAvatarMenu.test.tsx`

## Что
- Добавлен хелпер `mapAvatarMenuDndDisabledReason` с приоритетом: блокировка статуса → отсутствие регистрации
- В `useUserAvatarMenuActions` передаётся `isSipRegistered` из `deriveAuthShellFlags`
- Кнопка DND в меню аватара блокируется с подсказкой «Не зарегистрирован»
- `usePhoneStatusActions` получает `disabled` при любой причине блокировки DND
- Unit-тесты для хелпера и презентационного компонента

## Зачем
Переключатель «Не беспокоить» не должен быть доступен до успешной SIP-регистрации.

## Результат
- `npx vitest run` по затронутым файлам: 9 passed
- `npm run typecheck`: OK
- `npm run lint`: 6 ошибок в несвязанных файлах (pre-existing)
- Полный `npm run test`: 2 падения в `CallSessionCard.test.tsx` (pre-existing, не связано)
