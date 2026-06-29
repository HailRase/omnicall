# Transfer footer button width

**Дата:** 2026-06-29 22:45
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/TransferPanel.module.css`
- `src/renderer/components/call/TransferPanel.test.tsx`

## Что
- Кнопки footer: `width: max-content`, увеличен padding и font-size
- Dual mode: complete не сжимается, cancel с ellipsis при нехватке места
- Тест на пару кнопок при активной консультации

## Зачем
Кнопки «Отмена» и «Завершить перевод» должны расширяться по тексту, а не оставаться узкими.

## Результат
TransferPanel tests — ok.
