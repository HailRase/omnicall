Запусти проверки перед ревью (не меняй код, только запуск и отчёт).

```bash
npm run test && npm run lint && npm run typecheck
```

Если в diff есть `src/renderer/` — также:
```bash
npm run ui:catalog:check
```

Формат: response-contract. Статус `gate_pass` если всё green, иначе `gate_fail` с Blockers.
Укажи test count. Следующий шаг: `/review` или `/audit`.
