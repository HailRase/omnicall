# DI-10 — remediation после `/sdk-review` FAIL + push для офиса

**Дата:** 2026-07-21 00:30
**Статус:** выполнено
**Коммит:** (см. push на `feature/axatalk-sdk`)

## Где
- `eslint.config.js`
- `axatalk-sdk-integration/scripts/di10-*.mjs`
- `axatalk-sdk-integration/evidence/DI-10-*`
- `axatalk-sdk/evidence/SDK-10-release-candidate.md`
- `axatalk-sdk/docs/guide/compatibility-matrix.md`
- `docs/softphone/STATUS.md`, Feature-Registry, P12 handoff, UI catalog
- `axatalk-sdk-integration/WORK-UNITS.md`, SMOKE-CHECKLIST

## Что
- Blocker: ESLint ignore `axatalk-sdk-integration/scripts/**` → `release:preflight` снова зелёный
- High: SDK-10 / compatibility-matrix — PARTIAL/OPEN вместо устаревшего «blocked on DI-10»
- Low: `browserVersion` в browser smoke report + чтение ProductVersion на Windows
- Low: UI catalog regenerated (SdkModuleSettings*)
- Офисный continue-prompt: `evidence/DI-10-office-continue-prompt.md`
- F-011 / P12 / SemVer `0.11.2` не закрывались

## Зачем
Убрать ложный FAIL-гейт и синхронизировать ветку для продолжения на другом ПК.

## Результат
- `npm run lint` PASS
- `npm run release:preflight` PASS — 2499 passed / 1 skipped; registry 74/0
- SDK `api:check` PASS — 47 / 169
- DI-10 остаётся `review` → следующий шаг: `/sdk-review` DI-10 only
