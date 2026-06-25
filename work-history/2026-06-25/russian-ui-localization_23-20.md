# Русский интерфейс (UI localization)

**Дата:** 2026-06-25 23:20
**Статус:** выполнено
**Коммит:** —

## Где
- `.cursor/rules/ux-ui-electron-react.mdc` — правило Language (Russian UI)
- `docs/softphone/UI-Design-System.md` — секция Language
- `src/renderer/**` — компоненты, helpers, hooks, iconCatalog
- `src/application/projections/**` — user-visible shell derivations
- `src/domain/shared/PhoneStatus.ts`, `src/domain/operator/AgentStatus.ts`
- тесты renderer + application projections (21 файл)

## Что
- Добавлено обязательное правило: весь user-visible copy на русском (без i18n v1)
- Переведены labels, ошибки, disabled reasons, aria-label, tooltips, баннеры
- Обновлён `iconCatalog` defaultLabel на русский
- Обновлены projection helpers и shell derivations с пользовательским текстом
- Исправлен ошибочный перевод fallback CallState в `multiLineCallProjection` (остался `Held`)

## Зачем
Единый русскоязычный интерфейс софтфона для операторов, включая сообщения об ошибках и состояния восстановления.

## Результат
- `npm run test` — 704 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
