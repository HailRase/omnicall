# Русский гайд OmniCall Kit (npm README)

**Дата:** 2026-07-28 09:49
**Статус:** выполнено
**Коммит:** —

## Где
- `omnicall-kit/docs/guide/RU-DEVELOPER-GUIDE.md`
- `omnicall-kit/packages/sdk/README.md` (npm page)
- `omnicall-kit/docs/guide/README.md`
- `omnicall-kit/README.md`

## Что
- Создан канонический RU-гайд для интеграторов CRM (все обязательные H2, `<details>`-примеры, API namespaces, events, errors, anti-patterns, prod checklist)
- Синхронизирован с `packages/sdk/README.md`, чтобы гайд отображался на странице npm пакета `@softomnitel/omnicall-kit`
- Обновлён индекс `docs/guide/README.md`: секция RU/Integrators, статус F-011 implemented / DI-10 closed / `0.1.0` + `rc`
- В корневом `omnicall-kit/README.md` добавлена ссылка на RU-гайд как точку входа для интеграторов

## Зачем
- Один файл «прочитал — понял, как встроить SDK»; русская документация видна на npm после publish README

## Результат
- DoD мастер-промпта выполнен (файл, структура H2, details, ссылки, work-history)
- Production TypeScript/SDK код не менялся
- npm publish не выполнялся (out of scope промпта)
