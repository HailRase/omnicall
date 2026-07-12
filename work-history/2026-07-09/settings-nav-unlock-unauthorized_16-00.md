# Settings nav unlock for unauthenticated users

**Дата:** 2026-07-09 16:00
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useOverlayShell.ts`
- `src/renderer/components/settings/SettingsSidebar.tsx`
- `src/application/projections/settings/deriveDefaultSettingsSection.ts`
- `docs/softphone/Feature-Registry.md`

## Что
- Удалён guard: редирект с locked-секций на account и блокировка `setSettingsSection` без SIP
- Убрана блокировка пунктов sidebar через `deriveSettingsSectionDisabledReason` (projection удалена)
- Сохранён только initial tab: `deriveDefaultSettingsSection` → account / general при открытии без явной секции
- Canonical `#/settings` по-прежнему редиректит на account без регистрации
- Обновлены тесты `useOverlayShell`, `SettingsSidebar`; Feature Registry

## Зачем
Пользователь без авторизации должен свободно переходить по разделам настроек; начальная вкладка — только при первом открытии.

## Результат
- `npm run test` — passed (697+)
- `npm run lint` — pre-existing error в `TruncatedTextLine.test.tsx`
- `npm run typecheck` — pre-existing error в `useIncomingCallOverlayActions.test.ts`

## Дополнение (16:08)
- Исправлен баг: клик «Общее» вёл на canonical `/settings`, эффект снова редиректил на account
- `shellRouteToPath`: явный `section: "general"` → `/settings/general`; canonical `/settings` только без section
