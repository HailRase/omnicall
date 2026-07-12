# Video Calls WU3 — application plumbing

**Дата:** 2026-07-09 22:53
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/use-cases/telephony/`
- `src/application/services/telephony/`
- `src/application/projections/media/CallVideoMediaProjection.ts`
- `src/ports/telephony/TelephonyGateway.ts`
- `src/adapters/mock/MockTelephonyGateway.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`

## Что
- Прокинут опциональный `mediaMode` через MakeCall/AnswerCall, CallEngine и TelephonyGateway.
- Добавлена in-memory проекция `CallVideoMediaState` по `callId` с аудио-режимом по умолчанию.
- Добавлена публикация `CallMediaModeSelected` для исходящего и принятого входящего звонка.
- Mock gateway сохраняет команды для проверки выбранного режима.
- JsSIP принимает video intent, логирует отложенную поддержку и сохраняет audio-only SDP.
- Обновлены F-026, STATUS и тесты application/adapter.

## Зачем
- Подготовить типизированный per-call video intent без риска для существующего аудио-тракта.

## Результат
- `npm run test`: 1609 passed, 1 skipped; `npm run lint`, `npm run typecheck`, `npm run registry:check`: успешно.
