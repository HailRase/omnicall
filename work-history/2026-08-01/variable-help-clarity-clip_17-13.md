# Variable help: clearer ACD copy + clip popup

**Дата:** 2026-08-01 17:13
**Статус:** выполнено
**Коммит:** —

## Где
- `ExternalServicesVariableHelpButton.tsx`
- `ExternalServices.module.css`
- `messages.ts` / `bgMessages.ts` (`variables.help.acd_phase` / `acd_event`)

## Что
- Упрощены тексты help для `acd_phase` и `acd_event` (progress/accepted, пример queued)
- Popup без `createPortal`: absolute внутри host, локальный z-index — клипится scroll-контейнером

## Зачем
- Оператору понятен смысл ACD-полей; popup не наезжает на соседние панели при скролле

## Результат
- vitest help button + messages — OK
