# /sdk-review DI-10 — FAIL (re-gate)

**Дата:** 2026-07-21 14:27
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk-integration/WORK-UNITS.md` (DI-10)
- `axatalk-sdk-integration/evidence/DI-10-compatibility-e2e-p12-close.md`
- `eslint.config.js`, `sdk-demo/**` (untracked)
- `docs/softphone/STATUS.md`, P12 handoff

## Что
- Независимый re-gate DI-10 only после remediation
- Prior remediations подтверждены: ignore `axatalk-sdk-integration/scripts/**`, SDK-10/compat docs, `browserVersion`, fortress tests, `api:check` 47/169
- **Blocker:** `npm run lint` FAIL на `sdk-demo/**` (projectService) — тот же класс, что прежний DI-10 Blocker
- DI-10 остаётся `review` / не `done`; F-011/P12 не закрывались; DI-11 не стартовал

## Зачем
Закрыть или отклонить gate Compatibility/E2E перед F-011 close и DI-11.

## Результат
**FAIL** (Blocker). Focused vitest 19/19 PASS; registry 74/0; SDK `api:check` PASS; lint FAIL. Next: `/sdk-integration` DI-10 only (restore green lint) → re-`/sdk-review`.
