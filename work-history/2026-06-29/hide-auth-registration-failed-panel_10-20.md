# Скрыть панель «Ошибка регистрации» в AuthStateView

**Дата:** 2026-06-29 10:20
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/auth/AuthStateView.tsx`
- `docs/softphone/Feature-Registry.md` (F-016)

## Что
- Убран `AuthScreen` для `sip_registration_failed` — компонент возвращает `null`
- Обновлён acceptance F-016: нет context-панели при ошибке SIP-регистрации
- Индикация остаётся через `AvatarRecoveryRing` и `RegistrationStatusDot`

## Зачем
Убрать дублирующий блок «Ошибка регистрации» из context-зоны; recovery уже показывается на аватаре.

## Результат
- `npm run test` — 781 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
