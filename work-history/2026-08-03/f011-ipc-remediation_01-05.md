# F-011 IPC remediation

**Дата:** 2026-08-03 01:05
**Статус:** выполнено
**Коммит:** —

## Где
- `src/main/sdk/`
- `omnicall-kit-integration/sdk-production-readiness/PROGRESS.md`

## Что
- Добавлены негативные IPC-тесты для broker readiness, broker reply и native window.
- Проверена успешная обработка sender основного окна.
- Уточнён фактический результат desktop release preflight.

## Зачем
Защитить main-side SDK IPC от вызовов вспомогательных WebContents и сохранить достоверный статус проверки.

## Результат
`release:preflight` PASS: 3110 passed / 1 skipped; обязательный packaged E2E не запускался, поэтому WU-07 остаётся открытым.
