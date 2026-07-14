# Fix OCP status selector regressions

**Дата:** 2026-07-14 17:15
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useOperatorStatusSelector.ts`
- `src/renderer/widgets/OperatorStatusSelector/OperatorStatusSelector.module.css`
- `src/renderer/widgets/OperatorStatusSelector/OperatorStatusSelector.tsx`
- `src/renderer/shells/SoftphoneShellHeader.module.css`

## Что
- Восстановлен height чипа (`min-height: 2.125rem`, прежний padding)
- Жёсткий `max-width: min(11.5rem, 42%)` на слоте — без расширения softphone
- Исправлена регрессия лейбла: lookup по parent-status; sticky только для system busy; Break→Ready больше не держит текст перерыва
- Optimistic label сразу после клика; idle fallback на statusLabelKey если reason пуст

## Зачем
Убрать hard-regression отображения статусов и вернуть корректный размер/ширину селектора.

## Результат
Тесты hook/widget зелёные; lint/typecheck green.
