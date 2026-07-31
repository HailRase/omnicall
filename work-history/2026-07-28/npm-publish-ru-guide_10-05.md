# Публикация npm RU-гайда (блокер auth)

**Дата:** 2026-07-28 10:05
**Статус:** не выполнено
**Коммит:** —

## Где
- `omnicall-kit/packages/sdk/README.md` (RU-гайд в tarball)
- `omnicall-kit/scripts/release-check.mjs` (исправлен баг dry-run)
- registry: `@softomnitel/omnicall-kit` / `@softomnitel/omnicall-protocol`

## Что
- `npm run build` + `npm run release:check` — PASS; в tarball `0.1.0` есть полный RU README (~776 строк)
- Исправлен `ReferenceError: publishConfig is not defined` в `release-check.mjs` (dry-run брал `pkgJson.publishConfig`, тег dry-run → `latest`)
- `RELEASE_CONFIRM=1 RELEASE_DI10_DONE=1 npm run release:publish-stable` — FAIL: `E404` PUT (фактически нет валидной auth; `npm whoami` → `E401`)
- `npm login --auth-type=web` — timeout / Exit handler never called (логин в браузере не завершён)

## Зачем
- Выложить stable `0.1.0` с русским гайдом на npm `latest`, чтобы страница пакета сразу показывала док

## Результат
- Публикация не выполнена: просрочен/невалиден `_authToken` в `~/.npmrc`
- На registry сейчас только `0.1.0-rc.0` (и `latest`, и `rc` указывают на RC) со старым коротким EN README
- После `npm login` повторить: `$env:RELEASE_CONFIRM='1'; $env:RELEASE_DI10_DONE='1'; npm run release:publish-stable` из `omnicall-kit/`
