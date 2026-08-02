# OCP socket в†’ Notification Center only

**Р”Р°С‚Р°:** 2026-08-02 20:41
**РЎС‚Р°С‚СѓСЃ:** РІС‹РїРѕР»РЅРµРЅРѕ
**РљРѕРјРјРёС‚:** вЂ”

## Р“РґРµ
- `src/renderer/integration/ocp/createOcpToastNotificationPresenter.ts`
- `src/renderer/integration/ocp/createOcpToastNotificationPresenter.test.ts`
- `notification-center/00-PRODUCT-SPEC.md`, `03-POLICY-AND-CHANNELS.md`, `07-SECURITY-ISOLATION.md`, `11-ACCEPTANCE.md`
- `docs/softphone/adr/ADR-0025-*.md`, `ADR-0026-*.md`
- `docs/softphone/Feature-Registry.md` (F-034)

## Р§С‚Рѕ
- Mapper РїСЂРµР·РµРЅС‚СѓРµС‚ С‚РѕР»СЊРєРѕ `body` + `type` (`success`/`error`; РѕСЃС‚Р°Р»СЊРЅРѕРµ в†’ `info`)
- РЈР±СЂР°РЅС‹ suppress РїРѕ `deleted`/`blocked` Рё override `sticky` в†’ `durationMs: 0`
- РџСѓСЃС‚РѕР№ `body` (trim) в†’ null; РїСѓСЃС‚РѕР№ `id` в†’ Р±РµР· id (РіРµРЅРµСЂР°С†РёСЏ РІ `notify`)
- РўРµРіРё `module: ocp`, `functionId: ocp.notification`, `interruptClass: remote` СЃРѕС…СЂР°РЅРµРЅС‹
- РЎРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ РїРѕР»РёС‚РёРєР° Notification Center, ADR-0025/0026 Рё evidence F-034

## Р—Р°С‡РµРј
- Remote OCP notifications РёРґСѓС‚ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· Softphone Notification Center prefs, Р±РµР· OCP wire lifecycle.

## Р РµР·СѓР»СЊС‚Р°С‚
- `vitest` mapper + OcpNotificationService: PASS
- Р¤РёР»СЊС‚СЂ OCP/producer tagging (28 tests): PASS
- `tsc -p tsconfig.web.json`: PASS
- SoftphoneReadyShell wiring Р±РµР· РёР·РјРµРЅРµРЅРёР№ (`map` в†’ `notify`)
