# OCP status selector UX fix

**Дата:** 2026-07-14 17:33
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useOperatorStatusSelector.ts`
- `src/renderer/components/integration/ocp/OcpStatusDropdown.tsx`
- `src/renderer/widgets/OperatorStatusSelector/`
- `src/renderer/shells/SoftphoneShellHeader.module.css`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`

## Что
- Дропдаун показывает текущий reason первым (`currentItems` + группа «Текущий»), затем Ready/Break без дубля
- Break→Break подтверждён в hook/Use Case (другой break-reason остаётся кликабельным)
- Слот селектора заполняет оставшуюся ширину хедера до края softphone (`max-width: 100%`, `min-width: 0`), без расширения окна
- Длинный label обрезается ellipsis; при truncation — `IconTooltip` с полным названием
- i18n `ocp.dropdown.currentGroup` (ru/en/fr/de/bg)

## Зачем
Исправить UX селектора статусов OCP: текущий статус сверху, смена перерыва на перерыв, корректная ширина без раздувания softphone.

## Результат
`npm run test` — 2041 passed, 1 skipped; lint/typecheck/i18n green. T-029 done.
