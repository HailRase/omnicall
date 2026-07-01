# Call UI parity gate closure

**Дата:** 2026-07-01 10:40
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/handoffs/P11-Call-UI-Design-Parity-Handoff.md`
- `docs/softphone/UI-Component-Catalog.md`
- `docs/softphone/STATUS.md`
- `src/renderer/components/call/CallControlsBar.stories.tsx`
- `src/renderer/components/call/DtmfKeypadPanel.stories.tsx`
- `src/renderer/widgets/SoftphoneLayout/SoftphoneLayout.stories.tsx`

## Что
- Закрыт gate checklist handoff T-007 (task 8 done, 916 tests)
- Регенерирован UI-Component-Catalog (`transfer-target-divider` для TransferPanel)
- Storybook Light/Dark: CallControlsBar, DtmfKeypadPanel
- SoftphoneLayout stories: theme decorator + LightZones/DarkZones
- STATUS.md: test count 916, дата верификации 2026-07-01

## Зачем
Закрыть blockers/high/low после `/review` gate_fail для P11 Call UI Design Parity.

## Результат
- `npm run test`: 916 passed, 1 skipped
- `npm run lint`, `typecheck`: green
- `ui:catalog:check`: green после коммита каталога (рабочая копия синхронизирована)
