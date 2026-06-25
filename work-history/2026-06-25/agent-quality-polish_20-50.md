# Agent quality polish (P0–P1)

**Дата:** 2026-06-25 20:50
**Статус:** выполнено
**Коммит:** —

## Где
- `.cursor/skills/_shared/response-contract.md` — WU/RAT extensions
- `softphone-reviewer`, `real-integration-agent`, `holistic-reviewer` skills
- `.cursor/commands/ui.md`, `logic.md`, `audit.md`, `registry.md`, `arch-review.md`, `plan-wu.md`
- `scripts/check-registry-paths.mjs`, `npm run registry:check`
- `docs/softphone/Implementation-Roadmap.md` (P11 sync)
- `docs/softphone/Cursor-Agents-Guide.md` (troubleshooting)
- `ui-implementation-agent`, `domain-implementation-agent` (escalation)

## Что
- Единый response-contract для всех reviewer'ов
- Утолщены commands ui/logic/audit (stop gates, baseline)
- Escalation ui↔logic в implementation skills
- `/arch-review` + rule + command
- `registry:check` скрипт
- P11 roadmap синхронизирован со STATUS
- Troubleshooting в Cursor-Agents-Guide

## Зачем
Закрыть рассинхрон форматов, слабые commands и doc drift по P11.

## Результат
- `npm run registry:check` — OK (2 src paths)
- Следующий этап: расширить registry:check на bare module paths; `/contract` для P12
