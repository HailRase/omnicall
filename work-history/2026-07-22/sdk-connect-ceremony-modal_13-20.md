# SDK connect ceremony modal (TOFU → pairing)

**Дата:** 2026-07-22 13:20
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/integration/SdkConnectCeremonyModal.tsx`
- `src/renderer/hooks/useSdkConnectCeremony.ts`
- `src/renderer/hooks/useShellWindowAttentionFromSdk.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/components/settings/panels/SdkModuleSettingsCard.tsx`
- `docs/softphone/adr/ADR-0018-sdk-origin-tofu-blacklist-activate-consent.md`
- `docs/softphone/adr/ADR-0013-sdk-window-policy-and-signin.md`

## Что
- Root overlay-модалка с blur: шаг Origin trust → waiting → pairing (stepper)
- Уже allowed Origin → только pairing без stepper
- Убран авторедирект в Settings на pairing attention
- Удалены Settings attention callouts и `SdkOriginTrustConsentModal`
- Документы/ADR/Registry/TEST-MATRIX/SMOKE/CHANGELOG Unreleased синхронизированы

## Зачем
Единый понятный UX подтверждения SDK поверх любого shell route без даунгрейда security-гейтов ADR-0018/0016.

## Результат
- `npm run test` — 2571 passed / 1 skipped
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run i18n:check` — PASS
- `npm run ui:catalog` — PASS
