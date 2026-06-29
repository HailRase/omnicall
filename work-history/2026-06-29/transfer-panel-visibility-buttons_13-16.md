# Transfer panel: видимость при 2 вызовах и кнопки футера

**Дата:** 2026-06-29 13:16
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/transferPanelProjection.ts`
- `src/renderer/hooks/useTransferActions.ts`
- `src/renderer/components/call/TransferPanel.module.css`
- `src/application/projections/transferPanelProjection.test.ts`

## Что
- Убрано условие `multiLineCount > 1` — панель перевода больше не открывается при втором обычном исходящем
- Видимость по `transferModeActive`, `consultationCallId`, `attendedPhase` и фазам ошибки
- Кнопка «Отмена» компактнее (`flex: 0 1 auto`, меньший шрифт)
- «Завершить перевод» с `flex: 1 0 auto` и `white-space: nowrap` — текст не обрезается

## Зачем
- Второй исходящий не должен переключать UI в transfer flow; длинная подпись кнопки завершения должна помещаться.

## Результат
- Тесты transfer panel / visibility — ok
- `npm run lint` / `typecheck` — ok
