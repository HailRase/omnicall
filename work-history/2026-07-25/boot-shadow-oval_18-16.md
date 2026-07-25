# Овальная тень мячика на bootstrap splash

**Дата:** 2026-07-25 18:16
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/index.html` (`.boot-shadow`)
- `src/renderer/shells/BootstrapSplashShell.module.css` (`.ball-shadow`)

## Что
- Вместо плоской «капсулы» (`border-radius: 9999px` + blur) — эллипс `border-radius: 50%` и `radial-gradient`

## Зачем
- Тень под мячом выглядела прямоугольной

## Результат
- Доп. правка: тень снова видима (овал ниже мяча, выше opacity) — reload для `index.html`
