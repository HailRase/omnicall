# Reserved status chrome в OperatorStatusSelector

**Дата:** 2026-07-23 22:44
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/integration/operatorStatusPresentation.ts`
- `src/renderer/hooks/useOperatorStatusSelector.ts`
- `src/renderer/widgets/OperatorStatusSelector/OperatorStatusSelector.stories.tsx`
- `docs/softphone/Feature-Registry.md` (F-028)
- `axatalk-sdk/docs/guide/operator-status-reservation.md`
- `axatalk-sdk-integration/evidence/DI-05-operator-reserved-observability.md`

## Что
- Добавлен pure-хелпер `resolveOperatorStatusOptionIsCurrent`: idle Ready/Break по `reasonId`, busy/PCP — по `reservedStatus`/`reservedReasonId`
- Селектор подсвечивает зарезервированный перерыв/Ready в dropdown (chip остаётся системным)
- Story `PostCallFinishAppeal*` показывает reserved `isCurrent`
- Документация: finish без локального booking → Ready; anti-pattern CRM finish без подтверждённого `kind: "reserved"`
- Use Case finish path не менялся (нет даунгрейда FSM)

## Зачем
- Во время поствызова в Axatalk должно быть видно зарезервированный статус; убрать рассинхрон ожидания UI и SDK CRM

## Результат
- Фокус-тесты: 42 passed (`operatorStatusPresentation`, `useOperatorStatusSelector`, `FinishPostCallAppeal`, projection/machine)
- Версия SemVer не поднималась (точечный UX-fix F-028, не release cut)
