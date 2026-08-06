# OmniCall SDK Production-Readiness — WU-00 (design + ADR)

**Дата:** 2026-08-02 22:54
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/adr/ADR-0027-sdk-session-revision-coordinator.md`
- `omnicall-kit-integration/sdk-production-readiness/`
- `docs/softphone/Feature-Registry.md` (F-011 corrective)
- `docs/softphone/STATUS.md`, `TASK-QUEUE.md` (T-054), `handoffs/P12-External-Host-API-Master-Handoff.md`
- `src/application/integration/SdkSessionRevisionCoordinator.pending-wu01.test.ts` (skipped stub)

## Что
- Верифицированы audit-находки 1–11 против текущего кода (dual clocks, reply semantics, getRevision, dedup, pairing, docs drift)
- Найдена реальная причина падения sdk-09: dual-package `0.1.0` vs `0.1.4` ломает `instanceof` / `isOmniCallClientError`
- Принят design ADR-0027 (Application revision coordinator, single public clock)
- Опубликован remediation track WU-00…WU-07 + acceptance + continuation prompt для WU-01
- Registry/STATUS/handoff обновлены как design accepted / in progress (не implemented)

## Зачем
Зафиксировать ownership и миграцию до любых production-правок concurrency/revision для F-011.

## Результат
- WU-00 закрыт; production behavior не менялся
- `npm run registry:check` — 86 found, 0 missing
- sdk-09 по-прежнему 1 fail (ожидаемо до WU-06); assertions не ослаблялись
- Следующий шаг: WU-01 Shared revision coordinator
