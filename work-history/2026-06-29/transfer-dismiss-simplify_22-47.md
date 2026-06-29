# Transfer panel — убрать дубли отмены

**Дата:** 2026-06-29 22:47
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/TransferPanel.tsx`
- `src/renderer/components/call/TransferPanel.module.css`
- `src/renderer/components/call/TransferPanel.test.tsx`
- `docs/softphone/UI-Component-Catalog.md`

## Что
- Удалена `transfer-footer-cancel` — дублировала крестик
- Крестик: «Отменить перевод» / «Закрыть» при ошибке (единственный dismiss)
- Footer только при готовой консультации — «Завершить перевод» на всю ширину

## Зачем
Убрать путаницу между «Отмена», «Закрыть» и крестиком; исправить узкие кнопки footer.

## Результат
14 TransferPanel tests; ui:catalog; lint — ok.
