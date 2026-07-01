# Changelog

All notable user-visible changes to **Axatalk** are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning: SemVer from `package.json` (pre-1.0). Git tag: `v<version>`.

## [Unreleased]

### Added

### Changed

### Fixed

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

[Unreleased]: https://github.com/HailRase/softphone-electron/compare/v0.0.2...main
[0.0.2]: https://github.com/HailRase/softphone-electron/releases/tag/v0.0.2
[0.0.1]: https://github.com/HailRase/softphone-electron/releases/tag/v0.0.1
