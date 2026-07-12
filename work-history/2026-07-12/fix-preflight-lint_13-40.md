# Исправление preflight lint-блокеров

**Дата:** 2026-07-12 13:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/mock/MockLocalMediaCapturePort.ts`
- `src/main/media/installDisplayMediaRequestHandler.test.ts`
- `src/renderer/hooks/useScreenSharePicker.test.ts`
- `docs/softphone/UI-Component-Catalog.md`

## Что
- Убраны `no-unused-vars` в мок-порту через явное использование входных параметров (`void ...`) без изменения логики.
- Исправлен `require-await` в `installDisplayMediaRequestHandler.test.ts` заменой `async`-мока на `Promise.resolve(...)`.
- Исправлен `require-await` в `useScreenSharePicker.test.ts` заменой `await act(async ...)` на синхронный `act` с `void`-вызовом.
- Прогнаны `npm run test`, `npm run lint`, `npm run typecheck`, `npm run ui:catalog:check`.
- Подтверждено: тесты, lint и typecheck проходят; `ui:catalog:check` обновил каталог и завершился diff-блокировкой.

## Зачем
- Требовалось снять preflight-блокеры lint и убедиться, что правки безопасны и не ломают поведение.
- Изменения выполнены минимально и локально, без изменения бизнес-логики.

## Результат
- `npm run test` — успешно (1844 passed, 1 skipped).
- `npm run lint` — успешно.
- `npm run typecheck` — успешно.
- `npm run ui:catalog:check` — не пройден из-за diff в `docs/softphone/UI-Component-Catalog.md` после генерации.
