# SDK Production-Readiness WU-06 — Docs / SemVer / workspace / licensing

**Дата:** 2026-08-02 23:30
**Статус:** выполнено
**Коммит:** —

## Где
- `omnicall-kit/examples/crm-pairing-lite/package.json`
- `omnicall-kit/guides/RELEASE-PLAYBOOK.md`, `docs/guide/*`, `docs/SECURITY.md`
- `omnicall-kit/scripts/release-publish.mjs`
- `omnicall-kit/packages/sdk/src/docs/sdk-09-examples.test.ts`
- `omnicall-kit-integration/sdk-production-readiness/{PROGRESS,11-ACCEPTANCE,10-WORK-UNITS,AGENT-CONTINUATION}.md`
- `docs/softphone/{STATUS,Feature-Registry,TASK-QUEUE}.md`, P12 handoff

## Что
- Пример CRM переведён на workspace kit `0.1.4` (без nested `@softomnitel/omnicall-kit@0.1.0`)
- Docs выровнены с npm/workspace truth: kit `0.1.4` / protocol `0.1.0`
- Licensing publish gate: `UNLICENSED` + `RELEASE_LICENSE_REVIEWED=1` fail-closed (без выдуманной лицензии)
- SemVer стратегия ADR-0027 зафиксирована (kit MINOR/PATCH; Desktop PATCH; bump только на release cut)
- sdk-09 green + regression: `call.control` не даёт `call.originate`

## Зачем
Устранить dual-package `instanceof` поломку sdk-09 и снять doc/SemVer/licensing drift перед closeout.

## Результат
- `npm ls @softomnitel/omnicall-kit` — один линк `0.1.4` → `packages/sdk`
- `npx vitest run packages/sdk/src/docs/sdk-09-examples.test.ts` — **10 passed**
- `release-publish.mjs` без `RELEASE_LICENSE_REVIEWED` — отказ на UNLICENSED
- Acceptance §F green; next WU-07
