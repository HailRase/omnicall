# Fix preload ESM crash in Electron sandbox

**Дата:** 2026-06-24 10:16
**Статус:** выполнено
**Коммит:** —

## Где
- `electron.vite.config.ts` — preload build format cjs
- `src/main/index.ts` — preload path index.js
- `src/renderer/hooks/useAppShutdown.ts` — guard if softphone API missing

## Что
- Preload собирается как CJS с `require("electron")` вместо ESM import (sandbox-совместимо)
- useAppShutdown не падает, если preload не загрузился

## Зачем
UI мигал 0.5с и падал: `Cannot use import statement outside a module` в preload.

## Результат
`out/preload/index.js` начинается с `"use strict"; const electron = require("electron");`
Перезапуск `npm run dev` — стабильный UI.
