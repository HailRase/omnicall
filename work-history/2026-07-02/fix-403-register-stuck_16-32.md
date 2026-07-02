# Fix 403 REGISTER stuck in «Регистрация»

**Дата:** 2026-07-02 16:32
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/telephony/mapSipRegistrationFailureFromParts.ts`
- `src/adapters/telephony/jssip/extractJsSipRegistrationFailureParts.ts`
- `src/adapters/telephony/jssip/awaitJsSipRegistration.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/application/services/SipRecoveryOrchestrationService.test.ts`

## Что
- Извлечение SIP `status_code` из JsSIP `registrationFailed` (403 + cause `Rejected`)
- Маппинг 403 → `forbidden` через `mapSipRegistrationFailureFromParts`
- Остановка auto-reregister на auth-ошибке вместо повторного `registering`
- +7 unit-тестов (403 Rejected, orchestration terminal fail)

## Зачем
При `SIP/2.0 403 Forbidden` JsSIP отдавал cause `Rejected` без кода; оркестратор считал ошибку retryable и снова ставил «Регистрация», сводка оставалась «Соединение».

## Результат
`npm run test` 1025 passed, 1 skipped; lint/typecheck green. После перезапуска dev при 403 ожидается «Ошибка» / «Не зарегистрирован» и сообщение про логин/пароль.
