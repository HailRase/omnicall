# /sdk-review DI-11 — FAIL

**Дата:** 2026-07-21 15:53
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk-integration/WORK-UNITS.md` (DI-11 остаётся `review`)
- `axatalk-sdk-integration/evidence/DI-11-origin-tofu-blacklist-activate.md`
- `docs/softphone/STATUS.md`, Feature-Registry, P12 handoff
- `src/main/index.ts`, `registerSdkGateway.ts`, `useSdkSettingsPanel.ts`

## Что
- Независимый re-gate DI-11 only после lint/matrix-off follow-up
- Подтверждено: lint PASS; focused desktop **36/36**; SDK origin tests **6/6**; `api:check` PASS
- Prior remediations держатся (dismiss≠deny, matrix-off, empty-caps fail-closed, AF-004 SDK pre-auth)
- Gate **FAIL** — Blocker: persisted Origin trust/blacklist не гидратируется в gateway при старте; env seed может снова `allowed` для denied Origins

## Зачем
Закрыть или отклонить DI-11 (ADR-0018) без преждевременного F-011/P12 close.

## Результат
**FAIL** (1 Blocker). High: §C.4 machine/common vs account buckets; docs drift. Next: refactor DI-11 boot hydrate → `/sdk-review` DI-11 only. Не изобретать DI-12.
