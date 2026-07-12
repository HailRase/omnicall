# SIP video codec priority and settings

**Дата:** 2026-07-12 14:53
**Статус:** выполнено
**Коммит:** `—`

## Где
- `src/domain/media`
- `src/application/settings`
- `src/renderer/components/settings/panels`
- `src/renderer/i18n`
- `docs/softphone/P11-Codec-Preferences-Design.md`
- `docs/softphone/P13-Video-Calls-Design.md`

## Что
- Изменён дефолтный порядок видеокодеков на SIP-first: `h264 -> vp8 -> vp9 -> av1`.
- Добавлен доменный инвариант: нельзя отключить последний включённый видеокодек.
- Валидация `codecPreferences` дополнена правилом «минимум один видеокодек включён».
- В UI `SettingsCodecsPanel` включены toggle/reorder для видеокодеков и блокировка только последнего активного.
- Добавлен новый ключ ошибки `settings.codecs.errors.lastVideoCodecRequired` для `ru/en/fr/de/bg`.
- Обновлены тесты domain/application/renderer и дизайн-документация по кодекам.

## Зачем
- Повысить совместимость видеозвонков в SIP-среде за счёт более надёжного дефолтного приоритета кодеков.
- Сделать пользовательские настройки видеокодеков реально применяемыми и безопасными от нерабочих конфигураций.

## Результат
- Все целевые тесты по кодекам и JsSIP-пути пройдены успешно.
- `npm run i18n:check` пройден успешно.
- Изменения внесены без затрагивания активных сессий и с сохранением fallback-механизмов WebRTC/SDP.
