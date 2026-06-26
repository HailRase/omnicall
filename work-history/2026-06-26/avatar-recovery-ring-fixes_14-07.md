# Avatar recovery ring fixes

**Дата:** 2026-06-26 14:07
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/header/AvatarRecoveryRing.tsx`
- `src/application/projections/deriveConnectionRecoveryShell.ts`
- `src/application/projections/deriveHeaderChromeShell.ts`
- `src/renderer/hooks/useHeaderChromeShell.ts`

## Что
- Таймер перенесён справа от аватара (flex row), не перекрывает аватар
- `sip_registration_failed` → кольцо на аватаре, без ConnectionOverlay (overlay только для transport disconnect)
- Красная обводка (`tone: failed`) при ошибке регистрации
- Точка: серый idle при старте, красный при disconnect/failed, жёлтый при pending retry
- Восстановлен серый `not_registered` на старте

## Зачем
Исправить UX-регрессии первой версии avatar recovery ring.

## Результат
747 passed, lint + typecheck + ui:catalog — OK.
