# DI-00 ADRs Baseline P12 Handoff

**Дата:** 2026-07-20 11:46
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/adr/ADR-0009-sdk-process-ownership-broker-lifecycle.md`
- `docs/softphone/adr/ADR-0010-sdk-local-transport-endpoint-discovery.md`
- `docs/softphone/adr/ADR-0011-sdk-pairing-origin-capabilities.md`
- `docs/softphone/adr/ADR-0012-sdk-protocol-versioning-privacy-ownership.md`
- `docs/softphone/adr/ADR-0013-sdk-window-policy-and-signin.md`
- `docs/softphone/handoffs/P12-External-Host-API-Master-Handoff.md`
- `axatalk-sdk-integration/evidence/DI-00-baseline.md`
- `axatalk-sdk-integration/WORK-UNITS.md`, `00-SNAPSHOT.md`, `IMPLEMENTATION-PLAN.md`, `README.md`
- `axatalk-sdk/docs/PROTOCOL.md`, `axatalk-sdk/docs/WORK-UNITS.md` (SDK-01 refs)
- `docs/softphone/Feature-Registry.md` (F-011), `STATUS.md`, `Implementation-Roadmap.md`, `Legacy-Feature-Coverage.md`

## Что
- Закрыты architecture/security policy ADR для F-011/P12 (ownership, transport, pairing, protocol/privacy, window+AF-003)
- Детализирован P12 handoff с гейтами DI-01…DI-10 и open decisions → SDK-01
- Зафиксирован automated baseline: release:preflight PASS (2297/1 skipped); i18n PASS; ui:catalog drift зафиксирован
- Синхронизированы planning-ссылки F-011/STATUS/LF/roadmap без claim `implemented`
- Production `src/` и runtime deps не трогались

## Зачем
Architecture gate DI-00 для безопасного старта External Host API / Axatalk SDK без второго Facade и без raw credentials в protocol v1.

## Результат
DI-00 в статусе `review`. Следующий шаг: `/sdk-review`. После PASS — SDK-00 (`/sdk-project`), затем SDK-01; DI-01 не начинать.
