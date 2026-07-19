# Release cut v0.11.2

**Р”Р°С‚Р°:** 2026-07-19 22:12
**РЎС‚Р°С‚СѓСЃ:** РІС‹РїРѕР»РЅРµРЅРѕ
**РљРѕРјРјРёС‚:** вЂ”

## Р“РґРµ
- `package.json`
- `CHANGELOG.md`, `distribution/CHANGELOG.md`
- `distribution/update-manifest.json` (+ docs copies)
- `docs/softphone/STATUS.md` (Release train)

## Р§С‚Рѕ
- Bump `0.11.1` в†’ `0.11.2` (PATCH: OCP modal Disconnect/reconnect + overwrite modal UX).
- CHANGELOG internal + public English notes; compare links РґР»СЏ 0.11.x / 0.10.4.
- `npm run release:sync-manifest` в†’ `latestVersion` 0.11.2.
- Tag `v0.11.2` РЅР° `main`; release commit РїСЂРѕРїР°РіРёСЂРѕРІР°РЅ РІ `ocp-integration`, `feature/real-adapters`, `video-refactorin`.

## Р—Р°С‡РµРј
- РџРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРёР№ release cut РїРѕСЃР»Рµ merge OCP-РёРЅС‚РµРіСЂР°С†РёРё РІ РѕСЃРЅРѕРІРЅС‹Рµ РІРµС‚РєРё; Р°РєС‚СѓР°Р»СЊРЅС‹Р№ manifest РІРѕ РІСЃРµС… СЂР°Р±РѕС‡РёС… РІРµС‚РєР°С….

## Р РµР·СѓР»СЊС‚Р°С‚
- `npm run release:preflight` вЂ” OK.
- Tag push в†’ CI `release.yml` РїСѓР±Р»РёРєСѓРµС‚ installers РІ axatalk-releases.
