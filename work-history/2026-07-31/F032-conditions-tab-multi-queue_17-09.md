# F-032: вкладка Условия и несколько очередей

**Дата:** 2026-07-31 17:09
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/integration/external-applications/`
- `src/renderer/components/settings/external-applications/`
- docs F-032 / STATUS / I18N

## Что
- «Условия» вынесены в отдельную вкладку
- Список очередей `queueNames[]` вместо одной строки; пустой список = любая
- Убран switch «Нужен номер» (не нужен в вашей модели трафика)
- Направление по умолчанию «Любое»; schema **v16** + миграция v15 `queueNameEquals`

## Зачем
- UX яснее; поддержка нескольких очередей без лишнего фильтра по caller id

## Результат
- targeted vitest PASS · typecheck PASS
