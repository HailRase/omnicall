# Manual reregister + auth retry policy

**Дата:** 2026-07-02 16:53
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/application/use-cases/ReregisterSipUseCase.ts`
- `src/application/projections/sipSessionHealthProjection.ts`
- `src/application/services/SipRecoveryOrchestrationService.ts`
- `docs/softphone/Feature-Registry.md` (F-014)

## Что
- `unregisterAllContacts` пропускает `unregister`, если UA не зарегистрирован — ручная перерегистрация после 403 снова вызывает `register()`
- `ReregisterSipUseCase` публикует `ManualSipReregisterRequested` для корректной проекции
- `RegistrationRequested` очищает `lastFailureReason` (убран stale «forbidden» в UI)
- Удалена логика немедленной остановки auto-retry на 401/403 в `SipRecoveryOrchestrationService`
- Тесты адаптера, use case, orchestration, integration; обновлён Feature Registry

## Зачем
После ошибки регистрации кнопка «Перерегистрировать» зависала на `unregister` без REGISTER на сокете; пользователь просил не отключать автоперерегистрацию на auth-ошибках.

## Результат
`npm run test` — 1025 passed, 1 skipped; `npm run lint` и `npm run typecheck` — OK.
