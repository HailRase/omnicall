# F-034 WU-03 Producer tagging

**Дата:** 2026-08-02 17:21
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useActionNotifications.ts` (+ tests)
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/integration/ocp/createOcpToastNotificationPresenter.ts` (+ test)
- `src/renderer/hooks/useContactActions.ts`, `useCallHistoryActions.ts`, `useVideoCallNotifications.ts`
- `src/renderer/hooks/useOcpCampaignModal.ts`, `useOperatorStatusSelector.ts`, `useOcpLogoutModal.ts`, `useOcpRejectWithBreak.ts`
- `src/renderer/hooks/notificationProducerTagging.test.ts`
- `notification-center/04-CAPTURE-AND-PRESENTATION.md`, `PROGRESS.md`, `10-WORK-UNITS.md`
- `docs/softphone/{STATUS,TASK-QUEUE,Feature-Registry}.md`, `handoffs/P15-Notification-Center-Master-Handoff.md`

## Что
- Все product toast producers снабжены `module` + `functionId` + `interruptClass`
- SoftphoneReadyShell OCP auth feedback: `ocp` / `ocp.auth_feedback` / `actionable`
- OCP mapper: `interruptClass: "remote"`
- Статический checklist-тест на untagged `notify({...})` literals
- Матрица producers в `04-CAPTURE-AND-PRESENTATION.md` приведена к фактическим functionId

## Зачем
- Per-module prefs бессмысленны, пока события схлопываются в `system` / `renderer.notification`

## Результат
- Фокус-тесты: 9 files / 53 tests PASS
- `npm run typecheck` PASS · `npm run lint` PASS
- Manual spot-check (defaults unchanged — только метаданные дескриптора):
  - account sign-in success/error → `account` / informational|actionable
  - telephony outgoing/SIP recovery/headset → `telephony`|`headset` / actionable on failure
  - OCP remote body → `ocp.notification` / remote
  - OCP auth feedback → `ocp.auth_feedback` / actionable
  - contacts CSV import/export → `contacts.csv.*`
  - history redial/delete → `history.redial`|`history.delete`
  - video downgrade → `media.video.downgrade` / actionable
  - OCP campaign/status/reject-break/logout → tagged per matrix
- Next: WU-04 Preferences UI
