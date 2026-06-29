# Исправление hover кнопок controls bar и multisession hangup

**Дата:** 2026-06-29 16:57
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/CallControlsBar.module.css`
- `src/renderer/components/call/CallSessionStack.module.css`

## Что
- Ограничен базовый `:hover` нейтральными кнопками — variant-кнопки (mute/danger/resume) больше не получают светлый фон при наведении
- Mute-off и hangup в controls bar: hover через `filter: brightness`, фон и border зафиксированы на semantic danger/online токенах
- Mute-off: фон `--color-status-failed` вместо светлого `--color-bg-danger` для контраста иконки
- Multisession hangup: квадрат 2.25×2.25rem, `align-items: center` в строке, красный danger-стиль как в controls bar

## Зачем
Устранить невидимые белые иконки на светлом фоне при hover и привести кнопки сброса в multi-session к квадратной форме с корректным danger-цветом.

## Результат
- `npm run test` — 815 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
