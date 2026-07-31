# Убран 3D splash + settle без телепорта

**Дата:** 2026-07-25 18:30
**Статус:** выполнено
**Коммит:** `0857897`

## Где
- `src/renderer/index.html`
- `src/renderer/shells/BootstrapSplashShell.module.css` / `.tsx`
- `src/renderer/helpers/bootSplashDom.ts` (+ tests)
- `docs/softphone/Bootstrap-Splash-Contract.md` и связанные docs

## Что
- Откат 3D-оформления мяча (gradients / specular / perspective / rotateX) к плоскому brand-ball
- Сохранены улучшения bounce: 1000ms, linear, seamless keyframes
- Settle: `settleSplashBallMotion` — freeze текущего transform → ease to rest (без замены bounce keyframes mid-air)
- Документация: запрет mid-air keyframe swap; убраны 3D-формулировки

## Зачем
- Убрать нежелательный 3D вид и телепорт мяча с верхней точки при окончании загрузки

## Результат
- `vitest` splash-пакет — 18/18 PASS
- `stylelint` — OK
