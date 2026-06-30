# Hide auto-answer blocked banner

**Дата:** 2026-06-30 12:07
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/deriveCallLinesShell.ts`

## Что
- `auto_answer_blocked` больше не показывает баннер в стеке сессий

## Зачем
Пользователь видит отсутствие таймера автоответа без лишнего текста.

## Результат
- Логи `auto_answer_blocked` в Application сохранены
