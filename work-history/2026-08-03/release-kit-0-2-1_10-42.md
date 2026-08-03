# Release kit 0.2.1 + docs sync

**Дата:** 2026-08-03 10:42
**Статус:** выполнено
**Коммит:** `b9ddc99`

## Где
- `omnicall-kit/packages/sdk` (`0.2.1`), README, CHANGELOG, `SDK_VERSION`
- ADR-0018/0011/0015, SECURITY, guides, integration README, STATUS
- npm `@softomnitel/omnicall-kit@0.2.1` (`latest`)

## Что
- Синхронизация docs с fail-closed Origin upgrade (без security downgrade).
- PATCH kit `0.2.0` workspace → `0.2.1`; published to npm `latest`.
- Desktop остаётся `1.3.1` (docs-only для softphone; без нового installer cut).
- Удалён tracked `omnicall-kit/.npmrc`; `.npmrc` добавлен в `.gitignore`.

## Зачем
- Отдать интеграторам актуальный npm README + admission contract; закрыть publish gap
  (на registry до этого был максимум `0.1.4`, workspace `0.2.0` не был на npm).

## Результат
- `npm view @softomnitel/omnicall-kit version` → `0.2.1` (`latest`)
- Kit preflight / release:check PASS перед publish
- Токен npm не коммитился; рекомендована ротация после paste в чат
