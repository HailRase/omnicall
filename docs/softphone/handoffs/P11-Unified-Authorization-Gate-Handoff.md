# P11 Unified SIP/OCP Authorization Gate — Repeat Review Handoff

- **Features:** F-001, F-014, F-024, F-028
- **Prior WU:** `work-history/2026-07-16/simplify-sip-ocp-auth_12-31.md`
- **Work-history (gate fixes):** `work-history/2026-07-16/unified-auth-gate-fixes_13-05.md`
- **Phase:** P11 Settings / Integration authorization polish

## Scope

Close failed review gate on unified OCP→SIP authorization:

1. One explicit **Retry** action per failed attempt (`authorizationProgress.retryAvailable`) in Account and Integrations UI; Application maps stage → strategy without exposing protocol details.
2. Renderer coverage for sign-in methods, progress labels, first-time OCP setup, failure-before-success guard, disconnect warning, startup registration CTA.
3. Remove forbidden `as unknown as` from new authorization tests (typed stubs / narrow facade binding).
4. **`sipAutoRegisterOnStartup`** governs bootstrap registration; persistent startup failure banner + Account CTA.
5. Documentation and registry evidence aligned with actual tests. **Not production-ready** until manual smoke SM-1…SM-16 are checked.

## Delivered

| Area | Path |
| --- | --- |
| Retry context + strategy | `src/application/projections/settings/authorizationRetryContext.ts` |
| Facade retry + startup gate | `src/application/facades/AccountBootstrapFacade.ts` (`retryAuthorization`, `retryStartupRegistration`, `hasStartupRegistrationFailure`, `lastAuthorizationAttempt`) |
| SIP use-case test doubles | `src/application/testing/sipUseCaseTestDoubles.ts` |
| Account UI | `src/renderer/components/account/AccountPanel.tsx` (retry, startup failure CTA, sign-in methods, progress) |
| Integrations UI | `src/renderer/components/settings/panels/OcpModuleSettingsCard.tsx` (progressive setup, single retry, disconnect warn) |
| Hooks / wiring | `useAccountActions.ts`, `useOcpSettingsPanel.ts`, `SoftphoneReadyShell.tsx`, `SettingsAccountPanel.tsx`, `SettingsPanel.tsx` |
| i18n | `account.action.retryAuthorization`, `account.startupRegistration.*`, existing `account.authProgress.*` (ru/en/fr/de/bg) |

## Tests

| Layer | File | Focus |
| --- | --- | --- |
| Retry strategy | `authorizationRetryContext.test.ts` | OCP unavailable, SESSION_EXIST, SIP register fail, identity mismatch, manual SIP |
| Orchestration | `OcpBackedSignInOrchestrationService.test.ts` | OCP unavailable, SESSION_EXIST, SIP register fail, identity mismatch, `retryAvailable` |
| Facade | `AccountBootstrapFacade.test.ts` | `sipAutoRegisterOnStartup` gate, startup failure flag, `retryAuthorization` after SESSION_EXIST |
| Account UI | `AccountPanel.test.tsx` | OCP vs SIP password methods, progress labels, single retry, no success before SIP, startup CTA |
| Integrations UI | `OcpModuleSettingsCard.test.tsx` | First-time setup, progress, disconnect warning, single retry |
| Settings shell | `SettingsAccountPanel.test.tsx` | Auth progress + retry wiring |
| Hook binding | `useAccountActions.test.ts` | `AccountActionsFacadeBinding` (no `as unknown as`) |

## Gate checklist

- [x] Single Retry action per surface when `authorizationProgress.retryAvailable`
- [x] Retry reuses selected profile / preserved attempt context (Facade `lastAuthorizationAttempt`)
- [x] Stage → strategy mapping without protocol leakage (`authorizationRetryContext`)
- [x] Application tests: OCP unavailable, SIP registration failure, SESSION_EXIST, identity mismatch
- [x] Renderer tests: linked profile methods, progress labels, first-time OCP setup, failure-before-success, disconnect warning
- [x] No new `as unknown as` in authorization test additions
- [x] `sipAutoRegisterOnStartup` controls bootstrap auto-register; startup failure persists with Account CTA
- [x] Manual SIP, saved profile, OCP, recovery, logout paths preserved (existing suites green)
- [ ] Manual smoke **SM-1…SM-16** (staging) — **not run in this WU**
- [x] Feature Registry test evidence updated
- [x] UI Component Catalog regenerated

## Verification commands (2026-07-16)

```bash
npm run test
npm run lint
npm run typecheck
npm run i18n:check
npm run registry:check
npm run ui:catalog:check
```

| Command | Result |
| --- | --- |
| `npm run test` | **2124 passed**, 1 skipped (408 files) |
| `npm run lint` | green |
| `npm run typecheck` | green |
| `npm run i18n:check` | green (430 files) |
| `npm run registry:check` | green (55 paths) |
| `npm run ui:catalog:check` | catalog regenerated (`docs/softphone/UI-Component-Catalog.md` updated); exits **0** once catalog diff is staged/committed with this WU |

## Stop gate

Return for **repeat `/review` only**. Do **not** mark production-ready until SM-1…SM-16 manual smoke is checked. Do **not** start another feature from this handoff.
