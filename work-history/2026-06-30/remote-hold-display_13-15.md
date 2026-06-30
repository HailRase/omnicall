# Отображение удалённого удержания на карточках звонка

**Дата:** 2026-06-30 13:15
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/telephony/events/callEvents.ts` — `CallRemoteHeld` / `CallRemoteResumed`
- `src/application/projections/multiLineCallProjection.ts`, `deriveCallLinesShell.ts`
- `src/application/services/CallEngine.ts`, `AccountBootstrapFacade.ts`
- `src/ports/telephony/TelephonyGateway.ts`, mock + JsSIP adapters
- `src/renderer/components/call/CallSessionCard.tsx`

## Что
- Доменные события и флаг `isRemoteHold` в multi-line projection
- Порт `setRemoteHoldHandler` / `setRemoteResumeHandler`; JsSIP слушает `hold`/`unhold` с `originator: remote`
- View-model: `showLocalHoldBadge`, `showRemoteHoldBadge`; статус «На линии» / «На удержании» без подмены при remote hold
- UI: бейдж «Удержание (удал.)» без held-стилей; при двойном hold — оба бейджа

## Зачем
- Оператор должен видеть, что собеседник поставил его на удержание, без путаницы с локальным hold.

## Результат
- `npm run test` — 910 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
