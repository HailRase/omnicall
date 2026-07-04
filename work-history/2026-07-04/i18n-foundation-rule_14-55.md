# I18n full migration ru-en-fr-de

**Дата:** 2026-07-04 15:43
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/*`, `src/application/settings/*`
- `src/application/projections/*` (UI-facing key contracts)
- `src/renderer/i18n/*`, `src/renderer/components/*`, `src/renderer/helpers/*`, `src/renderer/shells/*`, `src/renderer/hooks/*`
- `docs/softphone/I18N-Architecture.md`, `docs/softphone/I18N-Coverage.md`, `docs/softphone/Feature-Registry.md`, `docs/softphone/adr/ADR-0006-interface-internationalization.md`
- `package.json`, `docs/softphone/release/update-manifest.json`, `docs/softphone/examples/update-manifest.json`

## Что
- Расширены интерфейсные языки до `ru|en|fr|de`; обновлены парсинг/валидация/миграция `UserSettings` и тесты.
- Добавлены полные i18n-каталоги и key parity для 4 локалей; расширены namespaces для всех UI поверхностей.
- Исправлен dropdown языка в Settings General: отдельные классы, корректная ширина/выравнивание, без numeric-style.
- Выполнена миграция всех оставшихся renderer модулей (header/call/recovery/status/session/account/settings panels/helpers/shells/hooks) на i18n runtime.
- UI-facing `application/projections` переведены на semantic key/params контракты без локализованных предложений.
- Обновлены Feature Registry и матрица покрытия: модульные pending gaps закрыты; выполнен semver bump до `0.1.0` и синхронизация release manifests.

## Зачем
- Требовалось закрыть i18n не частично, а по всем UI-facing модулям с соблюдением архитектурных границ.
- Единый key-based контракт снижает риск регрессий и обеспечивает масштабируемую локализацию.

## Результат
- `npm run test` — успешно (953 passed, 1 skipped; jsdom `HTMLMediaElement.pause` stderr известны и не валят suite).
- `npm run lint` — успешно.
- `npm run typecheck` — успешно.
- `npm run i18n:check` — успешно.
- `npm run ui:catalog` — успешно.
