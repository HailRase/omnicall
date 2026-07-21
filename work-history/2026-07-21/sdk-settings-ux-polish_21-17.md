# Senior UX/UI: Axatalk SDK Settings + shared Settings measure

**Дата:** 2026-07-21 21:17
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsForm.module.css`
- `src/renderer/components/settings/panels/SdkModuleSettings*.tsx`
- `src/renderer/components/settings/panels/SettingsIntegrationsPanel.tsx`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `UI-Component-Catalog.md`, `I18N-Coverage.md`, `UX-UI-Design-Blueprint.md`

## Что
- Введён общий content measure Settings (36rem / preference 28rem) и исправлены toggle/field rows без full-bleed `space-between`
- Перестроена IA SDK: статус+Refresh сверху, callouts TOFU/pairing, доверенные сайты, клиенты/grant, hide один раз
- Permissions collapsed by default; destructive confirm для remove/blacklist; stacked forms; human copy ru/en/fr/de/bg
- Обновлены тесты, Storybook Light/Dark (+ PendingAttention), каталог и blueprint layout rule

## Зачем
- Довести Settings → Axatalk SDK до release polish и выровнять sibling Settings pages по общей колонке и ритму строк

## Результат
- `npm run i18n:check` PASS
- `npm run typecheck` PASS
- `npm run lint` PASS
- `npx vitest run src/renderer/components/settings` — 91 passed
- SemVer не поднимался (polish без release cut)
