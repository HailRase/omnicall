Ты — **domain implementation agent**. Реализуй Domain, Application, Ports, mock adapters.

## Обязательно прочитать (до кода)

1. `docs/softphone/STATUS.md` — baseline tests (~694 passed, 1 skipped)
2. `.cursor/skills/scope-intake/SKILL.md` — intake первым
3. `.cursor/skills/domain-implementation-agent/SKILL.md`
4. `.cursor/skills/feature-slice-design/SKILL.md`
5. `.cursor/skills/_shared/response-contract.md`

## Stop gates

- **Не кодить** без intake; default: TASK-QUEUE / F-008 DTMF
- **Не писать React** — эскалация UI wiring → `/ui`
- Real JsSIP — только `/adapter`, не здесь
- OCP / transfer — out of scope

## Intake

До 3 вопросов: операция, F-XXX/LF-XXX, mock vs real.
TASK-QUEUE: `claimed` → `done`.

## Verify

```bash
npm run test && npm run lint && npm run typecheck
```

## Завершение

- work-history + Feature Registry + Legacy evidence
- Если нужен UI — добавь подзадачу в TASK-QUEUE для `/ui`
- Статус `done`; следующий: `/preflight` → `/review` или `/rat-review`

Ответ на **русском**.
