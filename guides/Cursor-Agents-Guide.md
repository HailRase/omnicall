# Руководство: агенты и команды Cursor

> Краткая карта для разработчика. Живой статус: [`STATUS.md`](../docs/softphone/STATUS.md). Точка входа: [`AGENTS.md`](../AGENTS.md).  
> **Версии, релизы, CI/CD:** [`Developer-Release-CI-Guide.md`](Developer-Release-CI-Guide.md)

## Быстрый старт

```
/status     → что сейчас в работе?
/scope      → приоритеты без кода
/ui         → UX/UI реализация
/logic      → бизнес-логика (Domain, Use Cases)
/preflight  → test + lint перед ревью
/release    → release cut (SemVer, tag, manifest)
/review     → gate work unit
/audit      → полный аудит перед merge
```

## Команды

| Команда | Агент | Пишет код? | Когда |
|---------|-------|------------|-------|
| `/status` | любой | нет | «Что дальше?» |
| `/scope` | планировщик | нет | Приоритеты, выбор задачи |
| `/plan-wu` | планировщик | нет | Разбить WU на шаги |
| `/ui` | UI implementation | **да** | Экран, компонент, стили |
| `/logic` | Domain implementation | **да** | Use Case, Domain, порты |
| `/adapter` | RAT implementation | **да** | JsSIP, real adapters |
| `/preflight` | проверка | запускает CI-скрипты | Перед `/review` |
| `/release` | release agent | manifest, CHANGELOG, tag | Выпуск версии на GitHub |
| `/registry` | проверка | нет | Registry vs код |
| `/review` | WU reviewer | нет | «Проверяй» после задачи |
| `/rat-review` | RAT reviewer | нет | После RAT step |
| `/audit` | super reviewer | нет | Перед merge, спорный PR |
| `/arch-review` | architecture review | нет | Перед крупным рефакторингом |

## Три агента реализации

### `/ui` — UX/UI

1. **Спрашивает** (до 3 вопросов): что сделать? out of scope?
2. **Если молчите** — берёт priority #1 из [`STATUS.md`](../docs/softphone/STATUS.md) или [`TASK-QUEUE.md`](../docs/softphone/TASK-QUEUE.md).
3. **Делает:** состояния → React → CSS Modules → тесты → `ui:catalog` → registry → work-history.
4. **Не делает:** SIP, бизнес-правила, Electron API.

Skill: `.cursor/skills/ui-implementation-agent/SKILL.md`

### `/logic` — бизнес-логика

1. **Спрашивает:** операция, F-XXX / LF-XXX, mock vs real.
2. **Default** — F-008 DTMF или первая задача в TASK-QUEUE.
3. **Делает:** Events → Use Case → port → mock adapter → тесты → registry.
4. **Не делает:** React-компоненты.

Skill: `.cursor/skills/domain-implementation-agent/SKILL.md`

### `/adapter` — real integration

Отдельный трек RAT. OCP и transfer — только по явному resume.

Skill: `docs/softphone/real-integration/MASTER-AGENT-PROMPT.md`

### `/release` — distribution release

1. **Не** реализует фичи; только release cut (F-019, F-020).
2. **Делает:** preflight → CHANGELOG → SemVer → `release:sync-manifest` → commit → tag → verify CI.
3. **Не делает:** bump версии в `/ui`/`/logic`; electron-updater; auto-install.

Skill: `.cursor/skills/release-agent/SKILL.md` · Playbook: `RELEASE-PLAYBOOK.md`

## Reviewer-ы

| | `/review` | `/rat-review` | `/audit` |
|--|-----------|---------------|----------|
| Фокус | Один WU | RAT step | Любой diff / merge |
| Код | не пишет | не пишет | не пишет |
| Выход | PASS → промт WU+1 | Continuation / Refactor | Findings + merge-ready |

**Severity:** Blocker (стоп) · High · Low · Info

## Формат ответа агента

Все агенты используют единый шаблон:

`.cursor/skills/_shared/response-contract.md`

Секции: **Статус сессии** · **Прогресс** (таблица ✓/◐/✗) · **Вердикт** · **Документация** · **Следующий шаг**

## Типичные циклы

**UI-задача:**
```
/scope → /ui «tooltips» → код → /preflight → /review
```

**Логика:**
```
/logic «F-008 DTMF» → код → /preflight → /rat-review
```

**Перед merge:**
```
/preflight → /audit → merge
```

## Регистрация в доках (обязательно)

| Артефакт | Кто обновляет |
|----------|----------------|
| `Feature-Registry.md` | `/ui`, `/logic`, `/adapter` |
| `Legacy-Feature-Coverage.md` | при LF-XXX |
| Handoff `[x]` | implementation-агент |
| `STATUS.md` | при закрытии WU / смене tests |
| `TASK-QUEUE.md` | claim / done |
| `work-history/` | implementation-агент в конце |
| `CHANGELOG.md`, manifest, tag | `/release` |

Reviewer **проверяет**; `/audit` — глубже.

## Отдельные чаты

| Чат | Команды |
|-----|---------|
| Реализация | `/ui`, `/logic`, `/adapter` |
| Релиз | `/release` |
| Ревью | `/review`, `/rat-review`, `/audit` |

Не смешивать — reviewer не должен видеть «черновой» контекст реализации.

## Если агент ушёл в scope

```
Stop gate. Только <X>. Out of scope: <Y>.
```

Или новый чат с нужной командой.

## Правила (кратко)

| Всегда | По globs |
|--------|----------|
| `00-core`, `typescript-react-electron`, `work-history` | `ux-ui-*` (renderer), `testing-*`, `feature-registry`, … |

## Шпаргалка фраз

| Нужно | Напишите |
|-------|----------|
| Ревью WU | `/review` или «Проверяй» |
| Полный аудит | `/audit` |
| RAT | `/rat-review` |
| Следующая задача | `/scope` |
| Проверка CI | `/preflight` |
| Выпуск версии | `/release` |

## Файлы агентов

| Тип | Путь |
|-----|------|
| Commands | `.cursor/commands/*.md` |
| Skills | `.cursor/skills/*/SKILL.md` |
| Rules | `.cursor/rules/*.mdc` |
| Intake | `.cursor/skills/scope-intake/SKILL.md` |

---

## Troubleshooting (типичные сбои)

| Симптом | Причина | Что делать |
|---------|---------|------------|
| Агент пишет код в `/review` | Смешанный чат | Новый чат, только `/review`, readonly |
| Baseline 488 tests | Устаревший промт | `/status` → читать STATUS.md (697) |
| Handoff not found | Архив P02–P08 | `handoffs/archive/P0N/` |
| UI агент лезет в Use Case | Нет escalation | «Stop → `/logic`»; см. ui-implementation-agent |
| OCP внезапно в scope | Scope creep | «OCP DEFERRED» + ADR-0002 |
| Registry path missing | Drift evidence | `npm run registry:check` |
| Catalog drift | Не запускали ui:catalog | `npm run ui:catalog:check` |
| Два формата ответа | Старый шаблон | Все агенты → `response-contract.md` |
| TASK-QUEUE застрял в claimed | Агент забыл | Вручную `done` или напомнить в промте |
| Агент раздул WU | Нет stop gate | «Stop gate. Только X. Out of scope: Y.» |

## Эскалация ui ↔ logic

```
/ui обнаружил нужен Use Case  →  стоп  →  /logic
/logic готов projection       →  стоп  →  /ui для wiring
```

Добавляйте строку в `TASK-QUEUE.md` при передаче между агентами.
