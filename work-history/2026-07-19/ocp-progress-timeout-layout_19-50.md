# OCP progress timeout fill + compact layout

**Дата:** 2026-07-19 19:50
**Статус:** выполнено
**Коммит:** `d3114b0`

## Где
- `deriveOcpSignInProgressView.ts` — latent failure → blue fill until timeout
- `OcpSignInProgress.tsx` / `.module.css` — row: progress+title | status+icon
- i18n timeout copy

## Что
- Ранний fail (нет сети) не красит бар сразу: синий fill до конца таймаута этапа, затем timeout
- Layout: слева название+Progress, справа статус («Ожидает»/…) и иконка на одной линии
- Компактнее модалка (`sm`), шрифты/отступы/бары
- Reconnect enable только после reveal failure

## Зачем
- Предсказуемый timeout UX и аккуратный compact UI без поломки dual FSM.

## Результат
- derive + OcpSignInProgress tests green
