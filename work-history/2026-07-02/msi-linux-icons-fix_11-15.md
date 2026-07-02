# MSI installer и исправление Linux-иконок

**Дата:** 2026-07-02 11:15
**Статус:** выполнено
**Коммит:** —

## Где
- `electron-builder.yml`
- `scripts/build-app-icons.py`, `build/icons/`
- `package.json`, `scripts/distribution-config.mjs`
- `.github/workflows/release.yml`, `scripts/publish-distribution-release.mjs`
- `guides/install-instruction.md`, `guides/User-Guide-RU.md`, `guides/RELEASE-PLAYBOOK.md`

## Что
- Добавлен MSI target для Windows (рядом с NSIS `.exe`), фиксированный `upgradeCode`
- Linux: `icon: icons` вместо `icon.png` — каталог `build/icons/{N}x{N}.png` для hicolor
- Генератор иконок создаёт Linux-набор 16…512 px
- `build:icons` вызывается перед `build:win/mac/linux`
- CI и distribution-фильтр включают `.msi`

## Зачем
- Корпоративная установка Windows (MSI/GPO) и отображение иконки в меню Linux после `.deb`

## Результат
- `npm run build:win` — OK: `Axatalk-0.0.3-win-x64.exe` + `Axatalk-0.0.3-win-x64.msi`
- Linux-иконки: проверка `.deb` на Ubuntu после следующего релизного cut
