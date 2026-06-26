# Main screen polish: no dev hints, no dividers

**Дата:** 2026-06-26 17:29
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/shells/call/CallContextShell.tsx`
- `src/renderer/App.module.css`
- `src/renderer/widgets/SoftphoneLayout/SoftphoneLayout.module.css`
- `src/renderer/shells/SoftphoneShellHeader.module.css`
- `src/renderer/components/status/StatusSelector.module.css`
- `src/renderer/components/call/DtmfKeypadPanel.module.css`
- `docs/softphone/UI-Architecture.md`

## Что
- Удалён dev-hint `sip-registered-hint` (mock gateway / P01-P02)
- Убраны разделители: border header, border controls zone, DTMF panel borders, рамка StatusSelector
- Уменьшены паддинги/gap на главном экране (App shell, layout zones, dialpad, controls)

## Зачем
Чистый операторский UI без диагностических подписей и лишних линий-разделителей.

## Результат
- lint green; затронутые тесты passed
