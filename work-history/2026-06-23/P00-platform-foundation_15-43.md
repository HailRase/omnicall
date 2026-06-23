# P00 Platform Foundation

**Дата:** 2026-06-23 15:43  
**Статус:** выполнено  
**Коммит:** `bf37a4a` → `origin/master`

## Где

- `src/main`, `src/preload`, `src/renderer` — Electron shell
- `src/domain`, `src/application`, `src/ports`, `src/adapters`, `src/infrastructure`, `src/shared` — слои архитектуры
- `docs/softphone/Feature-Registry.md` — F-000
- `eslint.config.js`, `vitest.config.ts`, `electron.vite.config.ts`

## Что

- Каркас Electron + React + TypeScript + Vite
- Strict TS, Vitest (13 тестов), ESLint + boundary rules
- Примитивы: Result, PlatformError, CorrelationId, Logger port
- Typed IPC preload (`window.softphone.getPlatformVersion`)
- Минимальный UI shell без телефонии

## Зачем

Фаза P00 roadmap: безопасный фундамент для legacy parity без JsSIP и бизнес-логики в UI.

## Результат

| Проверка | Итог |
|----------|------|
| `npm test` | ✓ |
| `npm run typecheck` | ✓ |
| `npm run lint` | ✓ |
| `npm run build` | ✓ |
| Gate P00 | ✓ |
