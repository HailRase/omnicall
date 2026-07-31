# Single-stage bootstrap splash (#42AAFF)

**Дата:** 2026-07-25 18:10
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/index.html` (`#boot-splash`)
- `src/renderer/helpers/bootSplashDom.ts`
- `src/renderer/hooks/useBootSplashController.ts`
- `src/renderer/App.tsx`
- `docs/softphone/Bootstrap-Splash-Contract.md` + Registry / UI-Architecture / STATUS

## Что
- Один этап загрузки: только `#boot-splash` до settle; React loading-splash убран из App
- React управляет progress/текстом/settle/dismiss через `bootSplashDom`
- Error по-прежнему `BootstrapSplashShell`
- Цвет mark mid: `#42AAFF` (градиент `#6BC4FF→#42AAFF→#2A8FD9`)
- Документация синхронизирована под single-stage (запрет повторного handoff)

## Зачем
- Убрать смену двух loader’ов и зафиксировать продуктный голубой

## Результат
- focused vitest 19 tests — OK
- `registry:check` — OK
- Нужен полный reload окна для `index.html`
