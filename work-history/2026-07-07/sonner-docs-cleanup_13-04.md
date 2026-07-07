# Sonner theme bridge — документация и зачистка

**Дата:** 2026-07-07 13:04
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/ui-kit/UI-KIT.md` — секция Sonner (theme bridge architecture)
- `docs/ui-kit/VISUAL-SPEC.md` — canon product notifications
- `src/renderer/components/ui/sonner/Sonner.stories.tsx`
- `src/renderer/components/notifications/NotificationViewport.tsx`

## Что
- Задокументирован подход: native Sonner + CSS variable bridge, без `unstyled`.
- Обновлены UI-KIT и VISUAL-SPEC; добавлены anti-patterns из итераций.
- Восстановлены минимальные Storybook stories (Default, Light, Dark).
- Исправлен комментарий в `NotificationViewport`.
- Перегенерирован `UI-Component-Catalog.md`.

## Зачем
Зафиксировать корректный паттерн использования Sonner и убрать устаревшие описания full UI Kit wrapper.

## Результат
- Хвостов в `src/` нет: `notificationLevelToSonnerToast.ts` отсутствует, stories актуальны.
- `npm run ui:catalog` + тесты Sonner/NotificationViewport — PASS (12/12).
