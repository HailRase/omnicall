# Enable authorize on profile switch while registered

**Дата:** 2026-07-06 12:25
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/deriveAccountPanelActionsShell.ts`
- `src/application/projections/resolveAccountAuthorizeTargetIdentity.ts`
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/hooks/useAccountPanelShell.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`

## Что
- Кнопка «Войти» больше не блокируется сообщением «Вы уже в сети», если выбран другой профиль (`profileSwitchAllowed`)
- Добавлена проекция `resolveAccountAuthorizeTargetIdentity` для целевой SIP-идентичности
- `useAccountPanelShell` получает `profileSwitchAllowed` из `useAccountActions`

## Зачем
При смене сохранённого профиля во время активной сессии пользователь должен иметь возможность нажать «Войти» и пройти подтверждение смены профиля.

## Результат
- `npm run typecheck` — PASS
- `npm run lint` — PASS
- vitest (16 тестов) — PASS
