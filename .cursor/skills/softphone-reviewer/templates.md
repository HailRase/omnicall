# Reviewer Prompt Templates

Use verbatim structure; fill placeholders from Discovery.

## Refactor Prompt (gate FAIL)

```txt
# REFACTOR — P{NN} WU{M} — <краткая тема>

## Контекст
- Feature: F-XXX; Legacy: LF-XXX
- Baseline tests: N
- Handoff: docs/softphone/handoffs/...

## Blockers (исправить обязательно)
1. <проблема> → <ожидаемое исправление> → <файл/путь>
2. ...

## High (желательно в этом же PR)
- ...

## Ограничения
- Минимальный diff; не расширять scope WU
- Сохранить architecture boundaries
- Обновить handoff + work-history после fix

## Verification
npm run test && npm run lint && npm run typecheck
Ожидаемый test count: N (+/-)

## Stop gate
Не начинать WU{M+1} до повторного «Проверяй» с закрытым gate.
```

## Next Implementation Prompt (gate PASS)

```txt
# P{NN} WU{M} — <название work unit>

## ОБЯЗАТЕЛЬНО: Onboarding (прочитать до кода)

### Skills
- .cursor/skills/implementation-phase-planning/SKILL.md
- .cursor/skills/feature-slice-design/SKILL.md
- + phase-specific: telephony-flow-review, ux-ui-flow-design, legacy-feature-migration, integration-contract-review

### Rules
- .cursor/rules/00-core.mdc
- .cursor/rules/implementation-roadmap.mdc
- .cursor/rules/legacy-feature-coverage.mdc
- .cursor/rules/feature-registry.mdc
- .cursor/rules/testing-observability.mdc
- .cursor/rules/ux-ui-electron-react.mdc (если UI)
- .cursor/rules/typescript-react-electron.mdc

### Документация
- Previous handoff: docs/softphone/handoffs/P{NN}-WU{M-1}-*-Handoff.md — baseline **N tests**
- Phase UX (если user-visible): docs/softphone/P{NN}-*-UX-Design.md
- docs/softphone/Feature-Registry.md — F-XXX
- docs/softphone/Legacy-Feature-Coverage.md — LF-XXX
- Reference patterns: <2–4 файла из предыдущих фаз>

## Контекст
- Phase: P{NN}; Feature: **F-XXX** (status)
- Baseline: **N tests**
- Previous WU summary: 1–2 строки

## Legacy IDs (эта WU)
- **LF-XXX** — ...

## Out of scope (STOP gate — не делать)
- ...
- Real JsSIP/OCP adapters (если не пора)
- Следующая WU

## Deliverables
| # | Area | Path (expected) |
| --- | --- | --- |
| 1 | ... | src/... |

## Architecture boundaries
- UI → Facade / Use Cases only
- Stores = projections
- Domain isolated
- OCP optional; SIP-only path preserved

## Anti-patterns (из prior phases)
- UX/UI до state design
- Gateway success before domain event
- setInterval / infinite polling
- Business rules in React components
- Exact LF mapping (не substring queue names)
- Handoff без exact test count

## Tests required
- Unit: ...
- Integration: ...
- Component: ... (если UI)

## Docs and work-history
- docs/softphone/handoffs/P{NN}-WU{M}-*-Handoff.md
- Update Feature Registry + Legacy Coverage
- work-history/YYYY-MM-DD/p{nn}-wu{m}-topic_HH-mm.md

## Verification
npm run test && npm run lint && npm run typecheck
Baseline N → ожидай +X–Y

## WU{M} Gate
- [ ] ...
- [ ] Handoff + registry + legacy evidence
- [ ] Prior WU regression green

**Stop after WU{M} gate. Do NOT implement <next WU scope>.**
```

## Phase Continuation Handoff (outline)

When a phase gate passes, describe a new file `docs/softphone/handoffs/P{NN}-Agent-Continuation-Handoff.md`:

```markdown
# P{NN} Agent Continuation Handoff

- Phase: P{NN} — **complete** (WU1–WUk).
- Next phase: P{NN+1} ...

## Status Summary
| Work Unit | Status | Handoff |
| --- | --- | --- |
| WU1 ... | ✅ | path |

## Architecture Reminders
- ...

## Verification (last run)
npm run test # N passed

## P{NN+1} Entry
- Legacy: LF-XXX ...
- WU1 handoff: path
```

Then issue **P{NN+1} WU1** implementation prompt.

## Cross-phase anti-patterns catalog

Carry into every next prompt:

- UX before code for user-visible flows
- Gateway confirm before state events
- Cancel attended transfer ≠ failure
- Exact queue / main_acallid mapping
- No infinite polling; one-shot timers with cleanup
- Projection-driven disabled reasons
- SIP-only hides OCP UI and projections
- CallEngine must not import OCP
- Composition root: AccountBootstrapFacade
- Exact test count in handoff (not «see output»)
