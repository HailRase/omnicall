# README без ссылок на приватный GitHub + publish 0.1.2

**Дата:** 2026-07-28 11:28
**Статус:** выполнено
**Коммит:** —

## Где
- `omnicall-kit/packages/sdk/README.md`
- `omnicall-kit/README.md`
- `omnicall-kit/packages/sdk/package.json`
- `omnicall-kit/packages/sdk/CHANGELOG.md`
- npm: `@softomnitel/omnicall-kit@0.1.2`

## Что
- Убраны относительные ссылки на `docs/`, `etc/api/`, `examples/` (на npm они резолвятся в приватный GitHub → 404).
- Удалён блок «Дополнительные материалы»; правила upgrade встроены в README.
- Из `package.json` kit убраны `repository` / `homepage` / `bugs` на закрытый репозиторий.
- Опубликован patch `0.1.2` (`latest`).

## Зачем
- README на npm должен быть самодостаточным для внешних интеграторов без доступа к приватному репо.

## Результат
- `npm publish -w @softomnitel/omnicall-kit` → `+ @softomnitel/omnicall-kit@0.1.2`
- В README не осталось внешних markdown-ссылок на файлы репозитория.
