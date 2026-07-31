# ADR-0021 shared-desk SDK call control

**Дата:** 2026-07-27 14:44
**Статус:** выполнено
**Коммит:** —

## Где
- `omnicall-kit/packages/protocol` — granular caps + `sessionHasCapability` / `expandCallControlUmbrella`
- `src/application/integration/ExternalSdkCallHandler.ts` — shared desk (без ownership deny)
- `src/adapters/integration/sdkGatewayCapabilities.ts` — command→cap map + intersect expand
- `src/domain/settings/SdkOriginTrust.ts` + Settings matrix i18n
- `docs/softphone/adr/ADR-0021-sdk-shared-desk-call-control.md`
- PROTOCOL / SECURITY / capabilities / Feature-Registry / STATUS / CHANGELOG

## Что
- Убрана блокировка `not_owner` для call control: любой paired-клиент с capability управляет звонком
- Добавлены permissions `call.answer|reject|hangup|hold|mute`; `call.control` остаётся umbrella (+ DTMF)
- Origin matrix: гранулярные строки, миграция от старого `call.control`, sync umbrella↔granular
- Originate по-прежнему через SDK → Call Engine внутри OmniCall
- Документы синхронизированы (ADR-0017 amended note, guides); версия desktop `1.1.0`

## Зачем
- CRM и все доверенные сайты после pairing/connect/matrix видят одно состояние и управляют ответом/сбросом/hold/mic/hangup без «чужой звонок»

## Результат
- `npm test` — **2741 passed** / 1 skipped
- `npm run lint` / `typecheck` / `i18n:check` / `registry:check` / omnicall-kit `api:check` — PASS
- Transfer/conference через SDK не добавлялись
