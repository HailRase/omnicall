# Fix: real_bootstrap_requires_profiles_storage_root после guest preload

**Дата:** 2026-08-02 13:13
**Статус:** выполнено
**Коммит:** `80886133`

## Где
- `src/preload/externalApplicationGuest.ts`
- `electron.vite.config.ts`
- `docs/softphone/adr/ADR-0024-external-applications-screen-pop-windows.md`
- `docs/softphone/P14-External-Applications-Design.md`

## Что
- Guest preload сделан self-contained (без `@shared` импортов)
- Убраны shared Rollup chunks (`require("./chunks/…")`) из preload build
- Документы: sandbox preload не должен делить chunks с main preload

## Зачем
- Sandbox Electron ломал main preload из‑за shared chunk → не было `window.softphone` → real bootstrap падал с `real_bootstrap_requires_profiles_storage_root`

## Результат
- `npx electron-vite build`: preload = только `index.js` + `externalApplicationGuest.js`, без `out/preload/chunks`
- Нужен перезапуск `npm run dev`
