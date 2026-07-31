# Баллистический bounce мячика на splash

**Дата:** 2026-07-25 18:35
**Статус:** выполнено
**Коммит:** `0857897`

## Где
- `src/renderer/index.html`
- `src/renderer/shells/BootstrapSplashShell.module.css`
- `docs/softphone/Bootstrap-Splash-Contract.md`, `UI-Architecture.md`, `Feature-Registry.md`

## Что
- Keyframes пересчитаны по параболе `Y ≈ H·4·t·(1−t)` при `linear` timing
- Быстрый отрыв от земли → замедление к вершине → ускорение вниз; squash у контакта
- Тень синхронизирована с высотой; settle freeze→rest не трогали

## Зачем
- Вернуть ощущение реального прыжка мяча (гравитация), которое пропало после равномерных по высоте ключей

## Результат
- Визуал CSS-only; контракт обновлён; `stylelint` OK
