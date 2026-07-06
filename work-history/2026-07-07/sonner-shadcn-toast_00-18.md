# Sonner shadcn Toast UI Kit

**Дата:** 2026-07-07 00:52
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/sonner/`
- `src/renderer/components/notifications/NotificationViewport.tsx`
- `src/renderer/theme/useDocumentTheme.ts`
- `docs/ui-kit/UI-KIT.md`, `docs/ui-kit/VISUAL-SPEC.md`
- `package.json` (зависимость `sonner`)

## Что
- Добавлен UI Kit `Toaster` (shadcn-like wrapper над `sonner`) + re-export `toast`/`ExternalToast` в `ui/sonner`.
- Реализован Sonner-визуал на semantic tokens: compact neutral surface, action/cancel/close, rich colors без hardcoded цветов.
- Поддержаны Sonner API/поведение: `position` (включая center), `theme`, `richColors`, `closeButton`, `duration`, `expand`, `visibleToasts`, `toastOptions`.
- Runtime-уведомления переведены на Sonner (`NotificationViewport` + `useNotificationSonnerSync`) с сохранением queue/dismiss/action/auto-duration/i18n.
- Добавлены stories `UI Kit/Sonner` (default/description/action/close/rich colors/types/positions/stacked/light/dark/interactive).
- Добавлены и обновлены тесты: `Sonner.test.tsx`, `NotificationViewport.test.tsx`; Radix `ui/toast` сохранён как compatibility layer.
- Исправлена прокладка notification-настроек в runtime (`stacking`, `closable`, `maxVisible`) через `SoftphoneReadyShell` в `NotificationViewport`.
- `NotificationViewport` теперь держит `Toaster` смонтированным постоянно и применяет Sonner-параметры (`visibleToasts`, `expand`, `gap`, `offset`) из пользовательских настроек.
- Исправлена синхронизация тостов по повторному `id`: обновления теперь применяются по сигнатуре, а не игнорируются.
- Подправлен визуал Sonner (компактность, кнопки action/cancel/close, rich colors) ближе к shadcn/Sonner канону.
- Исправлен edge-case быстрой серии logout/login: синк Sonner теперь делает устойчивый upsert по `id` на каждом актуальном item, без пропуска нотификаций.
- Добавлен cleanup dismiss для `useNotificationSonnerSync` и тестов, чтобы не было "залипания" и post-teardown ошибок таймеров Sonner.
- Переписан reconcile в `useNotificationSonnerSync`: snapshot-сравнение payload, подавление re-open после manual close до удаления item из очереди, one-shot close handler.
- Устранён loop/flicker кейс: закрытая нотификация не открывается повторно без нового queue item.
- Добавлен regression test `does not re-open toast in loop after manual close`.

## Зачем
Привести toast к shadcn/Sonner API и визуалу, использовать реальный runtime Sonner для product notifications.

## Результат
- `npm run test -- Sonner` — 9/9
- `npm run test -- Toast` — 12/12
- `npm run test -- NotificationViewport` — 6/6
- `npm run test -- NotificationViewport` — 7/7
- `npm run lint` — ok
- `npm run typecheck` — ok
- `npm run i18n:check` — fail (unrelated: `FormField.tsx`)
