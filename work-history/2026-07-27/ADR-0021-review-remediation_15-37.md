# ADR-0021 review remediation (docs + matrix normalize)

**Дата:** 2026-07-27 15:37
**Статус:** выполнено
**Коммит:** —

## Где
- `omnicall-kit/docs/SECURITY.md`, `guide/capabilities.md`, `WORK-UNITS.md`
- `CHANGELOG.md` — секция `[1.1.0]`
- `docs/softphone/adr/ADR-0012-…`, `ADR-0021-…`, `STATUS.md`, `Feature-Registry.md`
- `src/domain/settings/SdkOriginTrust.ts` — `normalizeSdkOriginCallMatrix`
- parse/write: `SdkIntegrationSettings.ts`, `sdkOriginTrustMutations.ts` + тесты

## Что
- SECURITY: Call controller = shared desk; новый раздел residual XSS risk + mitigations
- CHANGELOG: notes ADR-0021 / pairing-toast fixes перенесены в `[1.1.0]`; Unreleased очищен
- ADR-0012: ownership gate помечен superseded (0017/0021); WORK-UNITS race checklist без ownership-`not_owner`
- Matrix: на parse/allow/setOriginMatrix umbrella = AND(granular), без silent-enable granular
- Registry / STATUS / ADR-0021 / capabilities guide синхронизированы

## Зачем
- Закрыть High/Low из security+architecture review без изменения call-control path и без downgrade capabilities

## Результат
- Focused vitest domain/settings/call — PASS (37)
- `npm run i18n:check` / `registry:check` / `typecheck` — PASS
- Call path / pairing / `call.control` umbrella не сужались для consistent matrices
