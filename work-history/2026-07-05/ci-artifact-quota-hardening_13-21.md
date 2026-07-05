# CI: artifact quota и production-ready workflows

**Дата:** 2026-07-05 13:21
**Статус:** выполнено
**Коммит:** (см. git log)

## Где
- `.github/workflows/release.yml`, `ci.yml`, `migrate-distribution.yml`
- `.github/dependabot.yml`
- `scripts/collect-installer-artifacts.mjs`
- `guides/Developer-Release-CI-Guide.md`, `guides/RELEASE-PLAYBOOK.md`

## Что
- Upload Artifacts только установщики (2–3 файла/job вместо ~250); `retention-days: 1`
- Release: отдельный preflight job; build matrix без тройного прогона тестов
- CI: `i18n:check`, `node-version-file: .nvmrc`, timeouts, concurrency
- Dependabot для npm и GitHub Actions
- Тест `collect-installer-artifacts.test.mjs`

## Зачем
Release #24 падал: quota Artifacts из-за загрузки всего `dist/**` включая win-unpacked.

## Результат
- `npm run release:preflight` — PASS (1048 tests)
- Тег `v0.1.0` пересоздан для повторного Release workflow
- Рекомендация: удалить старые Artifacts в GitHub UI для немедленного освобождения квоты
