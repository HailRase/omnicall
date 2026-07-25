# Единый bootstrap splash (контракт, цвет иконки, плавный bounce)

**Дата:** 2026-07-25 18:00
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/Bootstrap-Splash-Contract.md` (новый)
- `src/shared/platform/startupSplashColors.ts`
- `src/renderer/shells/BootstrapSplashShell.*`
- `src/renderer/index.html`
- `src/renderer/styles/tokens.css` (`--color-brand-splash-*`)
- Feature Registry / UI-Architecture / UX blueprint / Legacy / STATUS / AGENTS / I18N-Coverage

## Что
- Один визуальный loader: HTML `#boot-splash` → React splash без blank/двойного вида
- Цвет мяча и progress = градиент светлой иконки `#249DFF→#007AFF→#0058D6`
- Bounce 1200ms, мягче squash/stretch; phase-sync через `resolveBootstrapSplashAnimationDelayMs`
- Progress поддерживает `--progress-fill` (обратная совместимость)
- Документация синхронизирована, чтобы не было рассинхрона HTML/React/icon

## Зачем
- Убрать две «разные» загрузки, белый кадр, дёрганье и неверный синий акцент UI

## Результат
- focused vitest (splash/progress/colors) — OK
- stylelint splash CSS — OK
- `registry:check` — OK
- Полный reload приложения для визуальной проверки handoff
