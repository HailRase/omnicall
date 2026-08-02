# F-034 Notification Center — audit remediation

**Дата:** 2026-08-02 21:17
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/settings/UserNotificationCaptureService.ts`
- `src/application/use-cases/settings/RecordUserNotificationUseCase.ts`
- `src/domain/settings/UserNotificationJournalEntry.ts`
- `src/domain/settings/persistedUserNotificationJournal.ts`
- `src/renderer/hooks/useNotifications.ts`
- `src/renderer/hooks/notificationProducerTagging.test.ts`
- `src/renderer/components/settings/panels/*Notification*`
- `notification-center/13-AUDIT-REMEDIATION.md`
- `docs/softphone/adr/ADR-0025-notification-center-preferences-policy.md`
- `docs/softphone/Feature-Registry.md`

## Что
- Journal IO failure больше не форсит toast: Capture возвращает Domain policy + `journalPersisted`
- Structured Capture logs; renderer `onCaptureFailure` на unexpected throw
- Appearance `closable` подключён к Sonner; пресет Telephony focus; модуль `externalApplications`
- Journal entries: additive `suppressReasons`; tagging scan по всему `src/renderer`
- Документация синхронизирована (`13-AUDIT-REMEDIATION`, ADR-0025, registry, i18n coverage)

## Зачем
- Закрыть High-находки аудита без даунгрейда дефолтов и без scope OS-баннеров (WU-09)

## Результат
- Focused vitest suites PASS; `npm run typecheck` PASS; `npm run i18n:check` PASS; `npm run registry:check` 86/0
- Defaults popup-on сохранены; WU-09 OS deferred; SemVer не трогали
