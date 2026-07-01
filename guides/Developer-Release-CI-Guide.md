# Руководство разработчика: версии, релизы и CI/CD (Axatalk)

Понятная шпаргалка для тех, кто собирает установщики, выкладывает релизы и сопровождает проверку обновлений (F-019, F-020).

## Два репозитория

| Репозиторий | Назначение |
| --- | --- |
| `HailRase/softphone-electron` | **Исходники** (целевое состояние: private), CI, агенты |
| [`HailRase/axatalk-releases`](https://github.com/HailRase/axatalk-releases) | **Публично:** README, `update-manifest.json`, Releases (только установщики) |

Перенос и настройка: [`Distribution-Migration-Checklist.md`](Distribution-Migration-Checklist.md).

Связанные документы:

- Операционный чеклист релиза: [`RELEASE-PLAYBOOK.md`](RELEASE-PLAYBOOK.md)
- Пользователи и GitHub Releases: [`GitHub-Releases-Update-Guide.md`](GitHub-Releases-Update-Guide.md)
- Контракт manifest JSON: [`Manual-Update-Manifest.md`](Manual-Update-Manifest.md)
- Установка для конечных пользователей: [`install-instruction.md`](install-instruction.md)
- История изменений: [`../CHANGELOG.md`](../CHANGELOG.md)

---

## 1. Откуда берётся версия

| Что | Где | Пример |
| --- | --- | --- |
| Версия приложения | `package.json` → `version` | `0.0.1` |
| Версия в UI и «О программе» | Electron `app.getVersion()` | то же |
| Имя установщика | `electron-builder.yml` + версия | `Axatalk-0.0.1-win-x64.exe` |
| Git-тег релиза | отдельно, с префиксом `v` | `v0.0.1` |
| `latestVersion` в manifest | `docs/softphone/release/update-manifest.json` | `0.0.1` (без `v`) |

**Правило:** одна «истина» — поле `version` в `package.json`. Всё остальное синхронизируется при release cut.

---

## 2. Когда поднимать версию

До **1.0** используем упрощённый SemVer:

| Тип изменения | Куда bump | Пример |
| --- | --- | --- |
| Багфикс, без нового UX | PATCH | `0.0.1` → `0.0.2` |
| Новая видимая фича (Registry `implemented`) | MINOR | `0.0.2` → `0.1.0` |
| Ломающий контракт (host API, схема настроек v2) | MAJOR | `0.x` → `1.0.0` |

**Не поднимаем версию** за: рефакторинг, только тесты, только доки, промежуточные коммиты в WU.

**Кто bump'ит:** только release cut (`/release` или человек по playbook). Агенты `/ui` и `/logic` версию **не трогают**.

---

## 3. Два workflow в GitHub Actions

| Workflow | Файл | Когда запускается | Что делает |
| --- | --- | --- | --- |
| **CI** | `.github/workflows/ci.yml` | push и PR в `main` | `test`, `lint`, `typecheck`, `registry:check` |
| **Release** | `.github/workflows/release.yml` | push тега `v*.*.*` **или** ручной Run workflow | Сборка win + mac + linux |

### Push тега `v0.0.2`

1. Три job'а собирают установщики (matrix).
2. Job **publish** скачивает артефакты и создаёт/обновляет **GitHub Release** с бинарниками.
3. Ручная загрузка файлов в Release **не нужна**, если CI зелёный.

### Run workflow без тега

- Сборка проходит, файлы лежат в **Artifacts** (`installer-windows-latest`, …).
- В GitHub Release **ничего не публикуется** — удобно для проверки сборки.

### Важно про CI и electron-builder

На GitHub Actions есть `GITHUB_TOKEN`. electron-builder 26 может попытаться **implicit publish** и упасть с `GH_TOKEN is not set`.

Решение в репозитории:

- `electron-builder.yml`: `publish: null`
- сборка только через `scripts/run-electron-builder.mjs` (`--publish never`, токены очищаются)

**Не включайте** auto-publish electron-updater — F-020 использует **ручной manifest**, не electron-updater.

---

## 4. Как выпустить релиз (кратко)

Полный чеклист: [`RELEASE-PLAYBOOK.md`](RELEASE-PLAYBOOK.md).

```bash
# 1. Проверки
npm run release:preflight

# 2. CHANGELOG.md — секция [X.Y.Z], очистить [Unreleased]

# 3. Поднять version в package.json

# 4. Синхронизировать manifest
npm run release:sync-manifest

# 5. Коммит на main
git add package.json CHANGELOG.md docs/softphone/release/update-manifest.json docs/softphone/examples/update-manifest.json
git commit -m "chore(release): cut vX.Y.Z"

# 6. Тег и push (manifest в main ДО тега)
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

После push тега смотрите [Actions → Release](https://github.com/HailRase/softphone-electron/actions/workflows/release.yml).

### Проверка после релиза

1. GitHub Release `vX.Y.Z` — есть `.exe`, `.dmg`, `.AppImage` (и опционально `.deb`).
2. Прямые ссылки `releases/download/vX.Y.Z/...` открываются (не 404).
3. Raw manifest: URL из `.env.production` → `VITE_UPDATE_MANIFEST_URL` — `latestVersion` и `platforms` совпадают.
4. В приложении: **Настройки → О программе → Проверить обновления**.

---

## 5. Manifest и проверка обновлений (F-020)

| URL | Назначение |
| --- | --- |
| Raw JSON на `main` | Вшивается при production-сборке (`VITE_UPDATE_MANIFEST_URL`) |
| `platforms.linux` в manifest | Ссылка на **AppImage** (не `.deb`) |
| `downloadUrl` | Страница `/releases/latest` |

Клиент **не качает и не ставит** обновление сам — только показывает «есть новая версия» и открывает ссылку.

Обновить manifest без пересборки клиентов можно: достаточно push JSON в `main` (если URL manifest не менялся).

Скрипт `npm run release:sync-manifest` заполняет поля из `package.json` и шаблона URL GitHub Releases.

---

## 6. Локальная сборка установщиков

```bash
npm run build:win      # Windows → dist/win/*.exe
npm run build:mac      # только на macOS → dist/mac/*.dmg
npm run build:linux    # Linux → dist/linux/*.AppImage + *.deb
```

Перед сборкой: `npm run build:dist` (production, `VITE_ADAPTER_MODE=real` через mode production).

| Платформа | Где собирать |
| --- | --- |
| Windows `.exe` | Windows или CI `windows-latest` |
| macOS `.dmg` | macOS или CI `macos-latest` |
| Linux | CI `ubuntu-latest` предпочтительнее; на Windows `build:linux` может упасть на symlink (см. `scripts/build-linux.mjs`) |

### Имена Linux-артефактов

На CI (Ubuntu) arch часто **`x86_64`** / **`amd64`**:

- `Axatalk-0.0.1-linux-x86_64.AppImage`
- `Axatalk-0.0.1-linux-amd64.deb`

Локально на другой ОС суффикс может отличаться — всегда смотрите `dist/linux/` перед правкой manifest.

---

## 7. npm-скрипты для релиза

| Скрипт | Назначение |
| --- | --- |
| `npm run release:preflight` | test + lint + typecheck + registry:check |
| `npm run release:sync-manifest` | обновить оба manifest JSON |
| `npm run build:win\|mac\|linux` | локальный установщик |

---

## 8. Агенты Cursor и разделение ответственности

| Команда | Зона |
| --- | --- |
| `/ui`, `/logic`, `/adapter` | Фичи, код, Registry — **без** bump версии |
| `/preflight` | Проверки перед ревью WU |
| `/release` | CHANGELOG, SemVer, manifest, тег, верификация CI |
| `/review` | Gate work unit — **не** релиз |

Живой статус релизной линии: [`docs/softphone/STATUS.md`](../docs/softphone/STATUS.md) → **Release train**.

---

## 9. Частые проблемы CI/CD

| Симптом | Причина | Решение |
| --- | --- | --- |
| `GH_TOKEN is not set` после blockmap | implicit publish electron-builder | `run-electron-builder.mjs`, не re-run старого workflow |
| Re-run старого workflow | Берёт старый commit | **Run workflow** на актуальном `main` или новый тег |
| 404 на скачивание из приложения | Нет asset на Release или неверное имя в `platforms` | Сверить Release и manifest |
| «Проверка недоступна» в клиенте | Нет `VITE_UPDATE_MANIFEST_URL` при сборке | `.env.production`, пересобрать |
| CI падает на тестах | Регрессия в коде | `npm run release:preflight` локально |

---

## 10. Linux: `.deb`, AppImage и типичные жалобы

### Что рекомендуем пользователям

| Формат | Когда |
| --- | --- |
| **AppImage** | **Основной** способ на Linux: без `sudo`, в manifest F-020, не зависит от App Center |
| **`.deb`** | Только если IT требует deb; установка **через терминал или GDebi**, не через двойной клик |

### «Двойной клик по .deb — карточка пакета, через ~5 сек окно само закрывается»

Это **не баг Axatalk** и **не установка приложения**. Пользователь видит окно **Ubuntu App Center** (или GNOME Software): название, версия, описание, зависимости — и окно **само исчезает**, кнопку «Установить» нажать не успевают.

**Почему так бывает**

1. **App Center (snap-store) нестабилен с локальными `.deb`** — особенно Ubuntu 23.10–24.04 до свежих обновлений; у electron-пакетов это известная история (см. [electron-builder #497](https://github.com/electron-userland/electron-builder/issues/497), [SO 71013658](https://stackoverflow.com/questions/71013658/)).
2. **Двойной клик по файлу два раза подряд** — два запуска App Center; второй часто «убивает» первое окно (выглядит как закрытие через несколько секунд).
3. **Внутренняя ошибка App Center** после чтения метаданных пакета — окно падает без понятного сообщения (иногда в логе: *Failed to install file: not supported*).

**С нашей стороны `.deb` собран штатно (electron-builder)**; проблема в **GUI-установщике дистрибутива**, не в содержимом софтфона.

**Что сказать пользователю (рабочие варианты)**

**Вариант A — терминал (надёжнее всего):**

```bash
cd ~/Downloads   # папка, куда скачан файл
sudo apt install ./Axatalk-*-linux-amd64.deb
```

`./` обязателен: без него `apt` ищет пакет в репозиториях, а не локальный файл.

**Вариант B — GDebi:**

```bash
sudo apt install gdebi
gdebi ~/Downloads/Axatalk-*-linux-amd64.deb
```

Или: правый клик по `.deb` → «Открыть с помощью» → **GDebi Package Installer**.

**Вариант C — AppImage (рекомендуем):** скачать `*-linux-x86_64.AppImage` с того же Release — двойной клик после `chmod +x`, без App Center.

**Если настаивают на App Center:** один клик (не два), обновить snap-store:

```bash
sudo snap refresh snap-store
```

Если после обновления окно всё равно закрывается — App Center для этого `.deb` не подходит; варианты A/B/C.

### Если Axatalk уже установлен, но приложение закрывается через несколько секунд после запуска из меню

Тогда это уже **падение Electron-процесса**, чаще на Ubuntu 24.04+:

1. **AppArmor / sandbox Chromium** — профиль не подхватился при `dpkg -i` (в логе установки бывает: *Skipping the installation of the AppArmor profile…*).
2. **GPU / драйверы** — падение renderer после отрисовки UI.
3. Окно закрылось → срабатывает `window-all-closed` → процесс завершается (так устроен main на Linux).

**Диагностика** — запуск из терминала и просмотр ошибки:

```bash
/opt/Axatalk/axatalk
# или как в вашем .desktop Exec=
```

Типичные строки: `FATAL:sandbox`, `chrome-sandbox`, `apparmor`, `GPU process`.

**Обход для проверки** (не для production по умолчанию):

```bash
/opt/Axatalk/axatalk --no-sandbox
```

Если с флагом работает стабильно — проблема в sandbox/AppArmor; для релиза нужен корректный deb с AppArmor-профилем (electron-builder 26+) или документированный workaround.

**Альтернатива для пользователя:** AppImage из того же Release (рекомендуемый канал в manifest).

### Зависимости deb

electron-builder обычно тянет: `libgtk-3-0`, `libnss3`, `libxss1`, `libxtst6`, `xdg-utils`, …  
При ошибках: `sudo apt-get install -f`.

---

## 11. Карта файлов

| Путь | Роль |
| --- | --- |
| `package.json` | версия, скрипты сборки |
| `electron-builder.yml` | цели win/mac/linux, имена артефактов |
| `scripts/run-electron-builder.mjs` | безопасная сборка на CI |
| `scripts/sync-release-manifest.mjs` | manifest из версии |
| `.env.production` | `VITE_UPDATE_MANIFEST_URL` |
| `.github/workflows/ci.yml` | preflight на PR/push |
| `.github/workflows/release.yml` | сборка + publish на тег |
| `CHANGELOG.md` | заметки релиза |
| `scripts/distribution-config.mjs` | константы axatalk-releases |
| `distribution/README.md` | публикуется в корень axatalk-releases |
| `.github/workflows/migrate-distribution.yml` | миграция старых релизов |

---

## 12. Быстрые ссылки

- Исходники (private): https://github.com/HailRase/softphone-electron  
- **Пользовательские Releases:** https://github.com/HailRase/axatalk-releases/releases  
- Manifest (raw): https://raw.githubusercontent.com/HailRase/axatalk-releases/main/update-manifest.json  
- Actions CI: https://github.com/HailRase/softphone-electron/actions/workflows/ci.yml  
- Actions Release: https://github.com/HailRase/softphone-electron/actions/workflows/release.yml  
- Migrate workflow: https://github.com/HailRase/softphone-electron/actions/workflows/migrate-distribution.yml  
