# Release cut v1.2.0 (F-031)

**Дата:** 2026-07-31 10:04
**Статус:** выполнено
**Коммит:** `4143bf2`

## Где
- `package.json` → `1.2.0`
- `CHANGELOG.md`, `distribution/CHANGELOG.md`
- `distribution/update-manifest.json` (+ docs copies)
- `docs/softphone/STATUS.md`, `TASK-QUEUE.md`, `Feature-Registry.md`
- `docs/softphone/handoffs/P14-External-Services-Master-Handoff.md`
- branches: `main`, `feature/external-services`, `feature/real-adapters`, `video-refactorin`

## Что
- Preflight PASS после lint-fix (OCP recovery tests + ShellWindowLayout)
- Merge `feature/external-services` → `main` (+23)
- Cut **1.2.0**: CHANGELOG, manifest sync, tag `v1.2.0`, push `main` + tag
- `feature/real-adapters` reset к `main` (`4143bf2`)
- `video-refactorin` merge `main` (сохранил video-docs commits; tip `92c0d23`)

## Зачем
- Ship F-031 External Services MINOR; синхронизировать устаревшие ветки с main

## Результат
- Tag: https://github.com/HailRase/softphone-electron/releases/tag/v1.2.0
- Actions Release: https://github.com/HailRase/softphone-electron/actions/runs/30611626381 (poll in progress at cut time)
- Distribution: https://github.com/HailRase/omnicall-releases/releases/tag/v1.2.0
