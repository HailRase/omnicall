# Notification Center: понятный UX для порога popups

**Дата:** 2026-08-02 19:03
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SettingsNotificationModuleRow.tsx`
- `src/renderer/components/settings/panels/SettingsNotificationCenterPanel.module.css`
- `src/renderer/components/settings/panels/notificationPreferencesUi.ts`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `notification-center/05-UI-UX.md`, `docs/softphone/Feature-Registry.md`

## Что
- Заменены сырые имена уровней на формулировки «что показывать» (Все / Успех и важнее / …)
- Добавлена короткая подсказка про порог важности
- Контролы модуля — компактная двухколоночная сетка
- Domain `minLevel` и политика capture не менялись
- Обновлены i18n (ru/en/fr/de/bg) и тесты

## Зачем
- Обычный оператор не понимал «Минимальный уровень» + raw level labels

## Результат
- `vitest` panel/ui helpers — OK
- `tsc -p tsconfig.web.json` — OK
- `npm run i18n:check` — OK
- Новый Radix-примитив не понадобился (уже UI Kit `Select`)
