# F-011 broker and snapshot

**Дата:** 2026-08-03 00:03
**Статус:** не выполнено
**Коммит:** —

## Где
- `src/adapters/integration/MainToRendererBroker.ts`
- `src/application/integration/ExternalSdkReadHandler.ts`

## Что
- Добавлен IPC cancel для просроченного broker-запроса.
- Активация проверяет отмену до изменения состояния.
- Snapshot захватывает native window под revision lock.
- Проверены typecheck и focused tests.

## Зачем
Исключить позднюю мутацию и несогласованный SDK snapshot.

## Результат
Часть scope реализована; DX, расширенные race/identity/heartbeat тесты и preflight не завершены.
