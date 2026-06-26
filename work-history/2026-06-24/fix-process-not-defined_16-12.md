# Fix renderer black screen process is not defined

**Дата:** 2026-06-24 16:12
**Статус:** выполнено
**Коммит:** —

## Где
- `src/infrastructure/bootstrap/createRealAccountBootstrap.ts`
- `src/renderer/vite-env.d.ts` (типы DEV/MODE)

## Что
- Удалён `process.env.NODE_ENV` из real bootstrap (в renderer `process` не определён)
- `createRealAccountBootstrap` всегда использует `createConsoleLogger` для smoke-логов

## Зачем
Чёрный экран и crash «process is not defined» при старте UI с real adapters.

## Результат
- `npm run lint` / `typecheck` — ok
- Перезапустить `npm run dev` и проверить UI
