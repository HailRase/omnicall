# Auth edge UX

**Дата:** 2026-07-17 13:36
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/hooks/useOcpLogoutModal.ts`
- `src/renderer/components/account/`

## Что
- Добавлено подтверждение потери dirty draft.
- Overwrite modal получил две явные кнопки входа.
- Ошибки входа стали persistent до edit/retry.
- Удаление профиля показывает loading и блокирует повторные действия.
- Logout UI переведён на единый Application outcome.

## Зачем
Исключить тихую потерю данных, двойные действия и неоднозначный каскад выхода.

## Результат
Focused UX/hook tests пройдены после обновления контрактов; полный gate выполняется в WU-07-11.
