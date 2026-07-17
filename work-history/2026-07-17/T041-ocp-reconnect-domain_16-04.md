# T-041: OCP Reconnect token → OCP Domain

**Дата:** 2026-07-17 16:04
**Статус:** выполнено
**Коммит:** `2b2c4ce`

## Где
- `src/application/projections/integration/ocpSessionProjection.ts`
- `src/domain/integration/ocp/resolveOcpProxyAuthenticateDomain.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/services/integration/OcpAuthenticateAndConnectService.ts`
- `src/application/services/integration/OcpIntegrationComposition.ts`
- `docs/softphone/Feature-Registry.md`, `adr/ADR-AF-002-*`, `ocp-integration/*`, `TASK-QUEUE.md`, `STATUS.md`

## Что
- Подтверждена цепочка: System State «Переподключить» → `dispatchAccountRecoveryAction("reconnect")` → fresh HTTP `/proxy/authenticate`
- Корень: `entity:creds` перезаписывал `session.domain` SIP-доменом; `syncOcpLinkage` сохранял его в `ocpIntegration.domain`
- `creds` больше не трогает OCP hostname; добавлен `resolveOcpProxyAuthenticateDomain` + heal в `connectOcp`/reconnect
- Перед intentional disconnect после `beginAttempt` снова disarm transport recovery (гонка wasLive)
- Тесты + документация F-028 / ADR-AF-002 / smoke SM-8b

## Зачем
Запрос токена при OCP Reconnect должен идти на OCP Domain, а не на SIP PBX Domain из creds.

## Результат
- `npm run test && npm run lint && npm run typecheck` — green
- Версия не бампилась (corrective bugfix, не release cut)
