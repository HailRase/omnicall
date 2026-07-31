# OCP get_main_acallid wire fix

**Дата:** 2026-07-26 19:05
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/ocp/parseOcpMessage.ts` (+ outbound command/bridge из той же задачи)
- `docs/softphone/OCP-Call-Context.md`, Feature-Registry, CHANGELOG

## Что
- Outbound: `acallid` + `user_login` + `caller_id`/`called_id` + `event`
- Inbound: MainCallIDInfo принимает live `acallid`/`main_acallid` (раньше только `acall_id` → parse fail → нет очереди)
- Docs + тесты parse/bridge/SDK mapper

## Зачем
- Очередь ACD на UI и additive `queueLabel` в SDK после реального ответа OCP

## Результат
- Focused vitest PASS (parse + bridge + SDK mapper)
- SDK путь: `CallOcpContextResolved` → `call:*` + `queueLabel` (без wire ids)
