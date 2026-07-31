# DI-10 — refactor: вынести sdk-demo из репо

**Дата:** 2026-07-21 14:45
**Статус:** выполнено
**Коммит:** —

## Где
- `ELECTRON/sdk-demo/` (вне softphone; бывший `softphone/sdk-demo/`)
- `axatalk-sdk-integration/evidence/DI-10-compatibility-e2e-p12-close.md`
- `axatalk-sdk-integration/WORK-UNITS.md`, `SMOKE-CHECKLIST.md`
- `docs/softphone/STATUS.md`, Feature-Registry, P12 handoff

## Что
- Остановлен `node server.mjs` (lock) → папка перенесена в `ELECTRON/sdk-demo`
- ESLint ignore для `sdk-demo/**` **не** добавлялся
- В demo обновлены пути vendor → `softphone/axatalk-sdk`
- SMOKE Compatibility: current↔current + incompat отмечены `[x]`
- DI-10 снова `review`, ожидает `/sdk-review`; F-011/P12 не закрывались

## Зачем
Снять Blocker re-gate lint без ignore, сохранив disposable demo вне дерева продукта.

## Результат
- `npm run lint` PASS
- `npm run release:preflight` PASS — **2499 passed / 1 skipped**; registry 74/0
- Next: `/sdk-review` DI-10 only
