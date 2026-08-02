# Feedback Channel Law — continuation

**Дата:** 2026-08-02 20:29
**Статус:** выполнено
**Коммит:** —

## Где
- `useSdkSettingsPanel.ts`, `useOcpSettingsPanel.ts`, `useExternalApplicationsPanel.ts`
- `externalServicesPanel/presentExternalServicesOutcomeError.ts` + request/sidebar builders
- `useScreenSharePicker.ts`, `useCallFeatureShell.ts`, `SoftphoneReadyShell.tsx`
- ADR-0026, Feature-Registry, UI-Architecture, STATUS

## Что
- SDK/OCP/EA save (и user-initiated SDK ops) → toast; originsInvalid + SDK poll gateway → strip
- ES non-validation request mutate → toast; validation.* остаётся inline; RunResult/journal load не трогали
- Screen-share confirmFailed → toast; loadFailed остаётся в диалоге
- SoftphoneReadyShell: `useNotifications` до call/settings panel hooks; wiring `notify`

## Зачем
- Продолжение ADR-0026 без даунгрейда list-load / rich / validation surfaces

## Результат
- `tsc -p tsconfig.web.json` — pass
- vitest (tagging, screen share, EA/SDK/OCP/SettingsPanel) — 25 pass
