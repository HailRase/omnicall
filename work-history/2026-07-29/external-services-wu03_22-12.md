# F-031 WU-03 Variable Resolver and Event Matcher

**Дата:** 2026-07-29 22:12
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/integration/external-services/`
- `src/application/services/integration/external-services/`
- `external-services-plan/PROGRESS.md`

## Что
- Добавлены чистые matcher, template, HTTP request builder, redaction и UTF-8 truncation.
- Добавлены трекер call/campaign/ACD контекста и mapper поддерживаемых Domain events.
- Реализованы enable/focus gates, отдельные missed/rejected, безопасные campaign/ACD поля.
- Добавлены 10 focused unit tests и обновлены F-031 статус, handoff и очередь.

## Зачем
- Фиксирует детерминированные правила подготовки автоматизаций до асинхронной очереди и HTTP.

## Результат
- `vitest` WU-03: PASS (10 tests); `typecheck`, targeted ESLint и `registry:check`: PASS.
- Полный `npm run lint`: не выполнен из-за предсуществующих 118 parser errors в `axatalk-sdk/**/dist`.
