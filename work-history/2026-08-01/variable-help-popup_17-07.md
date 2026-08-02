# Variable help popup (?)

**Дата:** 2026-08-01 17:07
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-services/ExternalServicesVariableHelpButton.tsx`
- `src/renderer/components/settings/external-services/ExternalServicesSystemVariablesHelp.tsx`
- `src/renderer/components/icons/iconCatalog.ts`, `docs/softphone/Icon-Registry.md`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`

## Что
- Иконка `?` справа от названия каждой системной переменной
- Клик открывает короткий popup с операторским описанием (`variables.help.*`)
- Закрытие: повторный клик, Escape, клик снаружи
- Общий каталог для ES и EA Variables

## Зачем
- Настройщик/оператор быстро понимает смысл переменной без длинного текста в списке

## Результат
- `i18n:check` OK; vitest help button + requests editor OK
