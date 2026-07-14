# OCP status selector UI polish

**Дата:** 2026-07-14 17:05
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/widgets/OperatorStatusSelector/`
- `src/renderer/hooks/useOperatorStatusSelector.ts`
- `src/renderer/components/integration/ocp/OcpPostCallStatusModal.*`
- `src/renderer/components/integration/ocp/OcpStatusDropdown.*`
- `src/renderer/shells/SoftphoneShellHeader.module.css`

## Что
- Чип показывает только reason («Доступен»), не «Готов»/«Входящий»; при RINGING сохраняется последний reason
- Убран box-shadow; hover меняет border на `--color-status-online`
- Селектор не расширяет softphone: `min-width:0`, ellipsis + title tooltip
- Чуть уменьшены padding/font таймера и label
- Post-call модалка: один шаг (статус + выбор + Отмена/Подтвердить), без крестика и Step 2

## Зачем
Довести UX селектора и post-call диалога до читаемого компактного вида без расширения окна.

## Результат
Фокусные тесты зелёные; lint/typecheck/i18n/ui:catalog green. T-028 done.
