# Журнал пользовательских уведомлений

**Дата:** 2026-07-17 13:36
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/use-cases/settings/QueryUserNotificationJournalUseCase.ts`
- `src/renderer/components/settings/`
- `src/renderer/i18n/`

## Что
- Добавлен отдельный раздел Settings для журнала.
- Реализованы поиск, фильтры по identity и module.
- Добавлены пагинация, дата/время, пользователь, title и module.
- Отображается признак popup, отключённого в момент emission.
- Добавлены локализации и component test.

## Зачем
Пользователь может восстановить контекст закрытого уведомления за rolling 24 часа.

## Результат
Query/UI focused tests и TypeScript-проверка пройдены.
