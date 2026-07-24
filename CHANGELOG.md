# Changelog

All notable user-visible changes to **Axatalk** are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning: SemVer from `package.json` (pre-1.0). Git tag: `v<version>`.

## [Unreleased]

### Added

- **F-030** Перенос настроек оператора: Settings → General → экспорт/импорт portable JSON (`axatalk.preferences` v1) без паролей, API-ключей и SDK pairing; device id сбрасываются; на новой версии приложения недостающие поля поднимаются через `migrateUserSettings` с дефолтами (даунгрейд схемы/formatVersion — fail closed).
- Root SDK connect ceremony modal: Origin TOFU → pairing stepper (blur overlay поверх любого shell route); для уже trusted Origin — только pairing.
- Waiting Cancel в ceremony (без blacklist); gateway cancel pending on disconnect + Origin leave-allowed; TTL sweeper для orphaned pairing/TOFU.
- SDK login activate: `account:activate-profile` принимает `login` (+ optional `mode`); consent modal с выбором SIP/OCP; idempotent same-client; reauthorize для другого clientId; `logout_required` informational modal.
- Global OCP sign-in progress overlay: один `OcpSignInProgress` на shell (dialpad / contacts / history / settings), auto-open по live `authorizationProgress` (в т.ч. SDK OCP activate); density `compact` на главном окне и `comfortable` в settings.
- Compact OCP progress: статус этапа только иконками (без «Ожидает/Выполняется/…»); tooltip ошибки сохранён.
- SDK activate consent: компактный footer Cancel▾ (Запретить сайту) + Allow; Deny синхронизирует matrix в Settings Trusted sites.

### Changed

- Pairing / TOFU больше не открывают Settings и не показываются callout’ами в Axatalk SDK card; Settings остаётся policy (trusted/blocked/matrix/revoke).
- Disconnect mid-TOFU больше не пишет Origin в blacklist (`cancel` ≠ Deny).
- Убран Settings «Временный доступ к профилю» / temporary `profileRef` grant; `account.activate` поднимается из Origin matrix + `sdk:permission-changed`.
- OCP progress Dialog снят с `AccountPanel` / Settings mount — только shell host, чтобы overlay не пропадал при закрытых Settings.
### Fixed

- SDK `window.show`: софтфон поднимается поверх других приложений (restore/show/focus/`moveTop` + краткий always-on-top pulse с восстановлением прежнего pin), а не только мигает в панели задач Windows (ADR-0013).
- Входящий/исходящий звонок, SDK Origin trust (TOFU), pairing и activate-consent поднимают окно тем же native helper.
- Activate consent raise: dedupe по `attentionId` на эпизод (как pairingRequestId), а не по origin+profile — повторный запрос после Cancel снова поднимает окно.

## [0.12.0] - 2026-07-21

### Added

- SDK Origin TOFU: первое подключение неизвестного Origin показывает modal Allow/Deny.
- Чёрный список Origin с Unblock (restore matrix для ранее allowed; first-Deny → unknown).
- Per-Origin capability matrix в Settings → Integrations → Axatalk SDK.
- Consent modal на каждый `account.activateProfile` (когда matrix разрешает activate).
- Pre-auth доступ к Settings → Axatalk SDK (OCP Module по-прежнему gated).

### Changed

- SDK gateway всегда слушает loopback (toggle enable в Settings убран; kill-switch только `AXATALK_SDK_GATEWAY=0`).
- Origin trust хранится machine-common (`sdk-origin-trust.json`); blacklist побеждает env seed.
- Схема UserSettings v11 (миграция `enabled`/flat allowlist → trust states + matrix).

## [0.11.2] - 2026-07-19

### Fixed

- Модалка перезаписи сохранённых данных закрывается сразу после подтверждения (не ждёт весь OCP/SIP sign-in).
- Футер overwrite-диалога: Cancel + ButtonGroup — «Отмена» не выталкивается за край модалки.
- Меню «Перезаписать и войти» больше не уходит под AlertDialog.
- Disconnect OCP в модалке входа возвращает полный pre-login idle (account session + SIP), чтобы «Войти» снова был доступен без avatar Logout.
- «Переподключить» в Account показывается только для профиля с активной account session.

## [0.11.1] - 2026-07-19

### Fixed

- OCP modal Reconnect больше не вызывает новый Login: recovery через Facade при уже активной account session (ADR-AF-005).
- Отмена OCP sign-in не даёт stale attempt перезаписывать progress и не запускает promote/register после cancel.
- Disconnect OCP (Settings / OCP-only) возвращает Server/Auth в idle, сохраняя локальную сессию и уже установленный SIP.

### Changed

- Подпись Disconnect в модалке OCP: «Отключить OCP» (все локали), чтобы не путать с полным Logout.

## [0.11.0] - 2026-07-17

### Changed

- OCP-вход в Account открывает модалку с blur-фоном: общий и поэтапный Progress (заполнение по таймауту этапа), зелёный/красный статус, tooltip причины ошибки, footer «Отключиться» / «Переподключиться».

### Added

- Пятиэтапный OCP-вход с отдельными таймаутами, точным failed stage и полным перезапуском flow.
- Локальный rolling 24-hour журнал уведомлений с фильтрами, поиском, пагинацией и suppressed marker.
- Однокнопочный вход из сохранённого профиля с замаскированными SIP/OCP секретами.

