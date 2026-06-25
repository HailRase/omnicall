# Cursor RAT optimization (rules, docs, handoffs)

**Дата:** 2026-06-25 20:20
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/STATUS.md`, `AGENTS.md`, `docs/softphone/README.md`
- `.cursor/rules/00-core.mdc` (новый); удалены `architecture`, `ai-agent-behavior`, `ocp-deferred`, `transfer-real-backlog`
- `.cursor/rules/*.mdc` — globs migration для contextual rules
- `.cursor/skills/softphone-reviewer/`, `real-integration-agent/` — убраны stale snapshots
- `docs/softphone/handoffs/archive/P02–P08/` — архив завершённых handoffs
- `.cursor/commands/`, `package.json` (`ui:catalog:check`)

## Что
- Создан единый live-статус `STATUS.md` (694 tests, P11 UI-4 done)
- Объединены always-rules: ~1307 → ~171 строк alwaysApply (−87%)
- Context rules переведены на globs (feature-registry, legacy, roadmap, testing, ux-ui)
- Обновлены PROGRESS, Implementation-Roadmap, MASTER-AGENT-PROMPT, 00-SNAPSHOT
- Архивированы handoffs P02–P08; активные P11 остались в `handoffs/`
- Обновлены ссылки в Legacy-Feature-Coverage и связанных docs
- Добавлены AGENTS.md, handoffs/README.md, Cursor commands, `ui:catalog:check`

## Зачем
Снизить token overhead always-rules, устранить stale snapshots и привести Cursor RAT к единой структуре.

## Результат
- `npm run test` — 694 passed, 1 skipped
- Следующая итерация: очистить User Rules в Cursor Settings от дублей; опционально CI для `ui:catalog:check`
