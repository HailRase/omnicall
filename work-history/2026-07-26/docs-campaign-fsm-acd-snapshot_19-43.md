# Документация: campaign FSM + ACD snapshot

**Дата:** 2026-07-26 19:43
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/OCP-Call-Context.md`
- `docs/softphone/adr/ADR-0019-sdk-campaign-events-v1.md`
- `docs/softphone/adr/ADR-0020-sdk-ocp-acd-context-wire.md`
- `axatalk-sdk/docs/PROTOCOL.md`
- `axatalk-sdk/docs/guide/events.md`
- `docs/softphone/STATUS.md`
- `docs/softphone/Feature-Registry.md`
- `axatalk-sdk/packages/protocol/CHANGELOG.md`

## Что
- Описан campaign single-modal FSM (`idle` / `preview_offered` / `progressive_offered`, слоты `activeCampaign` / `progressiveContext` / `pendingPreview`)
- Зафиксирован hold второго preview вместо supersede; Cleared→Offered при promote; progressive под preview без SDK Offered
- Документировано snapshot recovery: `operator.campaign` и additive `calls[].acdContext` (ADR-0020)
- Обновлены ADR-0019/0020, PROTOCOL, events guide, STATUS, Feature-Registry (F-011/F-028), protocol CHANGELOG
- Production-код не менялся

## Зачем
- Синхронизировать docs с уже реализованным desktop/SDK поведением без расхождений для агентов и CRM-хостов

## Результат
- Документация отражает hold-until-idle и ACD snapshot recovery; `reasonCode: superseded` сохранён в протоколе как совместимость
