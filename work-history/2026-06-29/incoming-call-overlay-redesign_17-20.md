# Incoming call overlay redesign

**Дата:** 2026-06-29 17:20
**Статус:** выполнено
**Коммит:** `1ca2b34`

## Где
- `src/renderer/components/call/IncomingCallOverlay.tsx`
- `src/renderer/components/call/IncomingCallOverlay.module.css`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `docs/softphone/P03-Incoming-Call-UX-Design.md`

## Что
- Добавлен `IncomingCallOverlay` по reference из design-repo: баннер под header, пульсирующая иконка, бейджи очереди/кампании, прогресс автоответа
- Кнопки «Ответить» / «Отклонить» без выбора причины отклонения
- Удалены `IncomingCallModal`, `IncomingCallActions`, `CallerIdentityBlock`, `AutoAnswerCountdown`
- Входящий вызов перенесён из overlay-layer в header zone (`SoftphoneReadyShell`)
- Обновлены F-002 docs: Feature Registry, Legacy Coverage, UI-Architecture, Icon-Registry, UI catalog
- Storybook + 6 component tests

## Зачем
Привести UX входящего вызова к design parity (`softphone-electron-design`) с упрощённым отклонением без причин.

## Результат
`npm run test` — 813 passed, 1 skipped; `lint`, `typecheck`, `ui:catalog` — OK.
