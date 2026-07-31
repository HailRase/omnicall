# Unit-тесты SDK pending lifecycle

**Дата:** 2026-07-22 13:52
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/sdkGatewayPendingLifecycle.test.ts`
- `src/renderer/hooks/useSdkConnectCeremony.test.ts`
- `src/renderer/components/integration/SdkConnectCeremonyModal.test.tsx`
- `src/renderer/components/integration/SdkConnectCeremonyModal.stories.tsx`

## Что
- Добавлен focused suite для `DeferredSdkOriginTrustApprover` / `DeferredSdkPairingApprover` (cancelByOrigin, cancelExpired, denyByConnectionId, denyByOrigin, denyExpired)
- Обновлены тесты hook: обязательный `isOriginAllowed`, `onCancelWaiting` без deny, approve→deny при `!isOriginAllowed`
- Обновлены тесты modal: prop `onCancelWaiting` и кнопка cancel на waiting-шаге
- В stories добавлен `onCancelWaiting` (fixture-only, без production)

## Зачем
- Закрепить семантику cancel vs deny/blacklist и guard Origin на pairing ceremony без изменений production-кода.

## Результат
- `npm run test -- src/adapters/integration/sdkGatewayPendingLifecycle.test.ts src/renderer/hooks/useSdkConnectCeremony.test.ts src/renderer/components/integration/SdkConnectCeremonyModal.test.tsx` — 3 files / 14 tests passed
