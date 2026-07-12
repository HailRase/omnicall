# Headset agent onboarding docs

**Дата:** 2026-07-11 14:12
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/HEADSET-AGENT-ONBOARDING.md` (новый)
- `docs/softphone/HEADSET-SYNC-CONTRACT.md`, `HEADSET-VENDOR-ONBOARDING.md`
- `docs/softphone/handoffs/P10-Headset-Integration-Handoff.md`, `P10-Headset-Extensibility-Handoff.md`
- `docs/softphone/README.md`, `AGENTS.md`
- `guides/README.md`, `guides/Cursor-Agents-Guide.md`

## Что
- Единая карта слоёв, потоков mute/connect/auto-reconnect для агентов
- Таблица Jabra vs Poly, decision tree «куда править»
- Обновлён sync contract (`muteEchoPolicy`, arm echo только Poly)
- Vendor onboarding: выбор echo policy, порядок профилей
- Ссылки из AGENTS.md, guides, document map

## Зачем
- Агенты быстро понимают где UI, Application, adapter и что не ломать при правках F-012

## Результат
- Документация only; код не менялся
