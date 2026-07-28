# Релиз OmniCall v1.1.0

**Дата:** 2026-07-28 14:45
**Статус:** выполнено
**Коммит:** —

## Где
- `package.json` (версия `1.1.0`)
- `CHANGELOG.md`, `distribution/CHANGELOG.md`
- `distribution/update-manifest.json` (+ dev/examples copies)
- `docs/softphone/STATUS.md` (Release train)
- ветки `main`, `feature/real-adapters`, `ocp-integration`

## Что
- Закоммичены toast viewport geometry + SDK reply docs; запушен `feature/omnicall-softomnitel-rebrand`.
- Fast-forward merge в `main` / `feature/real-adapters` / `ocp-integration` без конфликтов.
- Cut релиза `v1.1.0`: CHANGELOG, sync-manifest, Release train, тег.
- После релиза три целевые ветки синхронизированы на один SHA.

## Зачем
- Опубликовать накопленный train (rebrand OmniCall, shared-desk call control, toast geometry) и выровнять ветки.

## Результат
- `npm run release:preflight` — PASS.
- Тег `v1.1.0` + push `main` и трёх идентичных веток.
