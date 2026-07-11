# Poly mute fix + headset settings UX

**Дата:** 2026-07-11 13:11
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/headset/HeadsetCapabilities.ts` (`muteEchoPolicy`)
- `src/application/headset/HeadsetSyncQueue.ts`, `HeadsetSessionOrchestrator.ts`
- `src/adapters/headset/webhid/profiles/polyGeneric.profile.ts`, `polyBw3320.profile.ts`
- `src/application/projections/headset/headsetConnectionProjection.ts`
- `src/renderer/stores/useAccountBootstrapStore.ts`, `hooks/useSettingsActions.ts`
- `src/renderer/components/settings/panels/SettingsHeadsetPanel.tsx`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md` (F-012)

## Что
- Poly: `muteEchoPolicy: swallowAll` — firmware LED bounce не вызывает unmute flicker
- LED reconcile `setMute` arm'ит echo только для Poly (`swallowAll`), Jabra pulse без изменений
- Projection: `mergeHeadsetUserSettingsIntoProjection` синхронизирует `isEnabled` при load/save settings
- UX панели: toggles + hints сверху, guided connect CTA, empty-grant / auto-reconnect hints
- i18n: ru/en/fr/de/bg — operator-friendly capabilities, новые ключи onboarding

## Зачем
- Исправить Poly mute toggle flicker (bar + headset + LED) без регресса Jabra
- Упростить подключение гарнитуры и корректный статус после включения интеграции

## Результат
- `npm run typecheck` — passed
- `npm run i18n:check` — passed
- Vitest headset suites — passed (incl. Jabra pulse bounce test)
- Manual smoke на Poly/Jabra железе — рекомендуется после `npm run dev` (full restart)
