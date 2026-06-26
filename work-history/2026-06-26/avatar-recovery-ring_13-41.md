# Avatar recovery ring (SIP re-registration)

**Дата:** 2026-06-26 13:41
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/deriveConnectionRecoveryShell.ts`
- `src/renderer/components/header/AvatarRecoveryRing.tsx`
- `src/renderer/shells/SoftphoneShellHeader.tsx`
- `src/renderer/components/header/RegistrationStatusDot.module.css`

## Что
- Полноэкранный blocking overlay скрыт при SIP-перерегистрации (`showAvatarRecoveryRing`)
- Компактное кольцо с таймером вокруг аватара, плавные переходы, без подписей и попыток
- Пульсация кольца при перерегистрации без обратного отсчёта
- Красный индикатор для `not_registered` на точке статуса
- Тесты: `AvatarRecoveryRing.test.tsx`, обновлены shell/projection tests; Storybook story

## Зачем
Заменить громоздкую модалку перерегистрации минималистичным индикатором на аватаре.

## Результат
`npm run test` — 734 passed, 1 skipped; lint + typecheck + ui:catalog — OK.
