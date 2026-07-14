# OCP plan: убрать notificationStore

**Дата:** 2026-07-14 10:12
**Статус:** выполнено
**Коммит:** —

## Где
- `ocp-integration/OCP-IMPLEMENTATION-PLAN.md` (E-09)

## Что
- Заменена ссылка на несуществующий `notificationStore` на `OcpNotificationPresenter` → `useNotifications.notify`
- Добавлен файл-ориентир `createOcpToastNotificationPresenter.ts` в структуру E-09
- В примечаниях: store для toast не планировать до host/SDK

## Зачем
План не должен направлять агентов на создание дублирующей toast-системы.

## Результат
E-09 спецификация согласована с текущим renderer (`useNotifications` + `NotificationViewport`).
