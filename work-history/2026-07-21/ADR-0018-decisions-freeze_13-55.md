# ADR-0018 decisions freeze (docs)

**Дата:** 2026-07-21 13:55
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/adr/ADR-0018-sdk-origin-tofu-blacklist-activate-consent.md`
- `docs/softphone/adr/ADR-0009-…`, `ADR-0011-…`, `ADR-0015-…`, `ADR-AF-004-…`
- `docs/softphone/handoffs/P12-External-Host-API-Master-Handoff.md`
- `docs/softphone/STATUS.md`, `Feature-Registry.md`
- `axatalk-sdk/docs/PROTOCOL.md`, `SECURITY.md`, `guide/errors.md`, `pairing-quick-start.md`, `saved-profile-activation.md`
- `axatalk-sdk-integration/WORK-UNITS.md`, `IMPLEMENTATION-PLAN.md`, `TEST-MATRIX.md`, `README.md`
- `axatalk-sdk-integration/evidence/DI-11-origin-tofu-blacklist-activate-planning.md`

## Что
- Зафиксированы продуктовые решения в ADR-0018 (TOFU modal, Unblock restore, activate pending, renderer UI, коды ошибок)
- Исправлен dual-SoT ADR-0009 (rollback = env kill-switch, не Settings toggle)
- ADR-0015 CORS для `unknown`+`allowed`; AF-004 Context/Consequences; P12 close = DI-10+DI-11
- Обновлены guides, TEST-MATRIX, planning evidence; код не трогался

## Зачем
- Закрыть Blocker/High из независимого docs/architecture review, чтобы DI-11 можно было реализовывать без изобретения политики

## Результат
- Документы синхронизированы с решениями владельца продукта; F-011/`implemented` не выставлялся; SemVer не менялся; готов повторный `/sdk-review` planning package
