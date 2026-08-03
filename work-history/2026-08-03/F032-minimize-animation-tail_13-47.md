# F-032 minimize animation tail fix

**Дата:** 2026-08-03 13:48
**Статус:** выполнено
**Коммит:** `1abfc00`

## Где
- `src/renderer/components/settings/external-applications/OnCallEndedChoiceCards.module.css`

## Что
- Minimize: убран mid-keyframe (хитч), `linear`, непрерывный shrink 10%→38%
- Короткий hold в taskbar, затем мягкий loop (окно/strip синхронно возвращаются)
- Убраны ease-хвосты у почти нулевой opacity

## Зачем
- Убрать оставшуюся небольшую «остановку» в анимации «Свернуть»

## Результат
- Ручная проверка hover/selected на карточке minimize
