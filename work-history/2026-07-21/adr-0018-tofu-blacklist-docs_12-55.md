# ADR-0018 TOFU Blacklist Docs

**Дата:** 2026-07-21 12:55
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/adr/ADR-0018-sdk-origin-tofu-blacklist-activate-consent.md` (новый)
- Правки: ADR-0011, ADR-0013, ADR-0015, ADR-AF-004
- `axatalk-sdk-integration/WORK-UNITS.md` (DI-11), `IMPLEMENTATION-PLAN.md`, `00-SNAPSHOT.md`, `README.md`, evidence planning
- `axatalk-sdk/docs/SECURITY.md`, `PROTOCOL.md`, guides (pairing, saved-profile, errors, installation, compatibility-matrix)
- `docs/softphone/STATUS.md`, `Feature-Registry.md`, `handoffs/P12-External-Host-API-Master-Handoff.md`
- `.cursor/skills/axatalk-sdk-integration/SKILL.md`

## Что
- Зафиксирован Accepted ADR-0018: always-on gateway, TOFU Origin, ЧС, per-Origin caps, pre-auth Axatalk SDK Settings, activate consent без паролей
- Добавлен DI-11 `pending` без кода и без закрытия F-011/P12
- Синхронизированы SECURITY/guides/handoff/Registry/STATUS

## Зачем
- Согласованная продуктовая модель Origin/activate для интеграторов без raw credentials и без деградации DI-10

## Результат
- Документы только; реализация — отдельная сессия `/sdk-integration` DI-11 после DI-10
- Raw SIP/OCP login via SDK явно deferred
