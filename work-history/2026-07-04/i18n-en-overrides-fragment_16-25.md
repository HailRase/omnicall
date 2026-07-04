# i18n EN overrides fragment

**Дата:** 2026-07-04 16:25
**Статус:** выполнено
**Коммит:** —

## Где
- `scripts/i18n-en-overrides.fragment.ts`

## Что
- Сформирован фрагмент из 357 английских переводов для ключей `ruMessages`, не переопределённых в `enMessages`
- Покрыты namespace: common, bootstrap, account, header.userMenu, registration, queue, dialpad, call, incoming/outgoing, transfer, campaign, activeCall, status, session, recovery, sipRegistration, settings.sessions/diagnostics/codecs/headset/systemState, connection.recovery, shell.overlay, ocp.toast, call.remoteAudio
- Функциональные ключи с `(params) => \`...\`` по типам ru
- Исключены ~111 ключей, уже переопределённых в enMessages (settings.* … multi.call.disabled.*)

## Зачем
Подготовить paste-ready фрагмент для завершения английской локализации UI без наследования русских строк.

## Результат
- Проверка: 357/357 ключей, 0 пропусков, 0 дубликатов с существующими en overrides
- Файл готов к вставке в `enMessages` перед закрывающей `};`
