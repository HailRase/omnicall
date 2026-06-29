# Control bar: silent disabled, только hangup при соединении

**Дата:** 2026-06-29 12:55
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/CallControlsBar.tsx`
- `src/application/projections/activeCallControlsProjection.ts`

## Что
- Убраны подписи причин под кнопками (`.reason`)
- При Connecting/Ringing: disabled mute, hold, transfer, dial; enabled только hangup
- Mute снова disabled в projection для Connecting

## Зачем
Визуально чище: кнопки видны, недоступные просто приглушены без текстовых пояснений.

## Результат
Тесты CallControlsBar + activeCallControlsProjection — OK
