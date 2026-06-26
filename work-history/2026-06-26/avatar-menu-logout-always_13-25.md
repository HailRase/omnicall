# Avatar menu logout always visible

**Дата:** 2026-06-26 13:25
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/header/UserAvatarMenu.tsx`
- `src/renderer/hooks/useUserAvatarMenuActions.ts`
- `src/renderer/helpers/mapAvatarMenuLogoutDisabledReason.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`

## Что
- Пункт «Выход» всегда отображается в меню аватара (убран `showLogoutItem`)
- При недоступном выходе кнопка disabled с русской причиной (`mapAvatarMenuLogoutDisabledReason`)
- Добавлены тесты helper и обновлён `UserAvatarMenu.test.tsx`

## Зачем
Пользователь не видел «Выход» — пункт скрывался до `sip_registered`.

## Результат
Targeted tests + lint + typecheck — OK.
