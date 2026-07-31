# Disposable SDK Demo Stand

**Дата:** 2026-07-21 10:52
**Статус:** выполнено
**Коммит:** —

## Где
- `sdk-demo/` (новый disposable стенд)
- `sdk-demo/server.mjs`, `index.html`, `styles.css`, `app.mjs`, `lib/*`
- `sdk-demo/README.md`, `sdk-demo/HOW-TO-RU.md`

## Что
- Zero-dep static server на `127.0.0.1:8765` с mount vendor SDK/protocol/zod
- Browser ESM + import map на локальные `axatalk-sdk/packages/*/dist`
- Реальный WebSocket `TransportPort`, PoP в IndexedDB
- SPA-сценарии A–H: pair, snapshot/events, window, calls, operator, logout, activate, errors
- `window.hide` disabled (ADR-0013); privileged caps не запрашиваются на pairing

## Зачем
- Живой удаляемый стенд для ручной проверки SDK ↔ desktop gateway без правок product/CI/Registry

## Результат
- `node server.mjs` поднимает demo; HTTP 200 для `/`, `/app.mjs`, `/vendor/sdk|protocol|zod`
- Root `package.json` / Feature Registry / SemVer не трогались
- Удаление = удалить папку `sdk-demo/`
