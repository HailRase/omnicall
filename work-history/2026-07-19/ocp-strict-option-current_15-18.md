# Strict isCurrent для OCP dropdown options

**Дата:** 2026-07-19 15:18
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useOperatorStatusSelector.ts`
- `src/renderer/hooks/useOperatorStatusSelector.test.ts`
- `docs/softphone/Feature-Registry.md`

## Что
- Убран fallback «единственный Ready = current» при Preparing / reasonId 0
- `isCurrent` только при `status === READY|BREAK` и `reasonId === option.id`
- Preparing / Ringing / Talking / unmatched reason → ни один option не active

## Зачем
При входе в OCP статус «Подготовка к работе» ошибочно подсвечивал «Доступен».

## Результат
- `useOperatorStatusSelector` tests — 19/19 green
