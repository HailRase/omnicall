# Axatalk GitHub release + manifest setup

**Дата:** 2026-07-01 12:35
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/release/update-manifest.json`
- `docs/softphone/GitHub-Releases-Update-Guide.md`
- `.env.production`, `install-instruction.md`, examples/manifest

## Что
- Live manifest под Axatalk и `HailRase/softphone-electron`
- Активирован `VITE_UPDATE_MANIFEST_URL` (raw main branch)
- Гайд по GitHub Releases; обновлены install-instruction и Manual-Update-Manifest

## Зачем
Подготовка ручной публикации релизов после ребрендинга package.json / electron-builder.

## Результат
`registry:check` green. Остаётся: merge в main, push, GitHub Release, сборка с новым .env.
