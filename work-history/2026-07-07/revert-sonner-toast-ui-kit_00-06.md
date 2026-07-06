# Откат Sonner-like Toast UI Kit

**Дата:** 2026-07-07 00:06
**Статус:** не выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/toast/`
- `docs/ui-kit/UI-KIT.md`, `docs/ui-kit/VISUAL-SPEC.md`
- `package.json`

## Что
- `git restore` для всех изменённых файлов Toast/Sonner
- Удалены `SonnerToaster.tsx`, `SonnerToaster.module.css`, `useDocumentTheme.ts`
- `npm install` — удалена зависимость `sonner`

## Зачем
По запросу пользователя отменить последние изменения Sonner-like Toast.

## Результат
Рабочее дерево чистое, Toast возвращён к Radix-реализации до сессии.
