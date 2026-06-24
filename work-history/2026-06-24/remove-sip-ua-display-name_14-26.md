# Remove SIP display name from UA config

**Дата:** 2026-06-24 14:26
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/telephony/SipAccount.ts`
- `src/adapters/telephony/jssip/createJsSipUserAgent.ts`
- `src/renderer/components/account/AccountPanel.tsx`, `readSipEnvDefaults.ts`
- `src/adapters/mock/MockOperatorPlatformGateway.ts`, тесты bootstrap/SIP

## Что
- Удалены `displayName` из `SipAccount` / `SipAccountInput` и `display_name` из JsSIP UA config
- Убрано поле Display name в AccountPanel и `VITE_SIP_DISPLAY_NAME` из env example/types
- Обновлены mock OCP credentials и тесты

## Зачем
Не передавать display name в SIP UA registration/config.

## Результат
533 tests passed; typecheck green. Incoming caller display name (remote party) не затронут.
