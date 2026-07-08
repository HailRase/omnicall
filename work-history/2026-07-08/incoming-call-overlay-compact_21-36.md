# Incoming Call Overlay compact layout

**Дата:** 2026-07-08 21:36
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/IncomingCallOverlay.tsx`
- `src/renderer/components/call/IncomingCallOverlay.module.css`
- `src/renderer/styles/tokens.css`

## Что
- Убрана надпись «Входящий вызов» (eyebrow); автоответ — отдельная строка под именем
- Dismiss: absolute top-right, `translate(35%, -35%)`, стиль как Sonner close
- Accept/Reject: круглые icon-only кнопки 36px в одном ряду с именем звонящего
- Шрифт имени: `font-weight: 500` (`--font-weight-medium`) вместо semibold 600

## Зачем
Компактный баннер без лишнего текста, ближе к iOS notification / Sonner UX.

## Результат
- `IncomingCallOverlay.test.tsx` — 8/8 pass
