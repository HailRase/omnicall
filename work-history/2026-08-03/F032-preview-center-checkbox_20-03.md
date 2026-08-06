# F-032: центрирование превью и gutter галочки overlays

**Дата:** 2026-08-03 20:03
**Статус:** выполнено
**Коммит:** `866284df`

## Где
- `src/renderer/components/settings/external-applications/WindowGeometryPreview.module.css`
- `src/renderer/components/settings/external-applications/WindowGeometryPreview.tsx`
- `src/renderer/components/ui/dropdown-menu/DropdownMenu.module.css`
- `src/renderer/components/ui/dropdown-menu/DropdownMenu.tsx`
- `src/renderer/components/ui/dropdown-menu/DropdownMenu.test.tsx`
- `docs/softphone/Feature-Registry.md`, `P14-External-Applications-Design.md`, `I18N-Coverage.md`
- `docs/ui-kit/UI-KIT.md`

## Что
- Stage превью геометрии: `justify-content: center` (desktop по центру контейнера)
- UI Kit `DropdownMenuCheckboxItem`: всегда резервирует left padding под absolute check indicator
- Регрессионный тест на class/gutter индикатора
- Документация синхронизирована: left-aligned → centered; контракт CheckboxItem gutter

## Зачем
- Убрать визуальный сдвиг превью влево и наезд галочки на имена в popup «Наложение других приложений» без изменения scale/math/persistence.

## Результат
- `vitest` DropdownMenu + WindowGeometryEditor + ExternalApplicationsPanel: 32/32 passed
- Поведение drag/resize/overlays/i18n не менялось; version bump не делался (косметический UX polish, не release cut)