### Changed

- Account session, OCP authorization и SIP readiness разделены на независимые состояния.
- Выход выполняется единым Application-каскадом OCP → SIP → local account session.
- Ошибки входа остаются видимыми до редактирования/retry; overwrite и dirty-draft UX стали явными.

### Fixed

- Устранена обработка stale OCP сообщений от заменённого WebSocket.
- Profile/secret persistence получила monotonic lifecycle, compensation и corruption recovery.
- Секреты исключены из Domain Events, retry snapshots, логов и журнала уведомлений.

## [0.10.4] - 2026-07-17

### Fixed

- Account: отмена диалога обновления профиля больше не запускает авторизацию.
- Account: добавлено продолжение входа без перезаписи и проверка изменений SIP/OCP-полей.
- Account: диагностические статусы перенесены в «Состояние системы», уведомления разделяют подключение и регистрацию.

## [0.10.3] - 2026-07-13

### Changed

- F-027: полноэкранный picker трансляции экрана с табом Google Chrome
- F-027: swap local/remote по клику на PiP preview
- F-027: настройка «Включать камеру после соединения» (Settings → Video, schema v6)
- Dialpad: единый зелёный блок кнопок звонка; incoming card — iPhone-like blur и inset-обводка

### Fixed

- F-027: ложный downgrade исходящего video→audio при флаппинге media-track (только SIP/SDP сигнал)
- F-027: стабильность remote video presence — без «Ожидание видео» во время активного видеозвонка
- Toast и banner обновлений — безопасные отступы от window controls (Windows/macOS/Linux)
- Уведомление при audio-only ответе на исходящий видеовызов

## [0.10.2] - 2026-07-12

### Fixed

- upgrade release version

## [0.10.1] - 2026-07-12

### Fixed

- Video codec prority
- Sync video codec settings with new sessions

## [0.10.0] - 2026-07-12

### Added

- F-012: интеграция гарнитуры Web HID (Jabra/Poly) — ответ, сброс, mute, hold, LED sync; панель настроек гарнитуры
- F-027: видеозвонки — кнопка Video call на dialpad, камера и трансляция экрана, fullscreen-модалка, «Ответить с видео» на входящем; Settings → Video (устройства, превью, кодеки)
- F-013: история звонков — исход, причина завершения, длительность

### Removed

- Legacy operator platform integration removed per ADR-0005; SIP-only bootstrap — единственный продуктовый путь

### Fixed

- F-012: hardening mute/hold/LED sync; Poly pulse/latch desync
- F-027: picker источника screen-share, SDP-gate для inbound video answer, polish fullscreen UX
- F-025: экспорт контактов CSV в frameless Electron
- F-002: выравнивание shell-теста панели перевода

## [0.9.0] - 2026-07-08

### Added

- F-002: глобальный оверлей входящего звонка — iPhone-like баннер сверху по центру; виден на всех маршрутах кроме dialpad с карточкой входящего в контексте; ответ/отклонение; навигация на главный экран звонка
- F-002: frosted-glass баннер с анимацией (Framer Motion), семантические токены `--incoming-call-*`, усечение длинных имён (`TruncatedTextLine`)

### Fixed

- F-025: импорт контактов CSV через real bootstrap gateway

## [0.8.0] - 2026-07-08

### Added

- F-013: история звонков — боковая панель со списком, фильтром пропущенных, перезвоном и группировкой по дате
- F-025: контакты — боковая панель со списком, поиском, добавлением/редактированием/удалением, карточкой контакта и быстрым звонком
- F-016: навигация shell (контакты и история поверх dialpad) через React Router; пункты в меню аватара
- Dialpad: иконка контактов в поле ввода номера (при пустом поле) для быстрого перехода к списку

### Changed

- Компактный UI списков контактов и истории (аватары, sublines, quick call)
- История: длительность для завершённых звонков, время звонка для пропущенных/сброшенных
- Контакты и история недоступны из меню и dialpad без SIP-регистрации

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

[Unreleased]: https://github.com/HailRase/softphone-electron/compare/v0.11.2...main
[0.11.2]: https://github.com/HailRase/softphone-electron/releases/tag/v0.11.2
[0.11.1]: https://github.com/HailRase/softphone-electron/releases/tag/v0.11.1
[0.11.0]: https://github.com/HailRase/softphone-electron/releases/tag/v0.11.0
[0.10.4]: https://github.com/HailRase/softphone-electron/releases/tag/v0.10.4
[0.10.3]: https://github.com/HailRase/softphone-electron/releases/tag/v0.10.3
[0.10.2]: https://github.com/HailRase/softphone-electron/releases/tag/v0.10.2
[0.10.1]: https://github.com/HailRase/softphone-electron/releases/tag/v0.10.1
[0.10.0]: https://github.com/HailRase/softphone-electron/releases/tag/v0.10.0
[0.9.0]: https://github.com/HailRase/softphone-electron/releases/tag/v0.9.0
[0.8.0]: https://github.com/HailRase/softphone-electron/releases/tag/v0.8.0
[0.7.1]: https://github.com/HailRase/softphone-electron/releases/tag/v0.7.1
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
