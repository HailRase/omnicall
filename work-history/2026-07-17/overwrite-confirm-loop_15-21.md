# T-037: Перезаписать и войти

**Дата:** 2026-07-17 15:21
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/hooks/useAccountActions.test.ts`
- `docs/softphone/Feature-Registry.md` (F-024)
- `docs/softphone/TASK-QUEUE.md` (T-037)

## Что
- `confirmOverwriteExistingCredentials` вызывает `handleSubmit(true, true)`, чтобы пропустить уже принятый overwrite-prompt.
- Добавлен регрессионный hook-тест: confirm → `signInAccount` с `saveProfile`/`rememberPassword`.
- Попутно починены два чужих lint в тестах Notification History / Tabs (блочили `npm run lint`).

## Зачем
- Кнопка «Перезаписать и войти» в модалке «Обновить сохранённые данные?» снова запускает sign-in вместо повторного открытия того же диалога.

## Результат
- `npx vitest run src/renderer/hooks/useAccountActions.test.ts` — 16 passed
- `npm run lint` — green
- `npm run typecheck` — green
