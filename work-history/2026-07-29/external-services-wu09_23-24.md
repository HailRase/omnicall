# F-031 WU-09 request UI

**Дата:** 2026-07-29 23:24
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-services/`
- `src/renderer/hooks/useExternalServicesPanel.ts`
- `src/renderer/i18n/messages.ts`

## Что
- Завершены список запросов, редактор, подтверждение discard и Run now.
- Добавлены component-тесты и light/dark Storybook stories.
- Локализированы новые сообщения ru/en/fr/de/bg и синхронизированы F-031 документы.

## Зачем
Пользователь может безопасно редактировать и вручную выполнять HTTP-запросы активного профиля.

## Результат
Focused Vitest (15), typecheck, i18n:check, ui:catalog и targeted ESLint — PASS.
