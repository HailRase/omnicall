# Консолидация guides в /guides

**Дата:** 2026-07-01 16:40
**Статус:** выполнено
**Коммит:** —

## Где
- `guides/` — все руководства и `README.md` (каталог)
- `install-instruction.md`, `docs/softphone/*-Guide.md` — stub-редиректы
- `AGENTS.md`, `docs/softphone/README.md`, `STATUS.md` — ссылки на `guides/`

## Что
- Создана папка `guides/` с 8 руководствами + индекс `README.md`
- Перенесены: User-Guide, install-instruction, Cursor-Agents, Developer-Release-CI, GitHub-Releases, RELEASE-PLAYBOOK, Manual-Update-Manifest, Icon-Agent-Guide
- На старых путях — короткие redirect-файлы
- Обновлены ссылки в rules, skills, Feature-Registry, electron-builder, .env.production

## Зачем
Единая точка для onboarding-документации: пользователи, разработчики, релизы, агенты.

## Результат
Все гайды в `guides/README.md`; архитектура и handoffs остаются в `docs/softphone/`.
