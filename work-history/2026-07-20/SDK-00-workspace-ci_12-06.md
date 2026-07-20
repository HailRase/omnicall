# SDK-00 Package Workspace CI

**Дата:** 2026-07-20 12:06
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/` (npm workspace, packages, tooling, evidence)
- `.github/workflows/axatalk-sdk-ci.yml`
- `docs/softphone/STATUS.md`, `Feature-Registry.md`, `handoffs/P12-External-Host-API-Master-Handoff.md`

## Что
- Создан self-contained npm workspace `@axatalk/protocol` + `@axatalk/sdk` (ESM, strict TS)
- Добавлены lint/typecheck/test/api/package/browser/preflight scripts и changesets scaffolding
- CI: clean install + preflight + upload tarball artifacts без publish
- Evidence: `axatalk-sdk/evidence/SDK-00-workspace.md`; status SDK-00 → `review`

## Зачем
- Инициализировать воспроизводимый SDK package workspace без public API и без npm publish (SDK-00).

## Результат
- `npm ci` + `npm run preflight` в `axatalk-sdk/` — PASS
- Tarballs inspected; publint/attw green; API reports empty
- Desktop `src/` не трогался; SDK-01 не начинался
- Next: `/sdk-review` (SDK-00 only)
