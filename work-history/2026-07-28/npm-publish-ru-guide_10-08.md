# Публикация npm 0.1.0 с RU-гайдом

**Дата:** 2026-07-28 10:08
**Статус:** выполнено
**Коммит:** —

## Где
- npm: `@softomnitel/omnicall-kit@0.1.0` (`latest`)
- npm: `@softomnitel/omnicall-protocol@0.1.0` (`latest`)
- `omnicall-kit/packages/sdk/README.md` (опубликованный RU-гайд)
- `omnicall-kit/scripts/release-check.mjs` (fix dry-run из предыдущей попытки)

## Что
- Авторизация npm под `hailrase`; `RELEASE_CONFIRM=1` + `RELEASE_DI10_DONE=1` → `release:publish-stable` PASS
- На registry: `latest=0.1.0`, `rc=0.1.0-rc.0`
- README пакета kit на npm — русский гайд разработчика

## Зачем
- Чтобы на странице npm сразу отображался канонический RU-гайд

## Результат
- Проверено: `npm view @softomnitel/omnicall-kit` → version `0.1.0`, readme начинается с RU-гайда
- Токен из чата нужно ротировать на npm (не логировать / не коммитить)
