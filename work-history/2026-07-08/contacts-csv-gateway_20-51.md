# Contacts CSV gateway wiring fix

**Дата:** 2026-07-08 20:51
**Статус:** выполнено
**Коммит:** —

## Где
- `src/infrastructure/bootstrap/createRealAccountBootstrap.ts`
- `src/renderer/bootstrap/createRendererComposition.ts`
- `src/infrastructure/bootstrap/createRealAccountBootstrap.test.ts`

## Что
- Real bootstrap передаёт `options.contactCsvFileGateway` в `AccountBootstrapFacade`.
- Mock renderer composition подключает `MockContactCsvFileGateway` (import → cancelled, export → in-memory success).
- Добавлены тесты: forwarding gateway в real bootstrap/composition, отсутствие gateway в mock без инъекции, CSV import/export через gateway.

## Зачем
- Импорт/экспорт контактов в real mode падали с `Contacts CSV file gateway is unavailable`, хотя renderer создавал `PreloadContactCsvFileGateway`, но real bootstrap не пробрасывал порт.

## Результат
- `npx vitest run src/infrastructure/bootstrap/createRealAccountBootstrap.test.ts src/application/use-cases/contacts/ContactsCsvUseCases.test.ts` — 16/16 PASS
- `npm run typecheck` — FAIL (несвязанная ошибка в `useIncomingCallOverlayActions.test.ts`, не из этого diff)
