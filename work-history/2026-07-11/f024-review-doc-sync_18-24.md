# F-024 review doc sync

**Дата:** 2026-07-11 18:24
**Статус:** выполнено
**Коммит:** `a2baa11`

## Где
- `docs/softphone/handoffs/P11-F024-Saved-Account-Profiles-Handoff.md`
- `docs/softphone/STATUS.md`

## Что
- Handoff: remember-password переведён из out-of-scope в delivered scope; добавлены post-gate follow-ups.
- Handoff: baseline тестов обновлён до 1727; i18n locales — ru/en/fr/de/bg.
- Handoff: gate checkboxes и manual smoke для remembered-password UX.
- STATUS.md: test count 1727, дата верификации 2026-07-11.

## Зачем
Закрыть High/Low findings gate review F-024 (doc drift handoff + STATUS).

## Результат
Docs-only sync; тесты не перезапускались (baseline уже верифицирован в review).
