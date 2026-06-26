# Fullscreen settings panel with sidebar

**Дата:** 2026-06-26 12:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/` — overlay, panel, sidebar, section panels
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/hooks/useOverlayShell.ts`
- `src/renderer/components/icons/iconCatalog.ts`, `docs/softphone/Icon-Registry.md`
- `docs/softphone/Feature-Registry.md`, `docs/softphone/TASK-QUEUE.md`

## Что
- Полноэкранный `SettingsFullscreenOverlay` со slide-in анимацией и scrim
- Sidebar: свёрнутый — иконки (56px rail); развёрнутый — иконки + текст поверх контента
- Секции: Аккаунт (SIP auth), Общее (перерегистрация SIP), Сессии (мультисессии), Диагностика, Кодеки, Гарнитура
- Кнопка «Диагностика» в header открывает настройки на секции Диагностика
- Удалён отдельный `ShellOverlaySheet` для diagnostics; `SettingsOverlay` заменён на `SettingsPanel`
- 7 новых semantic icons; тесты, Storybook, UI catalog

## Зачем
Единая полноэкранная модалка настроек с навигацией по разделам и переносом существующих контролов без потери call context.

## Результат
711 passed, 1 skipped; lint, typecheck, `ui:catalog` — OK.
