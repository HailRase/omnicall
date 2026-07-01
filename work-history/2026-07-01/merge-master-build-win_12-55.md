# Git merge master, builds, version rule

**Дата:** 2026-07-01 12:55
**Статус:** выполнено (linux local — частично)
**Коммит:** `698a99e`

## Где
- `master` (fast-forward `feature/real-adapters`)
- `.cursor/rules/version-release.mdc`, `AGENTS.md`
- `dist/win/Axatalk-0.0.1-win-x64.exe`

## Что
- 2 коммита: release docs + version-release rule; merge и push origin/master
- `npm ci` (после закрытия electron.exe), `build:win` OK
- `build:linux` на Windows: EPERM symlink при AppImage

## Зачем
Закрыть цикл релиза Axatalk и зафиксировать SemVer-правило для агентов.

## Результат
Push `master` → GitHub. Linux/mac — через CI или Linux/WSL хост.
