# electron-builder ERR_REQUIRE_ESM — Node.js версия

**Дата:** 2026-06-30 20:27
**Статус:** выполнено
**Коммит:** —

## Где
- `package.json`, `.nvmrc`, `scripts/check-node-version.mjs`

## Что
- Диагностирована ошибка `ERR_REQUIRE_ESM` при `npm run build:win`: `app-builder-lib@26.15` вызывает `require()` для ESM-only `@noble/hashes@2.2.0`
- Добавлен `engines.node >=20.19.0` и `.nvmrc` (22) — согласовано с CI и `install-instruction.md`
- Добавлена проверка версии Node перед `build:win|mac|linux|all`
- Обновлён Node.js локально до 22.23.1; сборка проходит успешно

## Зачем
- electron-builder 26.15+ требует Node >=20.19 для загрузки ESM-зависимостей; на Node 20.17 packaging падал на этапе blockmap

## Результат
- `npm run build:win` — exit 0 на Node 22.23.1
- После обновления Node перезапустите терминал/Cursor, чтобы PATH подхватил новую версию
