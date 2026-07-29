# F-031 WU-02: порты и mock-адаптеры

**Дата:** 2026-07-29 22:05
**Статус:** выполнено
**Коммит:** —

## Где
- `src/ports/integration/`, `src/ports/shared/`
- `src/adapters/mock/`
- `docs/softphone/adr/ADR-0022-external-services-http-isolation.md`

## Что
- Добавлены HTTP, journal, collection-file, clock и UUID контракты.
- Добавлены детерминированные mock-адаптеры и шесть контрактных тестов.
- Journal mock изолирует профили, ограничивает записи и отклоняет незамаскированные заголовки.
- ADR-0022 принят; F-031 handoff, STATUS, реестр и прогресс синхронизированы.

## Зачем
- Подготовить тестируемые границы для WU-03/WU-04 без сети, Electron и файловой системы.

## Результат
- Focused tests, typecheck, targeted lint и registry check прошли.
- `npm run lint` блокируется 118 ранее созданными `axatalk-sdk/packages/sdk/dist` файлами вне TS-проекта ESLint.
