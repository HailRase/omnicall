# Video calls WU5: JsSIP video

**Дата:** 2026-07-09 23:11
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/`
- `src/infrastructure/bootstrap/createRealAccountBootstrap.ts`
- `src/application/services/telephony/CallEngine.ts`
- `docs/softphone/STATUS.md`, `docs/softphone/Feature-Registry.md`

## Что
- Включён video SDP для `mediaMode: video` при безопасном audio-only значении по умолчанию.
- Подключён опциональный локальный capture с privacy-muted video track и выбранными устройствами.
- Добавлены remote no-video SDP detection и обновление `CallVideoMediaProjection`.
- Видео codec preferences подключены к transceiver и SDP munging путям.
- Добавлены unit/integration тесты; устранены lint-ошибки WU4 capture-тестов.

## Зачем
- Завершить F-027 WU5 и подготовить проверенный SIP/WebRTC media path для UI WU6.

## Результат
- `npm run test`: 1629 passed, 1 skipped; `npm run lint`: PASS; `npm run typecheck`: PASS.
