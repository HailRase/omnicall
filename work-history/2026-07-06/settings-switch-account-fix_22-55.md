# Fix Switch thumb offset in Account settings

**Дата:** 2026-07-06 22:55
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/shell/BootstrapPanel.module.css`
- `src/renderer/components/ui/switch/Switch.module.css`
- `src/renderer/components/account/AccountPanel.tsx`

## Что
- Исключён `[role="switch"]` из глобальных `.panel button` стилей (padding ломал track)
- Thumb Switch переведён на absolute positioning внутри track
- Убран лишний `htmlFor` у label с вложенным Switch в AccountPanel

## Зачем
- Switch в секции «Аккаунт» наследовал padding от BootstrapPanel и thumb смещался.

## Результат
- Switch/account tests — 20 passed; `npm run lint:css` — ok
