# Auto-answer sessions settings

**Дата:** 2026-06-30 11:45
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/telephony/resolveAutoAnswerSchedule.ts`
- `src/domain/settings/UserSettings.ts`
- `src/application/services/IncomingCallOrchestrator.ts`
- `src/renderer/components/settings/panels/SettingsSessionsPanel.tsx`
- `src/renderer/hooks/useSettingsActions.ts`

## Что
- Доменная политика `resolveAutoAnswerSchedule` / `shouldScheduleAutoAnswer` (таймаут 0…300 с, включая 0)
- Поле `UserSettings.autoAnswerDuringActiveSessionEnabled` — автоответ при активной сессии с hold-all
- `IncomingCallOrchestrator`: перечитывает настройки при срабатывании таймера; hold через существующий `answerCall` → `holdAllActiveLines`
- UI в настройках «Сессии»: включение автоответа, задержка, опция «при активном звонке»
- Тесты: domain, CallEngine, SettingsSessionsPanel

## Зачем
Реализовать LF-016/LF-076: управляемый автоответ без прерывания текущего разговора, с архитектурно чистой политикой в Domain и оркестрацией в Application.

## Результат
- `npm run test` — 874 passed, 1 skipped
- `npm run lint` — green
