# F-024 review LOW doc drift fix

**Дата:** 2026-07-06 12:42
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/STATUS.md`
- `docs/softphone/TASK-QUEUE.md`
- `docs/softphone/handoffs/P11-F024-Saved-Account-Profiles-Handoff.md`
- `docs/softphone/I18N-Coverage.md`
- `docs/softphone/Legacy-Feature-Coverage.md` (LF-077)
- `docs/softphone/Feature-Registry.md` (F-024 Legacy IDs + handoff)

## Что
- STATUS: test count 1274, строки F-023/F-024, recently closed
- TASK-QUEUE: T-011 → done, добавлен T-012 F-024 done
- Создан formal handoff P11-F024
- I18N-Coverage: account.profile.*, account.error.*, компоненты F-024
- LF-077 + F-024 Legacy ID в registry

## Зачем
Закрыть Low findings из `/review` gate F-024.

## Результат
Все 5 doc drift пунктов исправлены; docs-only, без изменений production code.
