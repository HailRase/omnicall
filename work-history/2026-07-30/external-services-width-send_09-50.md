# F-031 External Services width and send icon

**Дата:** 2026-07-30 09:50
**Статус:** выполнено
**Коммит:** —

## Где
- `SettingsIntegrationsPanel.tsx`, `SettingsForm.module.css`
- `ExternalServicesRequestEditor.tsx`, `ExternalServices.module.css`
- `iconCatalog.ts`, `Icon-Registry.md`, i18n catalogs

## Что
- Убран `max-width: 36rem` для External Services — workspace на 100% ширины
- Кнопка Send заменена на `IconButton` с иконкой Send
- Send enabled при непустом URL; иначе disabled + причина

## Зачем
- Убрать сжатие контента выбранного запроса и дать компактный Send control

## Результат
- typecheck / i18n:check / focused tests PASS
