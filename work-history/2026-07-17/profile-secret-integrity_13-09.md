# Profile and secret integrity

**Дата:** 2026-07-17 13:09
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/use-cases/settings/PersistDraftAccountArtifactsUseCase.ts`
- `src/application/services/settings/`
- `src/adapters/settings/`
- `src/application/facades/AccountBootstrapFacade.ts`

## Что
- Добавлена компенсация partial secret/profile writes и metadata-last commit.
- Successful profile защищён от downgrade в draft.
- File repository откатывает memory и блокирует перезапись corrupt документа.
- Все SIP/OCP secret scopes удаляются вместе с профилем.
- Boundary secrets хранятся в attempt scope с TTL для recovery.
- OCP remember intent сохраняет полученный SIP password после credentials.

## Зачем
Исключить orphan credentials, silent data loss и повторный ввод boundary secret при recovery.

## Результат
Focused tests: 66 passed. `npm run typecheck`: passed.
