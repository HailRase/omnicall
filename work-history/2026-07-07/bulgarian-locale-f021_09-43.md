# Bulgarian locale (F-021)

**Дата:** 2026-07-07 09:43
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/SupportedLanguage.ts`
- `src/renderer/i18n/messages.ts`, `runtime.ts`, `catalogs/bgMessages.ts`
- `src/renderer/i18n/locales/bg-strings.json`
- `scripts/build-bg-messages.mjs`, `scripts/bg-function-templates.mjs`
- `src/renderer/components/settings/panels/SettingsGeneralPanel.tsx`
- `docs/softphone/I18N-Architecture.md`, `I18N-Coverage.md`, `Feature-Registry.md`

## Что
- Добавлен `bg` в `SUPPORTED_LANGUAGES` и `parseSupportedLanguage`
- Создан полный болгарский каталог (555 ключей) с паритетом ru/en/fr/de
- Подключён `bg` в `I18N_MESSAGES`, runtime (`bg-BG`) и селектор языка в настройках
- Добавлен ключ `settings.general.language.bg` во все локали
- Обновлены тесты `SupportedLanguage`, `messages.test.ts` и документация F-021
- Добавлен скрипт `npm run` через `node scripts/build-bg-messages.mjs` для регенерации каталога

## Зачем
Расширить F-021 интернационализацию: пользователи могут выбрать болгарский язык интерфейса с немедленным применением и сохранением в `UserSettings`.

## Результат
- `npm run test` — 1472 passed, 1 skipped
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run i18n:check` — FAIL (pre-existing: `FormField.tsx` hardcoded string, вне scope)
