# Повторное применение mute после remote unhold

**Дата:** 2026-06-30 14:14
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/mediaCallControlOperations.ts` — `reapplyMutedMediaStateIfNeeded`
- `src/application/services/CallEngine.ts` — `handleRemoteResume`, `handlePeerConnectionAvailable`
- `src/application/facades/AccountBootstrapFacade.ts`

## Что
- После `CallRemoteResumed` повторно вызывается `mediaGateway.muteCall`, если звонок muted в domain
- То же при обновлении peer connection на активном звонке
- Тесты: `CallEngine.remoteHold.test.ts`, `BrowserMediaAdapter.test.ts`

## Зачем
- JsSIP при remote unhold включает локальный audio track; UI оставался «микрофон выкл», но собеседник слышал оператора.

## Результат
- `npm run test` (целевые) — ok
- `npm run lint` — ok
- `npm run typecheck` — ok
