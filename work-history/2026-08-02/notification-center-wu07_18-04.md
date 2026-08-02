# F-034 WU-07 — F-030 Notification Center portability

**Дата:** 2026-08-02 18:04
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/PreferencesExportDocument.ts` (+ tests)
- `src/application/use-cases/settings/OperatorPreferencesUseCases.test.ts`
- `docs/softphone/P11-Operator-Preferences-Export-Design.md`
- `docs/softphone/Feature-Registry.md` (F-030 / F-034)
- `notification-center/PROGRESS.md`, `10-WORK-UNITS.md`, `06-PERSISTENCE-EXPORT.md`
- `docs/softphone/STATUS.md`, `TASK-QUEUE.md`, `handoffs/P15-Notification-Center-Master-Handoff.md`

## Что
- Закреплён F-030 round-trip вложенных `notificationPreferences` (master / appearance / modules)
- Добавлен migrate v13 flat→nested внутри bundle и fail-closed на malformed current-schema prefs
- Use Case: import в active profile + отсутствие мутации при invalid import; journal excluded
- Синхронизированы design F-030, registry cross-evidence, PROGRESS/handoff/STATUS/T-053

## Зачем
- Portable prefs не должны терять Notification Center настройки при переносе профиля

## Результат
- `vitest` PreferencesExportDocument + OperatorPreferencesUseCases: 17 PASS
- `npm run typecheck` / `lint` / `registry:check` (75/0): PASS
- Next: WU-08 optional raise (или defer) → WU-09 / WU-10
