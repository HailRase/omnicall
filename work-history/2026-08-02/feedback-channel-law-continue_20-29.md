# Feedback Channel Law вЂ” continuation

**Р”Р°С‚Р°:** 2026-08-02 20:29
**РЎС‚Р°С‚СѓСЃ:** РІС‹РїРѕР»РЅРµРЅРѕ
**РљРѕРјРјРёС‚:** вЂ”

## Р“РґРµ
- `useSdkSettingsPanel.ts`, `useOcpSettingsPanel.ts`, `useExternalApplicationsPanel.ts`
- `externalServicesPanel/presentExternalServicesOutcomeError.ts` + request/sidebar builders
- `useScreenSharePicker.ts`, `useCallFeatureShell.ts`, `SoftphoneReadyShell.tsx`
- ADR-0026, Feature-Registry, UI-Architecture, STATUS

## Р§С‚Рѕ
- SDK/OCP/EA save (Рё user-initiated SDK ops) в†’ toast; originsInvalid + SDK poll gateway в†’ strip
- ES non-validation request mutate в†’ toast; validation.* РѕСЃС‚Р°С‘С‚СЃСЏ inline; RunResult/journal load РЅРµ С‚СЂРѕРіР°Р»Рё
- Screen-share confirmFailed в†’ toast; loadFailed РѕСЃС‚Р°С‘С‚СЃСЏ РІ РґРёР°Р»РѕРіРµ
- SoftphoneReadyShell: `useNotifications` РґРѕ call/settings panel hooks; wiring `notify`

## Р—Р°С‡РµРј
- РџСЂРѕРґРѕР»Р¶РµРЅРёРµ ADR-0026 Р±РµР· РґР°СѓРЅРіСЂРµР№РґР° list-load / rich / validation surfaces

## Р РµР·СѓР»СЊС‚Р°С‚
- `tsc -p tsconfig.web.json` вЂ” pass
- vitest (tagging, screen share, EA/SDK/OCP/SettingsPanel) вЂ” 25 pass
