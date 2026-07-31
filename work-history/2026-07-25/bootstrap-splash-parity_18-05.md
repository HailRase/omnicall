# Паритет HTML/React splash (иконка, текст, glow, cyan)

**Дата:** 2026-07-25 18:05
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/index.html`, `BootstrapSplashShell.tsx`
- `iconCatalog.ts` + `Icon-Registry.md` (`bootstrap.mark` = Phone)
- `startupSplashColors.ts`, `tokens.css`
- `Bootstrap-Splash-Contract.md`, Feature Registry

## Что
- Иконка: обычный `Phone` (`bootstrap.mark`), не `PhoneOutgoing` со стрелкой
- Текст: HTML берёт те же строки, что `bootstrap.loading` (по `navigator.language`)
- Atmosphere cyan glow добавлен в `#boot-splash`
- Цвет мяча/бара: `#5AD4FF → #00B4FF → #0090E0` (более голубой)

## Зачем
- Убрать заметную смену «двух загрузок» и сделать splash визуально единым

## Результат
- focused vitest — OK
- Нужен полный reload окна для `index.html`
