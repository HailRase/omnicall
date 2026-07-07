# Sonner dark theme через CSS tokens

**Дата:** 2026-07-07 12:59
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/sonner/Sonner.tsx`
- `src/renderer/components/ui/sonner/Sonner.module.css`
- `src/renderer/components/ui/sonner/index.ts`

## Что
- Добавлен тонкий theme-bridge `Toaster` без `unstyled`: нативный Sonner stack сохранён.
- CSS переменные Sonner (`--normal-bg`, `--normal-text`, rich colors) замаплены на semantic tokens.
- `useDocumentTheme` синхронизирует `theme` prop с `data-theme` на `documentElement`.
- Добавлены минимальные тесты theme bridge.

## Зачем
Тёмная/светлая тема toast через project tokens без регрессии stacked-поведения.

## Результат
- `npm run test -- Sonner.test.tsx NotificationViewport.test.tsx` — PASS (12/12).
