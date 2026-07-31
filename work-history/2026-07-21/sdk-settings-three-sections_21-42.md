# SDK Settings: три секции + Accordion permissions

**Дата:** 2026-07-21 21:42
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/accordion/*` (UI Kit Accordion, Radix)
- `src/renderer/components/settings/panels/SdkModuleSettingsCard.tsx` и секции Trusted/Blocked/Address/Matrix
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `UX-UI-Design-Blueprint.md`, `UI-Component-Catalog.md`

## Что
- Страница Axatalk SDK разделена на «Основное», «Доверенные сайты», «Заблокированные сайты»
- Trusted sites: Accordion; permissions через Select «Разрешено/Запрещено» в FormField (label сверху)
- Редактирование адреса: view → Edit → Save/Cancel с dirty hint
- Blocked: строка origin + Unblock справа
- UI Kit Accordion (субагент `/ui-kit` + доводка типов/export)

## Зачем
- Более ясная IA и спокойный CRUD разрешений в стиле Apple Settings / shadcn Accordion

## Результат
- `i18n:check` PASS; `tsc` web PASS; Accordion 9 + SDK card 7 tests PASS; `ui:catalog` обновлён
