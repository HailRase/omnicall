# SDK finish-appeal (post-call)

**Дата:** 2026-07-23 16:50
**Статус:** выполнено
**Коммит:** `8b10484`

## Где
- `axatalk-sdk/packages/protocol` — `operator:finish-appeal`, статус `post_call_processing`
- `axatalk-sdk/packages/sdk` — `client.operator.finishAppeal`
- `src/application/integration` — handler/port/Facade binding, status map, error map
- `src/adapters/integration` — capability + inbound route
- Docs: PROTOCOL, ADR-0017, guide, Feature Registry, DI-07/SDK-07 evidence

## Что
- Добавлена публичная команда `operator:finish-appeal` (cap `operator.status.write`)
- Публичный статус `post_call_processing` для CRM-видимости кнопки
- Desktop: OCP-login gate + `FinishPostCallAppealUseCase` с `callType: "sdk"`
- Ошибка вне поствызывной → `conflict` + `failure_kind: not_in_post_call_processing`
- UI-путь finish без изменений (default `callType: "internal"`)
- Синхронизированы PROTOCOL / ADR-0017 / guides / api inventory (48) / evidence

## Зачем
Дать CRM ту же возможность «Завершить обращение», что в Axatalk UI, с валидацией OCP-логина и статуса поствызывной обработки.

## Результат
- `axatalk-sdk`: build, `api:check`, `docs:check`, operator/protocol tests — PASS
- Desktop focused tests (handler/port/mapper/snapshot/route/FinishPostCall UC) — PASS
- Downgrade существующих change-status / logout / UI finish — нет
