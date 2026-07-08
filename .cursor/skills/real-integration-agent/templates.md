# RAT Reviewer Prompt Templates

Use verbatim structure; fill placeholders from Discovery.

## Refactor Prompt (step gate FAIL)

```txt
# REFACTOR — RAT Step NN — <краткая тема>

## Контекст
- Track: Real Adapter Integration (RAT)
- Branch: `main` (RAT merged; `feature/real-adapters` stale)
- Step file: docs/softphone/real-integration/step-NN-*.md
- Feature: F-XXX; Legacy: LF-XXX
- Baseline tests: 488 (+N claimed in PROGRESS)
- ADR: docs/softphone/adr/ADR-0001-real-adapter-integration.md

## Blockers (исправить обязательно)
1. <проблема> → <ожидаемое исправление> → <файл/путь>
2. ...

## High (желательно в этом же PR)
- ...

## RAT constraints (не нарушать при fix)
- Mock остаётся default; npm run test green
- Real только через createSoftphoneComposition / ?adapters=real
- JsSIP/WebSocket/DOM только в adapters
- Не расширять AccountBootstrapFacade
- Не логировать секреты

## Verification
npm run test && npm run lint && npm run typecheck
Smoke (если применимо): docs/softphone/real-integration/SMOKE-CHECKLIST.md § R?

## Docs
- Обновить PROGRESS.md (статус, тесты, smoke)
- work-history/YYYY-MM-DD/rat-step-NN_*.md

## Stop gate
Не начинать Step N+1 до повторного @real-integration-agent с закрытым gate.
```

## Continuation Prompt (step PASS or track start)

Hand implementation agent `docs/softphone/real-integration/MASTER-AGENT-PROMPT.md` plus step scope:

```txt
# RAT Step NN — <название из step-файла>

## ОБЯЗАТЕЛЬНО: Onboarding (прочитать до кода)

### Agent prompt
- docs/softphone/real-integration/MASTER-AGENT-PROMPT.md

### Skills
- .cursor/skills/feature-slice-design/SKILL.md
- .cursor/skills/telephony-flow-review/SKILL.md
- .cursor/skills/integration-contract-review/SKILL.md
- .cursor/skills/legacy-feature-migration/SKILL.md
- + .cursor/skills/ux-ui-flow-design/SKILL.md (если user-visible)

### Rules
- .cursor/rules/00-core.mdc
- .cursor/rules/typescript-react-electron.mdc
- .cursor/rules/testing-observability.mdc
- .cursor/rules/legacy-feature-coverage.mdc
- .cursor/rules/feature-registry.mdc
- .cursor/rules/ux-ui-electron-react.mdc (если UI)

### Документация
- docs/softphone/real-integration/00-SNAPSHOT.md — baseline **488 tests**
- docs/softphone/real-integration/PROGRESS.md — resume point
- docs/softphone/real-integration/step-NN-*.md — **только этот шаг**
- docs/softphone/real-integration/SMOKE-CHECKLIST.md
- docs/softphone/adr/ADR-0001-real-adapter-integration.md
- docs/softphone/Feature-Registry.md — F-001, F-002, F-003, F-009
- Reference: <2–4 файла из 00-SNAPSHOT Key paths>

## Контекст
- Branch: **`main`** (RAT merged; `feature/real-adapters` stale)
- Baseline: **488 tests** (mock default)
- Previous step: <кратко или «нет — старт трека»>

## Legacy IDs (этот шаг)
- **LF-XXX** — ...

## Out of scope (STOP gate)
- <из step Do NOT + MASTER-AGENT Out of scope>
- Следующий step (NN+1)

## Deliverables
| # | Area | Path (expected) |
| --- | --- | --- |
| 1 | ... | src/... |

## Architecture boundaries
- createSoftphoneComposition({ mode }) — dispatcher
- Mock path = текущий createAccountBootstrap body
- Real path = новые adapters, Use Cases без изменений
- Ports без JsSIP типов

## Anti-patterns (RAT)
- Дублирование Use Cases для real/mock
- JsSIP в UI / Domain / Store
- Рост AccountBootstrapFacade
- Gateway success до domain event
- Scope creep (calls в step 02, transfer до step 07)
- PROGRESS без smoke/test count

## Tests required
- Unit: ...
- Mock regression: 488+ unchanged behavior
- Optional: SIP_SANDBOX=1 (не ломает CI)

## Smoke (если step ≥ 02)
- docs/softphone/real-integration/SMOKE-CHECKLIST.md § R?
- Записать результат в PROGRESS.md

## Docs and work-history
- PROGRESS.md — step NN → done + notes
- Feature Registry real-track note (если gate step требует)
- work-history/YYYY-MM-DD/rat-step-NN-topic_HH-mm.md

## Verification
npm run test && npm run lint && npm run typecheck
Baseline 488 → ожидай +X–Y

## Step NN Gate
- [ ] ... (из step-файла)
- [ ] Mock default green
- [ ] PROGRESS + work-history

**Stop after Step NN gate. Do NOT implement Step N+1.**
```

## Slice complete handoff (optional, after SIP slices)

When a major **SIP** slice (R1–R4, step 07) completes, summarize in PROGRESS **Current blocker** section and suggest smoke re-run before merge to master. **removed operator legacy operator platform is deferred** (ADR-0005) — not a merge gate.
