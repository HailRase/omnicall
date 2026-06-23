# Softphone Reviewer Skill

**Дата:** 2026-06-24 00:57
**Статус:** выполнено
**Коммит:** `9cd1e6b`

## Где
- `.cursor/skills/softphone-reviewer/SKILL.md`
- `.cursor/skills/softphone-reviewer/templates.md`
- `.cursor/rules/reviewer-agent.mdc`

## Что
- Skill `softphone-reviewer`: Discovery, review protocol, severity, verdict format, phase gate
- `templates.md`: refactor prompt, next WU prompt, continuation handoff, anti-patterns
- Rule `reviewer-agent.mdc`: триггеры «Проверяй», роль gate-keeper, ссылка на skill

## Зачем
Воспроизводимый агент-ревьюер для проверки WU/phase gate и выдачи промтов implementation-agent без потери контекста workflow.

## Результат
Файлы созданы. Подключение: `@softphone-reviewer` или rule `reviewer-agent` при «Проверяй».
