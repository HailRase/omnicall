# Changelog

All notable user-visible changes to **Axatalk** are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning: SemVer from `package.json` (pre-1.0). Git tag: `v<version>`.

## [Unreleased]

## [0.1.2] - 2026-07-05

### Changed

- F-020: overlay обновления — центрированный modal со scrim, иконкой, badge версии и улучшенной типографикой (light + dark)

### Fixed

- F-020: «Скачать» на overlay скрывает prompt и сохраняет dismissed version до следующего релиза

## [0.1.1] - 2026-07-05

### Fixed

- F-020: «Открыть страницу загрузки» открывает manifest `downloadUrl` (`/releases/latest`), а не прямой URL установщика из `platforms.*`
- F-020: фоновая проверка обновлений не записывает error/unavailable/invalidManifest в snapshot настроек
- F-020: «Позже» на баннере обновления скрывает его до следующей версии (persist в `UserSettings`)
- F-016: выравнивание registration status dot у аватара после перехода на IconTooltip
- F-020: цвет текста primary-кнопки баннера обновления через semantic token `--color-text-on-accent`

## [0.1.0] - 2026-07-05

### Added

- F-020: фоновая проверка обновлений при запуске и неблокирующий баннер «Доступно обновление» (ручная установка)
- F-021: интернационализация интерфейса (ru, en, fr, de) и выбор языка в настройках
- Улучшенные подсказки (IconTooltip, Floating UI) и UX бокового меню настроек
- Windows MSI-установщик; исправлены иконки меню Linux `.deb`

### Changed

- T-008: рефакторинг состояния SIP transport/register; ручной перерегистрация и восстановление после сбоев
- Панель «Состояние системы»: терминология сервера, очистка SIP-журнала из UI
- CSS Modules: единый kebab-case и dot-notation в renderer

### Fixed

- SIP: корректные семантики transport reconnect и обработка 403 при регистрации
- SIP: таймаут transport, ручной reregister, runtime recovery регистрации
- Проекции после logout и обратная связь на панели аккаунта
- Немедленная очистка SIP-журнала в панели состояния системы

## [0.0.3] - 2026-07-01

### Changed

- Публикация релизов на публичный `axatalk-releases` (тест пайплайна дистрибуции)
- Фильтр assets: только установщики `Axatalk-{version}-*`, без `win-unpacked`

## [0.0.2] - 2026-07-01

### Added

- Автоматическая публикация установщиков на GitHub Release при push тега `v*.*.*` (CI)
- Документация: руководство разработчика по релизам (`Developer-Release-CI-Guide.md`), playbook, агент `/release`
- Инструкции по Linux: AppImage (рекомендуется), установка `.deb` через терминал/GDebi

### Changed

- Разделение CI: проверки на PR/push (`ci.yml`) и сборка релиза (`release.yml`)
- Обновлены пользовательские инструкции по скачиванию и установке

### Fixed

- Стабильная сборка на GitHub Actions без `GH_TOKEN is not set` (`run-electron-builder.mjs`)

## [0.0.1] - 2026-07-01

### Added

- Initial Axatalk distribution (Windows, macOS, Linux installers)
- F-020 manual in-app update check (manifest on `main`, no auto-install)
- F-019 packaging via electron-builder and GitHub Actions

### Fixed

- CI electron-builder publish blocked (`run-electron-builder.mjs`, `--publish never`)

[Unreleased]: https://github.com/HailRase/softphone-electron/compare/v0.1.2...main
[0.1.2]: https://github.com/HailRase/softphone-electron/releases/tag/v0.1.2
[0.1.1]: https://github.com/HailRase/softphone-electron/releases/tag/v0.1.1
[0.1.0]: https://github.com/HailRase/softphone-electron/releases/tag/v0.1.0
[0.0.3]: https://github.com/HailRase/softphone-electron/releases/tag/v0.0.3
[0.0.2]: https://github.com/HailRase/softphone-electron/releases/tag/v0.0.2
[0.0.1]: https://github.com/HailRase/softphone-electron/releases/tag/v0.0.1
