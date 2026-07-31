# SDK-10 RC staging (Mode A)

**Дата:** 2026-07-20 23:52
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/docs/guide/release-and-support.md`
- `axatalk-sdk/docs/guide/compatibility-matrix.md`
- `axatalk-sdk/scripts/sbom.mjs`, `release-check.mjs`
- `axatalk-sdk/evidence/SDK-10-release-candidate.md`
- `axatalk-sdk/docs/WORK-UNITS.md`
- `docs/softphone/Feature-Registry.md` (F-011 factual note)

## Что
- Mode A RC staging: changelog, changeset, SBOM, provenance/`publishConfig` verify, rollback/revoke docs
- `npm run sbom` + `npm run release:check` (без registry publish; packages остаются `private: true`)
- Матрица совместимости: Chromium PASS; packaged E2E / hostile matrix явно blocked on DI-10
- Clean-install `npm ci` + preflight PASS; API 47/169; counts 115/123/7/7 без дельты
- SDK-10 → `review`; F-011 остаётся `in progress`; stable не заявлен

## Зачем
- Подготовить fail-closed путь к RC без ложных claims по desktop E2E и без publish на `latest`.

## Результат
- RC-ready / stable-blocked; npm publish не выполнялся; запрошен `/sdk-review` SDK-10 only.
- Проверки: `npm ci`, `preflight`, `release:check`, `AXATALK_SDK_BROWSER=1 test:browser` — PASS.
