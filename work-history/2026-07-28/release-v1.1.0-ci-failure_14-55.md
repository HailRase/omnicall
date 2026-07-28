# Диагностика падения release v1.1.0

**Дата:** 2026-07-28 14:55
**Статус:** выполнено
**Коммит:** —

## Где
- GitHub Actions `release.yml` run `30356125014` (tag `v1.1.0`)
- `@softomnitel/omnicall-protocol` (`omnicall-kit/packages/protocol`)

## Что
- Просмотрен failed run Preflight → step «Run tests».
- Build/Finalize skipped из‑за падения preflight.

## Зачем
- Понять, почему релиз v1.1.0 не опубликовал installers.

## Результат
- Root cause: Vite/Vitest не резолвит entry `@softomnitel/omnicall-protocol` (exports → `./dist/index.js`), т.к. после `npm ci` на CI `dist` не собран/не закоммичен.
- 30 failed suites / 2530 tests passed (сами тесты ок, падение на collect/resolve).
- Локально `dist` есть → preflight у агента проходил.
