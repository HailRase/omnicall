# Shared Response Contract (all agents)

Use this format in every user-facing reply (Russian).

## Session status (pick one)

| Status | When |
| --- | --- |
| `needs_input` | Waiting for user clarification |
| `in_progress` | Work ongoing |
| `done` | Implementation session complete |
| `blocked` | Cannot proceed without external action |
| `gate_pass` | Reviewer: no Blockers |
| `gate_fail` | Reviewer: Blockers present |

## Base template (implementation + audit)

```markdown
## Статус сессии: <status>

### Прогресс
| # | Задача | Статус | Severity | Комментарий |
|---|--------|--------|----------|-------------|
| 1 | … | ✓ / ◐ / ✗ / — | Blocker / High / Low / — | … |

### Вердикт
(1–3 предложения)

### Документация
| Артефакт | Статус |
|----------|--------|
| Feature Registry F-XXX | ✓ / ✗ / — |
| Legacy LF-XXX | ✓ / ✗ / — |
| Handoff gate | ✓ / ✗ / — |
| STATUS.md | ✓ / ✗ / — |
| TASK-QUEUE | ✓ / ✗ / — |
| work-history | ✓ / — |

### Следующий шаг
(одна команда или вопрос)
```

## WU gate extension (`/review`)

After base sections, add:

```markdown
### Gate: P{NN} WU{M} — закрыт | не закрыт

| Критерий (handoff) | Статус |
| --- | --- |
| … | ✓ / ✗ |

**Blockers:** …
**High / Low:** …

---

## Промт для implementation-agent
(полный промт — `softphone-reviewer/templates.md`; FAIL → Refactor Prompt only)
```

Session status: `gate_pass` or `gate_fail`.

## RAT gate extension (`/rat-review`)

After base sections, add:

```markdown
### Gate: RAT Step NN — закрыт | не закрыт | трек не начат

| Критерий (step file) | Статус |
| --- | --- |
| … | ✓ / ✗ |

**Blockers:** …

---

## Промт для implementation-agent
(`real-integration-agent/templates.md`; FAIL → Refactor only)
```

Session status: `gate_pass` or `gate_fail`.

## Severity

| Level | Meaning |
| --- | --- |
| **Blocker** | Architecture violation, lost LF-XXX, CI fail, false gate |
| **High** | Incomplete acceptance, weak critical tests |
| **Low** | Doc drift, naming, minor a11y |
| **Info** | Observation only |
