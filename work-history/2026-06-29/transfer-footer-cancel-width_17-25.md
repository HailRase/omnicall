# Transfer panel footer cancel width

**Дата:** 2026-06-29 17:25
**Статус:** выполнено
**Коммит:** `5d1e1be`

## Где
- `src/renderer/components/call/TransferPanel.module.css`

## Что
- Для `.footerCancel` добавлен `width: auto`, чтобы кнопка отмены не растягивалась в футере панели перевода

## Зачем
Оставшаяся локальная правка из сессии polish transfer UI — включена в репозиторий по запросу «закомить всё».

## Результат
Пуш `feature/real-adapters`; working tree clean.
