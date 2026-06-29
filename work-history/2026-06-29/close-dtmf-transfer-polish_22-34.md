# Close button, DTMF layout, transfer footer

**Дата:** 2026-06-29 22:34
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/icons/iconOverlayDismiss.module.css`
- `src/renderer/components/dialpad/Dialpad.tsx`, `Dialpad.module.css`
- `src/renderer/components/call/DtmfKeypadPanel.tsx`, `DtmfKeypadPanel.module.css`
- `src/renderer/components/call/TransferPanel.tsx`, `TransferPanel.module.css`

## Что
- Общий стиль круглой кнопки X: без border, hover-фон (Dialpad, DTMF, Transfer)
- DTMF: заголовок «Тоновый набор (DTMF) {номер}» фиксирован; тоны в отдельном поле как у dialpad input
- DTMF: сетка клавиш и отступы как у «Набор номера»
- Transfer footer: «Отмена» width auto; при «Завершить перевод» — cancel сжимается, complete не обрезается

## Зачем
UX-полировка overlay-кнопок, DTMF parity с dialpad, корректная раскладка footer при двух кнопках.

## Результат
27 targeted tests passed; lint + typecheck ok.
