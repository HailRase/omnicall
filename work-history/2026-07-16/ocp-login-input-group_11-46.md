# OCP login InputGroup + DropdownMenu

**Дата:** 2026-07-16 11:46
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/OcpModuleSettingsCard.tsx`
- `src/renderer/components/settings/panels/OcpModuleSettingsCard.module.css`
- `src/renderer/components/settings/panels/SettingsIntegrationsPanel.test.tsx`
- `src/renderer/i18n/messages.ts`, `bgMessages.ts`, `locales/bg-strings.json`
- `docs/softphone/Feature-Registry.md` (F-028 evidence)

## Что
- Заменён `Input` + `datalist` на UI Kit `InputGroup` с `InputGroupInput`
- Добавлена кнопка «Выбрать» (`DropdownMenuTrigger` + `InputGroupButton`) со списком сохранённых логинов профилей
- Выбор пункта меню заполняет поле; кнопка очистки сбрасывает логин; ручной ввод сохранён
- i18n: `settings.integrations.ocp.login.select|clear|profilesMenu` (ru/en/fr/de/bg)
- Обновлены component-тесты и evidence в Feature Registry

## Зачем
Улучшить UX выбора логина OCP в настройках интеграций через UI Kit InputGroup и DropdownMenu вместо нативного datalist.

## Результат
- `npm run test` — 2088 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
