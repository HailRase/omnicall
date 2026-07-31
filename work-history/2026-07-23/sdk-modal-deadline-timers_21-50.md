# SDK modal deadline timers

**Дата:** 2026-07-23 21:50
**Статус:** выполнено
**Коммит:** —

## Где
- `src/shared/integration/sdkOperatorModalTimeouts.ts`
- `src/shared/integration/formatMmSsCountdown.ts`
- `src/renderer/components/integration/SdkModalDeadlineTimer.tsx`
- `src/renderer/components/integration/SdkConnectCeremonyModal.tsx`
- `src/renderer/components/integration/SdkActivateProfileConsentModal.tsx`
- `src/renderer/hooks/useSdkConnectCeremony.ts`
- `docs/softphone/adr/ADR-0018-*.md`, `ADR-0016-*.md`, `Feature-Registry.md`

## Что
- SSoT TTL для операторских SDK-модалок (consent 120s, Origin/pairing 5 min, waiting 45s)
- Приглушённый countdown `MM:SS` в header (token `--color-text-muted`, light/dark)
- `expiresAt` в projections Origin trust + activate consent
- IPC `cancelOriginTrust` на expiry TOFU (без blacklist)
- Документация ADR-0018 §G.6 / ADR-0016 / guide / Feature Registry

## Зачем
- Оператор видит дедлайн на каждой модалке без урезания TTL до 30 с и без смены wire-семантики ошибок SDK.

## Результат
- Focused vitest + `i18n:check` + eslint/tsc по затронутым файлам — OK
- Версию не бампил (F-011 in progress, не release cut)
