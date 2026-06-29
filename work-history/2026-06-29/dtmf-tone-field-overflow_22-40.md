# DTMF tone field overflow fix

**Дата:** 2026-06-29 22:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/DtmfKeypadPanel.tsx`
- `src/renderer/components/call/DtmfKeypadPanel.module.css`
- `src/renderer/components/call/DtmfKeypadPanel.test.tsx`

## Что
- Поле тонов: `span` → `readOnly input` (как dialpad)
- `min-width: 0` + `overflow: hidden` на inputRow — длинная строка не раздувает layout

## Зачем
При длинном вводе DTMF текст не смещал поле вправо за границы панели.

## Результат
DtmfKeypadPanel tests — ok.
