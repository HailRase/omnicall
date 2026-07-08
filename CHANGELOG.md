# Changelog

All notable user-visible changes to **Axatalk** are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning: SemVer from `package.json` (pre-1.0). Git tag: `v<version>`.

## [Unreleased]

### Removed

- Legacy operator platform integration removed per ADR-0005; documentation, rules, and agent skills updated for SIP-only product path.

## [0.7.1] - 2026-07-07

### Added

- F-016: изменение размера окна только в режиме настроек; при выходе восстанавливаются compact width и height
- Настройки: числовые поля на UI Kit `Input` (`SettingsNumberInput`)

### Changed

- macOS: иконка Dock/Launchpad с отступами по Apple HIG (824×824 в canvas 1024)
- Windows: runtime-иконка панели задач крупнее (`windows-theme-icons`, +12.5% к macOS artwork)

## [0.7.0] - 2026-07-07

### Added

- F-016: macOS — кастомные traffic lights (Close, Minimize, Reload) вместо native maximize; reload на месте зелёной кнопки, без tooltip
- F-016: настройки — fullscreen overlay с window controls в верхней chrome-полосе; контент на всю ширину
- macOS: меню Edit с Cmd+C/V/A/X/Z для полей ввода

### Changed

- F-020: баннер обновления — отображение сверху окна
- Tooltip и IconTooltip — перенос длинного текста (overflow-wrap)
- DevTools доступны только в dev-сборке (`!app.isPackaged`)

## [0.6.1] - 2026-07-07

### Fixed

- F-024: диалог подтверждения удаления SIP-профиля отображается поверх fullscreen-настроек (`AlertDialog` z-index `--z-modal`)
- F-024: кнопки «Отмена» / «Удалить» вместо icon-only в диалоге удаления профиля

## [0.6.0] - 2026-07-07

### Added

- F-021: болгарская локаль (`bg`) в настройках интерфейса
- F-024: удаление сохранённого SIP-профиля с вкладки профиля (иконка корзины + подтверждение)
- UI Kit P0: Button, Input, Dialog, Alert, Tabs, Sonner и др.; Storybook + тесты
- LF-060: уведомления через Sonner — нейтральная поверхность, иконки success/error, без дедупликации повторных операций

### Changed

- F-020: баннер обновления на базе UI Kit `Alert` с иконкой `updates.available`
- Настройки мигрированы на UI Kit (кнопки, switch, select, tabs, form-field)
- `SavedAccountProfileSelector` переведён на UI Kit `Tabs`

## [0.5.1] - 2026-07-06

### Changed

- F-020: баннер обновления — floating overlay-карточка сверху вместо полосы в header; кнопки «Скачать» и «Позже» с иконками справа под текстом; Storybook `Updates/UpdateAvailableBanner`

## [0.5.0] - 2026-07-06

### Added

- F-016: системный shell UX — убрано стандартное меню File/Edit/View на Windows/Linux; отключён native maximize/fullscreen; кнопка Reload выполняет controlled restart после полного shutdown cleanup (hangup, media, SIP unregister, legacy operator logout); frameless window controls на Windows/Linux; stacked titlebar (controls сверху, avatar ниже); ошибка cleanup блокирует закрытие/перезапуск

## [0.4.0] - 2026-07-06

### Added

- F-024: сохранённые SIP-профили для быстрого входа — вкладки «Новый» и сохранённые аккаунты в Настройках → Аккаунт, вход по паролю для сохранённого профиля, сохранение профиля при авторизации, переключение A→B с подтверждением и unregister, удаление с подтверждением; пароль не сохраняется на диск

## [0.3.1] - 2026-07-06

### Changed

- F-020: баннер обновления — компактная полоса вверху header вместо полноэкранного modal overlay; только «Скачать» и «Позже»

## [0.3.0] - 2026-07-06

### Added

- F-023: локальные профили настроек per-account — изолированное хранение theme, language, multi-call, auto-answer, SIP recovery и codec preferences для каждого авторизованного SIP-аккаунта; disk persistence в Electron user-data

### Fixed

- F-015: preflight — исправлен `removed campaign sync test.integration.test.ts`, добавлен unit-тест `campaign_event` в `removed inbound message use case`

## [0.2.0] - 2026-07-06

### Added

- F-022: панель «Кодеки» в настройках — drag-and-drop порядок audio-кодеков, включение и отключение (кроме `telephone-event`)

### Changed

- F-022: video-кодеки в настройках — future-only (read-only, без reorder/toggle)
- F-022: порядок audio-кодеков применяется на новых RTC-сессиях (JsSIP adapter, dual-layer apply)
- Публичный README и структурированные release notes на `axatalk-releases` (автогенерация из `distribution/CHANGELOG.md`)

### Fixed

- F-022: устранена гонка codec wiring при исходящем/входящем вызове; SDP fallback при ошибке `setCodecPreferences`

## [0.1.3] - 2026-07-05

### Fixed

- F-020: «Позже» на баннере обновления сохраняется в `localStorage` и не показывается снова после перезапуска приложения до следующей версии

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

[Unreleased]: https://github.com/HailRase/softphone-electron/compare/v0.7.0...main
[0.7.0]: https://github.com/HailRase/softphone-electron/releases/tag/v0.7.0
[0.6.1]: https://github.com/HailRase/softphone-electron/releases/tag/v0.6.1
[0.6.0]: https://github.com/HailRase/softphone-electron/releases/tag/v0.6.0
[0.5.1]: https://github.com/HailRase/softphone-electron/releases/tag/v0.5.1
[0.5.0]: https://github.com/HailRase/softphone-electron/releases/tag/v0.5.0
[0.4.0]: https://github.com/HailRase/softphone-electron/releases/tag/v0.4.0
[0.3.1]: https://github.com/HailRase/softphone-electron/releases/tag/v0.3.1
[0.3.0]: https://github.com/HailRase/softphone-electron/releases/tag/v0.3.0
[0.2.0]: https://github.com/HailRase/softphone-electron/releases/tag/v0.2.0
[0.1.3]: https://github.com/HailRase/softphone-electron/releases/tag/v0.1.3
[0.1.2]: https://github.com/HailRase/softphone-electron/releases/tag/v0.1.2
[0.1.1]: https://github.com/HailRase/softphone-electron/releases/tag/v0.1.1
[0.1.0]: https://github.com/HailRase/softphone-electron/releases/tag/v0.1.0
[0.0.3]: https://github.com/HailRase/softphone-electron/releases/tag/v0.0.3
[0.0.2]: https://github.com/HailRase/softphone-electron/releases/tag/v0.0.2
[0.0.1]: https://github.com/HailRase/softphone-electron/releases/tag/v0.0.1
