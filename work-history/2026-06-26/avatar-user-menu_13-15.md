# Avatar user menu (LF-086)

**Дата:** 2026-06-26 13:15
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/header/UserAvatarMenu.tsx`
- `src/renderer/components/header/UserAvatar.tsx`
- `src/renderer/hooks/useUserAvatarMenu.ts`
- `src/renderer/hooks/useUserAvatarMenuActions.ts`
- `src/renderer/helpers/computeAnchoredMenuPosition.ts`
- `src/renderer/shells/SoftphoneShellHeader.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/components/icons/iconCatalog.ts`
- `docs/softphone/Icon-Registry.md`, `Feature-Registry.md`, `UI-Component-Catalog.md`

## Что
- Удалён `PhoneStatusBadge` из header layout (`SoftphoneReadyShell`)
- По клику на аватар открывается меню с авто-позиционированием (flip/clamp)
- Пункты: Настройки, переключатель DND (оранжевый при активном), разделитель, Выход (красный)
- Добавлены иконки `phone.dnd.on` / `phone.dnd.off` (Bell / BellOff)
- Тесты: `UserAvatarMenu`, `computeAnchoredMenuPosition`, обновлён `SoftphoneShellHeader`

## Зачем
Перенести статус телефона и глобальные действия из панели header в компактное меню аватара (F-016 / LF-086).

## Результат
`npm run test` — 718 passed, 1 skipped; `lint`, `typecheck`, `ui:catalog` — OK.
