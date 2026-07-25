# Лёгкий объём (3D) у мяча splash

**Дата:** 2026-07-25 18:37
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/index.html`
- `src/renderer/shells/BootstrapSplashShell.module.css`
- `docs/softphone/Bootstrap-Splash-Contract.md`, `Feature-Registry.md`

## Что
- Добавлен subtle static volume: мягкий highlight + depth radial + лёгкий inset rim
- Без `perspective` / `rotateX` / specular pseudo — баллистика прыжка не тронута

## Зачем
- Небольшой объём мяча без порчи текущего bounce

## Результат
- Визуал CSS-only; motion/settle без изменений
