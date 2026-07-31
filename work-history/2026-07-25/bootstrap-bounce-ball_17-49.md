# Анимация прыгающего мячика на bootstrap splash

**Дата:** 2026-07-25 17:49
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/shells/BootstrapSplashShell.tsx`
- `src/renderer/shells/BootstrapSplashShell.module.css`
- `src/renderer/hooks/useBootstrapSplashProgress.ts`
- `src/renderer/App.tsx`
- `docs/softphone/Feature-Registry.md` (F-016 / LF-002)

## Что
- Переписан splash: круглый brand-ball с иконкой `dial.call`, squash/stretch bounce на CSS `@keyframes`
- Добавлена синхронизированная тень под мячом (scale/opacity)
- Progress 0–100 через props; при 100% bounce settles (`data-settled`)
- Хук `useBootstrapSplashProgress` плавно ведёт бар и держит splash ~700ms после ready
- Обновлены тесты, Storybook, Feature Registry

## Зачем
- Более выразительный экран загрузки приложения с упругим «мячиком» и прогрессом

## Результат
- `vitest` по затронутым тестам — OK (6)
- `stylelint` для модуля — OK
- Доп. фикс: `#boot-splash` визуально как bounce-ball; снятие только из `useLayoutEffect` React-splash (`dismissBootSplash`), z-index 9999, без opaque `#root` — убран белый кадр между HTML и React
