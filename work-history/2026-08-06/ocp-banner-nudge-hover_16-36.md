# OCP banner nudge and retry hover

**Дата:** 2026-08-06 16:36
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/integration/ocp/OcpConnectionBanner.module.css`
- `docs/softphone/UI-Design-System.md`

## Что
- Сдвиг баннера на +5px вправо (`translateX(calc(-50% + 5px))`) — отступ от аватара на dialpad
- Убран danger-fill hover у Retry; обычный `outline` hover
- Канон обновлён в UI-Design-System

## Зачем
- На dialpad chip прилипал к аватару; кнопка краснела при наведении

## Результат
- `OcpStatusChrome.test.tsx` PASS
