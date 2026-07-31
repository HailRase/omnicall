# SDK broker ready после ложного reload

**Дата:** 2026-07-21 17:20
**Статус:** выполнено
**Коммит:** —

## Где
- `src/main/sdk/registerSdkBrokerIpc.ts`
- `src/main/sdk/sdkBrokerReloadPolicy.ts`
- `src/main/sdk/sdkBrokerReloadPolicy.test.ts`
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`

## Что
- Сброс broker ready только на main-frame document navigation (`did-start-navigation`), не на любой `did-start-loading`
- Политика вынесена в чистую функцию с unit-тестами
- Renderer повторно заявляет ready (macrotask / pageshow / visibility), пока composition активна
- Версия `package.json` не менялась (`0.12.0`)

## Зачем
- Устранить стабильный `not_ready` на product-командах при живом pairing/ping: ложные reload оставляли `compositionReady=false` без remount

## Результат
- `npx vitest run src/main/sdk/sdkBrokerReloadPolicy.test.ts src/adapters/integration/MainToRendererBroker.test.ts src/adapters/integration/RendererSdkBrokerSession.test.ts` — pass (19)
- `tsc --noEmit -p tsconfig.node.json` — без ошибок по затронутым файлам
- ADR-0009 сохранён: реальный document reload по-прежнему очищает ready до нового claim
