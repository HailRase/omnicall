# SDK docs sync — no security downgrade

**Дата:** 2026-08-03 10:14
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/adr/ADR-0018*.md`, `ADR-0011`, `ADR-0015`
- `omnicall-kit/docs/SECURITY.md`, `PROTOCOL.md`, `README.md`, `packages/sdk/README.md`
- `omnicall-kit/docs/guide/*`, `omnicall-kit-integration/README.md`, `IMPLEMENTATION-PLAN.md`
- `docs/softphone/Feature-Registry.md`, corrective CLOSEOUT/PROGRESS/ACCEPTANCE

## Что
- Зафиксирован fail-closed Origin upgrade (`allowed` only) во всех SoT-доках; TOFU-on-upgrade помечен superseded.
- Синхронизированы revision/DX 0.2.0 (latest-known `getRevision`, discovery, `waitUntil`/AbortSignal).
- Integration README Current Status: F-011 `implemented` / WU-07 PASS (убран ложный gate fail).
- Guides/errors/pairing/installation/RU guide/TEST-MATRIX/Feature Registry выровнены.

## Зачем
- Убрать рассинхроны код↔доки после аудита; не допустить security downgrade (возврат TOFU-on-upgrade).

## Результат
- Документация согласована с Desktop `1.3.1` + kit `0.2.0`; код admission не ослаблен.
