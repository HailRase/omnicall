# Auto-answer edge-case policy

**Дата:** 2026-06-30 12:00
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/telephony/resolveAutoAnswerSchedule.ts`
- `src/application/services/IncomingCallOrchestrator.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/helpers/formatAutoAnswerCountdownLabel.ts`

## Что
- «Активная сессия» = любая нетерминальная сессия кроме целевого входящего (Ringing/Connecting/Active/Held/Transferring)
- Глобальные блоки: исходящий Connecting, transfer mode / Transferring / transfer session
- Таймеры per-callId; peer-policy только при постановке; при срабатывании — settings + global block + hold-all
- `refreshAutoAnswerSchedules` при сохранении UserSettings
- UI: «Автоответ немедленно» при 0 с

## Зачем
Уточнение edge-cases автоответа по решениям оператора/пользователя.

## Результат
- `npm run test` — green
- `npm run lint` — green
