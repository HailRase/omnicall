# Release cut blocked — preflight / branch

**Дата:** 2026-07-31 09:42
**Статус:** не выполнено
**Коммит:** —

## Где
- `package.json` (version 1.1.2)
- `docs/softphone/STATUS.md` Release train
- `docs/softphone/handoffs/P14-External-Services-Master-Handoff.md`
- `src/application/services/integration/OcpTransportRecoveryService.test.ts`
- `src/domain/platform/ShellWindowLayout.ts`

## Что
- Запущен `npm run release:preflight` — tests PASS (2926), lint FAIL (7 errors)
- Исправлены lint-ошибки в OCP recovery tests и `ShellWindowLayout` (uncommitted)
- Обнаружено: ветка `feature/external-services` (+22 к `main`), не `main`
- Целевой cut по STATUS: MINOR **1.2.0** (F-031), pending ship auth

## Зачем
- Команда `/release` — cut distribution release F-031

## Результат
- Релиз не вырезан: preflight блокировал; cut с feature-ветки запрещён playbook; ждём merge в `main` и подтверждение 1.2.0 + push tag
