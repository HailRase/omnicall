# i18n FR/DE overrides fragments

**Дата:** 2026-07-04 16:28
**Статус:** выполнено
**Коммит:** —

## Где
- `scripts/i18n-fr-overrides.fragment.ts`
- `scripts/i18n-de-overrides.fragment.ts`

## Что
- Сформированы фрагменты по 357 ключей — полное соответствие `scripts/i18n-en-overrides.fragment.ts`
- Французские и немецкие переводы в стиле существующих `frMessages`/`deMessages` (ASCII, без кириллицы)
- Покрыты namespace: common, bootstrap, account, header.userMenu, registration, queue, dialpad, call, incoming/outgoing, transfer, campaign, activeCall, status, session, recovery, sipRegistration, settings.sessions/diagnostics/codecs/headset/systemState, connection.recovery, shell.overlay, ocp.toast, call.remoteAudio
- Функциональные ключи с `(params) => \`...\`` по тем же param-именам, что в EN
- 0 пересечений с уже переопределёнными ключами в `frMessages`/`deMessages` (settings.* … multi.call.disabled.*)

## Зачем
Подготовить paste-ready фрагменты для завершения французской и немецкой локализации UI без наследования русских/английских строк.

## Результат
- Проверка: 357/357 ключей в каждом фрагменте, 0 пропусков, 0 дубликатов с существующими FR/DE overrides, 0 кириллицы
- Файлы готовы к вставке в `frMessages`/`deMessages` перед закрывающей `};`
