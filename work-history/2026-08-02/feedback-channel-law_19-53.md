# Feedback Channel Law (ADR-0026)

**Р”Р°С‚Р°:** 2026-08-02 19:53
**РЎС‚Р°С‚СѓСЃ:** РІС‹РїРѕР»РЅРµРЅРѕ
**РљРѕРјРјРёС‚:** вЂ”

## Р“РґРµ
- `src/renderer/hooks/useActionNotifications.ts`, `useContactActions.ts`, `usePreferencesTransferActions.ts`
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/components/history/HistoryDeleteConfirmationModal.tsx`
- `src/renderer/components/contacts/ContactDeleteConfirmationModal.tsx`, `ContactEditPanel.tsx`
- `src/renderer/components/call/CallLinesShell.tsx`, `CallSessionStack.tsx`
- `docs/softphone/adr/ADR-0026-feedback-channel-law.md`, `UI-Architecture.md`, `Feature-Registry.md`, `STATUS.md`

## Р§С‚Рѕ
- РЎРЅСЏС‚ dual Account error: Alert РІР»Р°РґРµРµС‚ UX; `notify` СЃ `interruptClass: "critical"` РґР»СЏ journal Р±РµР· toast; CTA System State РЅР° Alert
- РЈР±СЂР°РЅС‹ outcome strips РёР· history/contacts delete modals; contact CRUD outcomes в†’ toast
- Preferences export/import в†’ toast; СѓР±СЂР°РЅ inline status
- Multi-call policy error С‚РѕР»СЊРєРѕ РІ `CallSessionStack`
- Р—Р°С„РёРєСЃРёСЂРѕРІР°РЅ ADR-0026 + СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ UI/UX/Registry/STATUS/notification-center non-goals

## Р—Р°С‡РµРј
- РЈСЃС‚СЂР°РЅРёС‚СЊ РґРІРѕР№РЅРѕР№ РїРѕРєР°Р· РѕС€РёР±РѕРє/СѓСЃРїРµС…Р° Р±РµР· РґР°СѓРЅРіСЂРµР№РґР° persistent Account/banner/modal surfaces

## Р РµР·СѓР»СЊС‚Р°С‚
- `npx vitest run` (AccountPanel, useActionNotifications, preferences transfer, SettingsPanel/General, Contacts/History shells, producer tagging) вЂ” pass
- `npx tsc --noEmit -p tsconfig.web.json` вЂ” pass
- Version bump РЅРµ РґРµР»Р°Р»СЃСЏ (docs + anti-dual UX hygiene, РЅРµ РЅРѕРІС‹Р№ Registry feature ship)
