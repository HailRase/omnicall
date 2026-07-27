# Ребрендинг OmniCall / SoftOmniTel

**Дата:** 2026-07-27 12:21
**Статус:** выполнено
**Коммит:** —

## Где
- `package.json`, `electron-builder.yml`, `scripts/distribution-config.mjs`, `.env.production`, `.github/workflows/*`
- `omnicall-kit/` (бывш. `axatalk-sdk/`), `omnicall-kit-integration/`
- `@softomnitel/omnicall-kit`, `@softomnitel/omnicall-protocol`
- `src/infrastructure/bootstrap/resolveOmniCallProfilesStorageRoot.ts`, preferences/dismiss migration
- docs/guides/AGENTS/skills/commands, `CHANGELOG.md`, `distribution/update-manifest.json`

## Что
- Softphone: Axatalk → **OmniCall** (`appId` `com.softomnitel.omnicall`, author SoftOmniTel)
- SDK/protocol: `@softomnitel/omnicall-kit` / `@softomnitel/omnicall-protocol`; API `OmniCallClient`
- Wire paths `/omnicall/v1/*`; env `OMNICALL_*`; distribution `HailRase/omnicall-releases`
- One-shot migration userData Axatalk→OmniCall; import legacy `axatalk.preferences`; dismiss key migrate
- SemVer **1.0.0** (MAJOR breaking), sync-manifest

## Зачем
Полный ребрендинг продукта и npm namespace без потери локальных данных пользователей после смены productName.

## Результат
- `omnicall-kit` preflight PASS
- root `typecheck` / `lint` / `test` (2728 passed) PASS
- work-history не переписывался (только эта запись)
- **Вручную:** создать GitHub-репо `omnicall-releases`, секрет Actions `OMNICALL_RELEASES_TOKEN`
