# Переименование npm scope на @axata

**Дата:** 2026-07-21 10:24
**Статус:** выполнено
**Коммит:** `23c2a42`

## Где
- `axatalk-sdk/packages/{protocol,sdk}/package.json`
- `package.json` (desktop `file:` dep)
- `axatalk-sdk/` docs, scripts, examples, changesets, API reports
- desktop `src/` imports + `eslint.config.js`
- ADR / evidence / STATUS / Feature-Registry (F-011)

## Что
- `@axatalk/protocol` → `@axata/axatalk-protocol`
- `@axatalk/sdk` → `@axata/axatalk-sdk`
- пример: `@axata/example-crm-pairing-lite`
- обновлены lockfiles; stale `node_modules/@axatalk` удалён

## Зачем
- единый company scope `@axata` для нескольких продуктов; имя продукта в имени пакета

## Результат
- `cd axatalk-sdk && npm run build && npm run api:check` — PASS (47 / 169)
- `npm run package:check` + `docs:check` — PASS
- focused vitest (boundary + fixtures + compat) — 12/12 PASS
- SemVer desktop не поднимали (rename, не product close)
