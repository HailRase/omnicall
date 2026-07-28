# Фикс CI protocol build + релиз v1.1.1

**Дата:** 2026-07-28 14:58
**Статус:** выполнено
**Коммит:** —

## Где
- `package.json` (`build:protocol`, `postinstall`, version `1.1.1`)
- `omnicall-kit/packages/protocol/package.json` (`prepare`)
- `.github/workflows/ci.yml`, `.github/workflows/release.yml`
- CHANGELOG / distribution / STATUS / manifest

## Что
- После `npm ci` всегда собирается `@softomnitel/omnicall-protocol` (`dist/`).
- Явный step Build OmniCall Protocol в CI и Release (preflight + build matrix).
- Cut `v1.1.1` (PATCH) — разблокировка публикации после падения `v1.1.0`.
- Синхронизация `main` / `feature/real-adapters` / `ocp-integration`.

## Зачем
- Vitest на CI не резолвил package entry без `dist/`.

## Результат
- Smoke: `protocol-fixture-consume` + `SdkBrokerContract` PASS после `build:protocol`.
- Тег `v1.1.1` запушен; ветки идентичны.
