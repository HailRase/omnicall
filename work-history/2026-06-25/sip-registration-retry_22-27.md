# SIP registration retry (F-014)

**Дата:** 2026-06-25 22:27
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/telephony/events/sipRegistrationRetryEvents.ts`
- `src/domain/settings/SipRecoverySettings.ts`, `UserSettings.ts`, `validateUserSettings.ts`
- `src/application/services/ConnectionRecoveryOrchestrationService.ts`
- `src/application/use-cases/ReregisterSipUseCase.ts`
- `src/application/projections/connectionRecoveryProjection.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/renderer/components/recovery/ConnectionOverlay.tsx`
- `src/renderer/components/settings/SettingsOverlay.tsx`
- `docs/softphone/Feature-Registry.md` (F-014)

## Что
- Разделены transport (`SipReconnect*`) и registration (`SipRegistrationRetry*`) recovery-потоки
- `RegistrationFailed` → `sip_registration_failed` (не «connection lost»); retry через `reregister()` без нового сокета
- Flat policy 5×5s per-user: `sipAutoReregisterEnabled`, `sipReregisterIntervalSec`, `sipReregisterMaxAttempts`
- Пауза retry при активных звонках; сброс таймеров при сохранении настроек
- `ReregisterSipUseCase` + кнопка re-register; RU-маппинг причин в overlay
- JsSIP `connection_recovery` 300s — retry владеет Application

## Зачем
Исправить misleading UX при ошибке REGISTER при живом WebSocket и дать настраиваемый auto/manual re-register по спецификации LF-008/LF-010.

## Результат
`npm run test` 697 passed, 1 skipped; `npm run lint` + `npm run typecheck` green.
