# Плавный exit bootstrap splash (crossfade)

**Дата:** 2026-07-25 18:12
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/helpers/bootSplashDom.ts` (`beginBootSplashExit`)
- `src/renderer/hooks/useBootSplashController.ts`
- `src/renderer/index.html` (`data-exiting` + transition)
- `docs/softphone/Bootstrap-Splash-Contract.md`

## Что
- После settle ready-shell монтируется под splash
- Splash гаснет ~420ms (opacity + лёгкий подъём content), затем удаляется из DOM
- Убран hard-cut, из‑за которого был «глюк»
- `prefers-reduced-motion` пропускает анимацию

## Зачем
- Плавное исчезновение окна загрузки без визуального скачка

## Результат
- vitest bootSplashDom + useBootSplashController — OK
