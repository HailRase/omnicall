# Релиз v1.1.2 — fix tsc -b --force

**Дата:** 2026-07-28 15:07
**Статус:** выполнено
**Коммит:** —

## Где
- `package.json` (`build:protocol`: `tsc -b omnicall-kit/packages/protocol --force`)
- CHANGELOG / distribution / STATUS / manifest
- ветки `main`, `feature/real-adapters`, `ocp-integration`

## Что
- Исправлен `build:protocol`: `--force` только с `--build` (иначе `TS5093` в postinstall на CI).
- Cut `v1.1.2`, синхронизация трёх веток.

## Зачем
- `v1.1.1` упал на `npm ci` / postinstall из‑за неверного флага tsc.

## Результат
- Локально `npm run build:protocol` + protocol smoke PASS.
- Тег `v1.1.2` запушен.
