# Release automation и CI split

**Дата:** 2026-07-01 16:06
**Статус:** выполнено
**Коммит:** —

## Где
- `.github/workflows/ci.yml`, `.github/workflows/release.yml`
- `scripts/sync-release-manifest.mjs`
- `CHANGELOG.md`, `docs/softphone/RELEASE-PLAYBOOK.md`
- `.cursor/skills/release-agent/`, `.cursor/commands/release.md`, `.cursor/rules/release-agent.mdc`
- `package.json` (`release:preflight`, `release:sync-manifest`)
- `AGENTS.md`, `STATUS.md`, `Cursor-Agents-Guide.md`, `GitHub-Releases-Update-Guide.md`, `version-release.mdc`
- `src/renderer/hooks/useSettingsActions.test.ts` (полный mock preload API)

## Что
- CI на push/PR `main`: test, lint, typecheck, registry:check
- Release workflow: tag `v*.*.*` → matrix build → publish GitHub Release assets; `workflow_dispatch` — только артефакты
- Скрипт синхронизации manifest из `package.json` и шаблона URL GitHub Releases
- Playbook, CHANGELOG, агент `/release` (skill + command + rule)
- npm-скрипты preflight и sync-manifest; секция Release train в STATUS
- Исправлен typecheck в `useSettingsActions.test.ts`

## Зачем
Единый воспроизводимый release cut без ручной загрузки бинарников и без implicit electron-builder publish на CI.

## Результат
- `npm run release:preflight` — green (937 tests, lint, typecheck, registry)
- Следующий шаг: commit + push на `main`; для проверки CD — `/release` cut `0.0.2` или тестовый tag
