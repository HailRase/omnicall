# Полировка bounce splash (скорость, 3D, anti-jank)

**Дата:** 2026-07-25 18:27
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/index.html`
- `src/renderer/shells/BootstrapSplashShell.module.css`
- `src/shared/platform/startupSplashColors.ts`
- `src/renderer/hooks/useBootstrapSplashProgress.ts`
- `src/renderer/helpers/bootSplashDom.ts`
- `docs/softphone/Bootstrap-Splash-Contract.md` (+ UI-Architecture, Feature-Registry, Legacy, STATUS, UX blueprint, CHANGELOG)

## Что
- Bounce 1200ms → 1000ms; timing `linear` + seamless keyframes (без «залипания» у земли)
- Усилен 3D мяча: layered gradients, specular `::before`, stage `perspective` + `rotateX`
- Тень: radial-gradient без animated `filter: blur`
- Progress: тик 160ms, integer %, skip identical transform в `bootSplashDom`
- Документация: sync surfaces, anti-jank, запрет JS spring на production path

## Зачем
- Убрать микрофриз прыжка, чуть ускорить цикл и сделать мяч объёмнее без смены single-stage архитектуры и без react-spring

## Результат
- `vitest` splash-пакет — 18/18 PASS
- `stylelint` `BootstrapSplashShell.module.css` — OK
- Контракт F-016 / LF-002 сохранён (один `#boot-splash`, gate `initialize` не трогали)
