# OmniCall Kit: private npm posture + GitHub repo

**Дата:** 2026-07-27 16:21
**Статус:** выполнено
**Коммит:** — (softphone незакоммичен; GitHub HailRase/omnicall-kit запушен)

## Где
- omnicall-kit/ (инкубационная копия в softphone)
- https://github.com/HailRase/omnicall-kit (private)
- guides/RELEASE-PLAYBOOK.md, guides/npm-org-and-access.md
- scripts/release-*.mjs

## Что
- publishConfig и changeset переведены на access=restricted (private npm)
- Добавлены release-команды по образцу OmniCall (preflight/version/prepare/publish-rc/publish-stable)
- Документация npm org Free→Teams и playbook релиза
- Создан private GitHub repo HailRase/omnicall-kit, залита текущая версия workspace
- CI workflow для standalone repo; sbom устойчив к npm <10
- AGENTS.md softphone ссылается на GitHub kit

## Зачем
- Подготовить protocol+kit к закрытой публикации под @softomnitel и вынести publishable source в отдельный private repo до апгрейда npm Teams

## Результат
- GitHub: https://github.com/HailRase/omnicall-kit (PRIVATE)
- npm run release:check PASS (publish не выполнялся; Free plan)
- npm publish отложен до Teams + RELEASE_CONFIRM=1
