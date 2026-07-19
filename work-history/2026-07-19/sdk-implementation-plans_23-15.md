# Планы реализации Axatalk SDK

**Дата:** 2026-07-19 23:15
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/`
- `axatalk-sdk-integration/`
- `.cursor/skills/axatalk-sdk-integration/`
- `.cursor/commands/sdk-*.md`
- `AGENTS.md`, `docs/softphone/Feature-Registry.md`, `Implementation-Roadmap.md`, `Legacy-Feature-Coverage.md`, `STATUS.md`

## Что
- Подготовлен англоязычный execution package SDK-00…SDK-10 для отдельного npm SDK: архитектура, безопасность, протокол, этапы, чек-листы и Definition of Done.
- Подготовлен англоязычный desktop integration track DI-00…DI-10 для F-011/P12: main↔renderer broker, secure local WS, события, команды, настройки и E2E.
- Добавлены Cursor skill и команды `/sdk-project`, `/sdk-integration`, `/sdk-review`.
- Добавлены baseline snapshot, consumer/desktop smoke checklists и master handoff P12 с архитектурными, security и regression gate.
- Зафиксированы запреты на второй Facade в main, raw credentials, экспорт внутренних Domain Events и обход Call Engine.
- Registry, Roadmap, Legacy Coverage, STATUS и корневой onboarding связаны с новыми планами.

## Зачем
- Дать агентам безопасную последовательность реализации SDK и desktop-интеграции без регрессий SIP/OCP и без неявных архитектурных решений в production code.

## Результат
- Документация готова к старту с DI-00 и SDK-00/SDK-01.
- `npm run registry:check` — успешно, 55 путей найдено, 0 отсутствует.
- `git diff --check` — успешно.
- Новые плановые Markdown-файлы проверены на отсутствие кириллицы; production code и версия приложения не изменялись.
