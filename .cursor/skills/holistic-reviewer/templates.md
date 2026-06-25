# Holistic Reviewer Templates

## Audit Report (default)

```markdown
## Статус сессии: gate_pass | gate_fail

### Прогресс
| # | Область | Статус | Severity | Finding |
|---|---------|--------|----------|---------|
| 1 | Architecture | ✓ / ✗ | … | … |
| 2 | Feature Registry | ✓ / ✗ | … | … |
| 3 | Legacy LF-XXX | ✓ / ✗ | … | … |
| 4 | Tests / CI | ✓ / ✗ | … | … |
| 5 | Docs hygiene | ✓ / ✗ | … | … |

### Вердикт
Merge-ready: да / нет. Краткое резюме.

### Blockers
1. …

### High / Low
- …

### Документация
| Артефакт | Статус |
|----------|--------|
| STATUS.md актуален | ✓ / ✗ |
| Feature Registry | ✓ / ✗ |
| ui:catalog | ✓ / ✗ / n/a |

### Следующий шаг
/fix Blockers → /preflight → /review или merge
```

## Pre-merge checklist (quick)

```txt
[ ] npm run test — N passed
[ ] lint + typecheck green
[ ] ui:catalog:check (if UI)
[ ] No Blockers from /audit
[ ] WU gate closed (/review) if roadmap work
```
