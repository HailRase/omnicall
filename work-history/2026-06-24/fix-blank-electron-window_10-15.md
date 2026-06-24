# Fix blank Electron window (CSP + preload)

**Дата:** 2026-06-24 10:15
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/index.html`
- `src/main/index.ts`

## Что
- CSP: разрешены `unsafe-inline` (Vite dev), `ws/wss` (HMR + SIP)
- Preload path: `index.js` → `index.mjs` (фактический артефакт electron-vite)

## Зачем
Пустое тёмное окно Electron: скрипты Vite блокировались CSP, preload не подключался.

## Результат
После `npm run dev` ожидается UI с формой SIP и «Booting application…» / shell.
