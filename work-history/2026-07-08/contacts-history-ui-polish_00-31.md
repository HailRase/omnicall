# Contacts/History UI polish (hover, time, auth)

**Дата:** 2026-07-08 00:31
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/contacts/ContactsPanelShell.*`
- `src/renderer/components/history/HistoryPanelShell.*`
- `src/renderer/components/list/PersonListAvatar.module.css`
- `src/renderer/hooks/useCallHistoryShell.ts`
- `src/renderer/helpers/resolveHistorySecondaryTimeLabel.ts`
- `src/renderer/components/header/UserAvatarMenu.*`
- `src/renderer/hooks/useUserAvatarMenuActions.ts`

## Что
- Кнопка «Позвонить» в карточке контакта: `outline` + зелёные hover/active без синего primary
- Иконки направления в истории: 14px, вертикальное центрирование
- Аватарки в тёмной теме: border + насыщенные tone-фоны
- Вторичная строка истории: длительность для завершённых, время звонка для пропущенных/сброшенных
- Меню аватара: «Контакты» и «История» disabled без SIP-регистрации + tooltip
- i18n (ru/en/fr/de/bg) + unit-тесты

## Зачем
Исправить визуальные и UX-дефекты списков контактов/истории и ограничить навигацию для неавторизованных пользователей.

## Результат
16 focused tests passed; `npm run lint`, `typecheck`, `i18n:check` — OK.
