# F-032: Layers menu for geometry overlays

**Дата:** 2026-08-03 17:15
**Статус:** выполнено
**Коммит:** `97be2ea`

## Где
- `src/renderer/components/settings/external-applications/WindowGeometryOverlays.tsx`
- `src/renderer/components/settings/external-applications/WindowGeometryPreview.tsx`
- `src/renderer/components/settings/external-applications/windowGeometryMath.ts`
- `src/renderer/components/icons/iconCatalog.ts`
- `docs/softphone/Feature-Registry.md`, `P14-External-Applications-Design.md`, `I18N-Coverage.md`, `UI-Component-Catalog.md`, `Icon-Registry.md`

## Что
- Сайдбар «Наложение…» заменён на animated Layers-иконку (absolute top-right на desktop preview)
- Выбор peers — `DropdownMenuCheckboxItem` multiselect; session-only без persistence
- Adaptive scale больше не резервирует 240px sidebar → меньше горизонтальных скроллов
- i18n ru/en/fr/de/bg + semantic icon `settings.integrations.external-applications.overlays`
- Тесты панели/math обновлены; документация F-032 синхронизирована

## Зачем
- Компактный UX оверлеев на превью и корректная подстройка ширины stage под окно настроек

## Результат
- `vitest` geometry suite: 30/30 passed
- `npm run i18n:check` passed
- Downgrade нет: cards + remove на preview сохранены; выбор peers не пишется в settings
