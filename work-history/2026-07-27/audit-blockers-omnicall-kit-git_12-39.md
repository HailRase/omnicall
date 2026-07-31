# Audit blockers: omnicall-kit git + brand tails

**Дата:** 2026-07-27 12:39
**Статус:** выполнено
**Коммит:** —

## Где
- `omnicall-kit/` (staged в git index)
- `src/infrastructure/bootstrap/resolveOmniCallProfilesStorageRoot.ts` (+test)
- `src/domain/settings/PreferencesExportDocument.ts` (+test, `domain/index.ts`)
- `src/adapters/updates/LocalStorageUpdateBannerDismissStore.ts` (+test)
- `src/main/index.ts`, `CHANGELOG.md`
- локальная ветка → `feature/omnicall-softomnitel-rebrand`

## Что
- Застейджен `omnicall-kit/` (224 файла, без `node_modules`/`temp`) — снят Blocker untracked SDK
- Символы `*Axatalk*` / `LEGACY_AXATALK_*` переименованы в нейтральные `LEGACY_*` / `migrateLegacyAppDataIfNeeded`
- CHANGELOG 1.0.0 без прямых имён старого бренда в prose
- Живой tree: только 4 LEGACY string-литерала миграции (+ тест format id)

## Зачем
Закрыть merge-ready Blocker аудита и убрать бренд-хвосты из идентификаторов/доков, сохранив миграцию старых путей на диске.

## Результат
- `git ls-files omnicall-kit` = 224; untracked kit = нет
- vitest migration/preferences/dismiss/boundary: 18 passed
- На диске нет `axatalk-sdk` / `axatalk-sdk-integration`
