# Анимация закрытия модалки настроек

**Дата:** 2026-06-26 15:00
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsFullscreenOverlay.tsx`
- `src/renderer/components/settings/SettingsFullscreenOverlay.module.css`
- `src/renderer/components/settings/SettingsFullscreenOverlay.test.tsx`

## Что
- Добавлена фаза `closing`: оверлей остаётся в DOM до завершения exit-анимации
- Обратные keyframes для backdrop (fade out) и panel (slide out влево)
- Учёт `prefers-reduced-motion: reduce` — мгновенное размонтирование
- Тест на `data-closing` и unmount после `animationend`

## Зачем
Модалка настроек исчезала мгновенно при закрытии; нужна симметричная анимация появления/исчезновения.

## Результат
752 passed, 1 skipped; lint и typecheck — OK.
