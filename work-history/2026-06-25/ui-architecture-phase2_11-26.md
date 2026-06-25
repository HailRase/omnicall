# UI Architecture phase 2

**Дата:** 2026-06-25 11:26
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useSoftphoneProjections.ts`, `useSoftphoneShellChrome.ts`
- `src/renderer/shells/RecoveryFeatureShell.tsx`, `SessionFeatureShell.tsx`
- `src/renderer/bootstrap/createRendererComposition.ts`
- `src/renderer/helpers/mapActiveCallControlLabels.ts`
- `docs/softphone/UI-Architecture.md`

## Что
- Централизованы store selectors в `useSoftphoneProjections`
- `App` упрощён через `useSoftphoneShellChrome` (единый logout hook для header и modal)
- Feature shells (`Call`, `Operator`, `Recovery`, `Session`) берут projections сами
- Mapping active-call labels вынесен в helpers
- Composition root в `createRendererComposition`
- `pickSessionLogoutProjectionInput` в Application layer
- `useDialpadShell` использует `deriveAuthShellFlags`

## Зачем
Продолжение dumb-UI рефакторинга без регрессии: модульность shells, меньше prop-drilling, единые derive-источники.

## Результат
- `npm run test` — 628 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
