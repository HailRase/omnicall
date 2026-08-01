# F-033: каталог входящих рингтонов

**Дата:** 2026-08-01 18:38
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/media/IncomingRingtoneId.ts`
- `src/domain/settings/UserSettings.ts` (schema **v18**)
- `src/adapters/media/browser/WebAudioTonePlayer.ts`, `ringtonePresets.ts`, `BrowserMediaAdapter.ts`, `ArbiterMediaGateway.ts`
- `src/renderer/components/settings/panels/SettingsRingtoneSection.tsx`
- `src/renderer/components/icons/iconCatalog.ts`, `docs/softphone/Icon-Registry.md`
- `docs/softphone/P11-Incoming-Ringtone-Catalog-Design.md`, Feature-Registry, STATUS, Legacy, I18N-Coverage

## Что
- Каталог из 12 WebAudio-пресетов; default `classic` = прежний dual-tone 440/480
- Settings → Sessions: выбор + preview; configure на init/save/import
- Миграция v17→v18; unknown id → `classic` без падения load
- Tone FSM / orchestrator playRingtone без изменений контракта приоритетов
- i18n ru/en/fr/de/bg для `settings.sessions.ringtone.*`
- Icon-only toggle preview: `Volume2` / `VolumeX` через UI Kit `IconButton` (outline idle → primary playing); без видимого текста; удалены мёртвые ключи `settings.sessions.ringtone.preview*`

## Зачем
- Дать пользователю ≥10 различимых мелодий входящего без OEM-ассетов и без audible downgrade

## Результат
- Targeted tests PASS (ringtone, migrate, Sessions UI toggle, TonePlaybackPriority, IncomingCallFlow, messages parity)
- `npm run i18n:check` PASS · `tsc` web PASS · `npm run registry:check` 81/0
- SemVer MINOR — pending `/release` (user-visible)
