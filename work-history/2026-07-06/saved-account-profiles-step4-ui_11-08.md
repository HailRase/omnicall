# F-024 Step 4 — Saved account profiles UI

**Дата:** 2026-07-06 11:08
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/formatSavedAccountProfileSelectorLabel.ts`
- `src/application/projections/deriveSavedAccountProfileSelectorOptions.ts`
- `src/renderer/hooks/useAccountActions.ts`, `useSettingsActions.ts`
- `src/renderer/components/account/SavedAccountProfileSelector.tsx`
- `src/renderer/components/account/DeleteSavedAccountProfileConfirmationModal.tsx`
- `src/renderer/components/settings/panels/SettingsAccountPanel.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/i18n/messages.ts`
- `docs/softphone/Feature-Registry.md` (F-024)

## Что
- Селектор профилей («Новый» + сохранённые с disambiguation username/domain/server)
- Pre-fill при выборе профиля, очистка пароля, hint, focus password
- Checkbox «Сохранить профиль» для New/manual; delete + confirmation modal
- Logout → сброс селектора на «Новый» через `isSipRegistered` в `useAccountActions`
- `useSettingsActions.account` композирует account hook; i18n ru/en (+ fr/de parity)
- Тесты: domain, projection, hook, selector, modal, SettingsAccountPanel

## Зачем
UX Settings → Account для быстрого входа по сохранённым SIP-профилям без хранения пароля в UI/JSON.

## Результат
- Step 4 tests: 20/20 PASS (новые) + settings panel suite 13/13
- `npm run typecheck` — PASS
- `npm run lint` — PASS
- Следующий шаг: Step 5 — auth error mapping
