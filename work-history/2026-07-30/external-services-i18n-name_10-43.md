# Локализация названия External Services

**Дата:** 2026-07-30 10:43
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/i18n/messages.ts`
- `src/renderer/i18n/catalogs/bgMessages.ts`
- `src/renderer/components/settings/SettingsSidebar.test.tsx`

## Что
- RU nav/title/icon: «Внешние сервисы»; связанные сообщения ошибок/загрузки без английского бренда.
- FR: Services externes; DE: Externe Dienste; BG: Външни услуги; EN оставлен External Services.
- Тест сайдбара ожидает русское название.

## Зачем
- Отображаемое имя раздела настроек должно идти через i18n во всех локалях.

## Результат
- `SettingsSidebar.test.tsx` + `messages.test.ts` — PASS.
- `npm run i18n:check` — PASS.
