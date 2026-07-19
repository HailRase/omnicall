# Identity в avatar menu + clamp ширины status selector

**Дата:** 2026-07-19 14:57
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/header/UserAvatarMenu.tsx`
- `src/renderer/components/header/UserHeaderIdentity.tsx`
- `src/renderer/shells/SoftphoneShellHeader.tsx`
- `src/renderer/widgets/OperatorStatusSelector/*`
- `src/renderer/components/integration/ocp/OcpStatusDropdown.module.css`
- `docs/softphone/Feature-Registry.md`, `TASK-QUEUE.md`, `STATUS.md`

## Что
- Логин + SIP-статус (с таймером) перенесены в popup аватара как non-selectable header (`role="presentation"`) + Separator
- Из основного header убран inline identity — слот занят `OperatorStatusSelector`
- Label chip: `width:0` + ellipsis + `IconTooltip` при truncation; длинный статус не расширяет shell
- Dropdown options: ellipsis + `overflow-x: hidden` на content
- Тесты menu identity order / header без identity / truncation host

## Зачем
Освободить ширину header под OCP status selector и убрать рост окна при длинном названии статуса, без потери SIP identity UX.

## Результат
- `npm run test` — 2263 passed / 1 skipped
- `npm run lint` + `typecheck` + `ui:catalog` — green
- TASK-QUEUE T-046 done; Feature Registry F-016 / F-028 evidence обновлён
