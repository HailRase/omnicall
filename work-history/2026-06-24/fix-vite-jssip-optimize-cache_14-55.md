# Fix Vite stale jssip optimize cache after fork swap

**Дата:** 2026-06-24 14:55
**Статус:** выполнено
**Коммит:** —

## Где
- `electron.vite.config.ts`
- `node_modules/.vite` (очищен)

## Что
- Добавлен `renderer.optimizeDeps.include` для `@hailrase/jssip` и deep import RTCSession
- Удалён устаревший кэш Vite, ссылавшийся на `node_modules/jssip/lib/JsSIP.js`

## Зачем
После замены `jssip` → `@hailrase/jssip` dev-сервер падал с ENOENT и 504 Outdated Optimize Dep (белый экран).

## Результат
- `npm run dev` поднимается без ошибки prebundle
- Новый кэш указывает на `@hailrase/jssip/lib-es5/JsSIP.js`
