# Мастер-промт навигации shell

**Дата:** 2026-07-07 20:36
**Статус:** выполнено
**Коммит:** `22396c6`

## Где
- `docs/softphone/handoffs/Shell-Navigation-Contacts-History-Master-Agent-Prompt.md`
- `work-history/2026-07-07/shell-navigation-prompt_20-36.md`

## Что
- Создан мастер-промт для поэтапной реализации shell-навигации, контактов и истории.
- Зафиксировано правило сохранения текущих call/settings/overlay flows без скрытых поломок.
- Добавлено обязательное правило route-driven contacts sidebar поверх dialpad/call shell.
- Добавлены stop-гейты для router dependency, смены navigation model и изменений текущих контрактов.
- Описаны фазы: discovery, navigation foundation, history, contacts domain, contacts UI, settings alignment, regression hardening.
- Указаны архитектурные границы, анти-паттерны, проверки и финальный response contract для будущего агента.

## Зачем
- Нужен единый production-ready промт, чтобы будущие агенты внедряли навигацию и новые сущности расширяемо, без костылей и без регрессий текущей реализации.

## Результат
- Документ создан и уточнён правилом contacts routes как sidebar/overlay поверх dialpad.
- Проверки: runtime-тесты не запускались, так как изменена только документация.
