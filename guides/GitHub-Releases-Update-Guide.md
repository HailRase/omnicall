# GitHub Releases и проверка обновлений (Axatalk)

Пошаговая инструкция для ручной публикации релизов и in-app проверки обновлений (F-020). Установка остаётся ручной: приложение только проверяет manifest и открывает страницу загрузки.

## Два разных URL

| Назначение | Где задаётся | Пример |
| --- | --- | --- |
| **Manifest** (JSON с версией) | `.env.production` → `VITE_UPDATE_MANIFEST_URL` | `https://raw.githubusercontent.com/HailRase/axatalk-releases/main/update-manifest.json` |
| **Установщики** | Внутри manifest: `downloadUrl`, `platforms` | `https://github.com/HailRase/axatalk-releases/releases/latest` |

Manifest лежит в репозитории по фиксированному пути. После merge в `main` его можно обновлять без пересборки уже установленных клиентов.

## Имена файлов (electron-builder)

Шаблон: `Axatalk-${version}-${platform}-${arch}.${ext}` (`productName: Axatalk` в `electron-builder.yml`).

| Платформа | Пример для `0.0.1` |
| --- | --- |
| Windows NSIS | `Axatalk-0.0.1-win-x64.exe` |
| macOS DMG (arm64) | `Axatalk-0.0.1-mac-arm64.dmg` |
| macOS DMG (x64) | `Axatalk-0.0.1-mac-x64.dmg` |
| Linux AppImage | `Axatalk-0.0.1-linux-x86_64.AppImage` (CI) или `…-linux-x64…` локально — сверьте `dist/linux/` |
| Linux deb | `Axatalk-0.0.1-linux-amd64.deb` |

Перед публикацией сверьте имена в `dist/win`, `dist/mac`, `dist/linux` — они должны совпадать с полями `platforms` в manifest.

**Важно:** добавляйте в `platforms` только те ОС, для которых файл **уже загружен** в GitHub Release. Иначе in-app «Скачать» откроет 404. Для отсутствующих платформ клиент использует общий `downloadUrl` (`/releases/latest`).

## Первичная настройка (один раз)

1. Убедитесь, что `update-manifest.json` есть в **`main`** репозитория [`axatalk-releases`](https://github.com/HailRase/axatalk-releases).
2. В `.env.production` задан `VITE_UPDATE_MANIFEST_URL` (raw URL `axatalk-releases`).
3. Соберите установщик: `npm run build:win` (или mac/linux).
4. Создайте GitHub Release (см. ниже) и загрузите артефакты.
5. Проверьте в приложении:
   - при запуске — баннер «Доступно обновление», если `latestVersion` новее установленной;
   - **Настройки → Общее → О программе → Проверить обновления** — ручная проверка по-прежнему доступна.

## Создание GitHub Release

### Автоматически (рекомендуется)

После **release cut** по `RELEASE-PLAYBOOK.md`:

1. Manifest и `package.json` уже в `main`
2. `git tag vX.Y.Z` + `git push origin vX.Y.Z`
3. Workflow **Release** в `softphone-electron` собирает win/mac/linux и публикует assets в [`axatalk-releases`](https://github.com/HailRase/axatalk-releases) (`softprops/action-gh-release`)

Ручная загрузка бинарников **не нужна**, если CI зелёный.

### Вручную (legacy / hotfix)

1. Откройте https://github.com/HailRase/axatalk-releases/releases
2. **Draft a new release**
3. **Tag:** `v0.0.1` (префикс `v` + semver из `package.json`)
4. **Title:** `Axatalk 0.0.1`
5. Описание — из `CHANGELOG.md`
6. **Attach binaries** из `dist/win`, `dist/mac`, `dist/linux` или артефактов CI
7. **Publish release**

### Ссылки для manifest

- Страница последнего релиза (`downloadUrl`):
  `https://github.com/HailRase/axatalk-releases/releases/latest`
- Прямая ссылка на файл (`platforms.*`):
  `https://github.com/HailRase/axatalk-releases/releases/download/v0.0.2/Axatalk-0.0.2-win-x64.exe`

Точную ссылку удобно копировать: страница release → правый клик по файлу → «Копировать адрес ссылки».

## Каждый следующий релиз

См. **`RELEASE-PLAYBOOK.md`** и команда `/release`. Кратко:

1. `npm run release:preflight`
2. `CHANGELOG.md` + bump `version` в `package.json`
3. `npm run release:sync-manifest` (оба JSON manifest)
4. Commit `chore(release): cut vX.Y.Z` → push `main`
5. `git tag vX.Y.Z` → `git push origin vX.Y.Z` → CI публикует Release assets в **axatalk-releases**
6. Пересборка клиента **не нужна**, если `VITE_UPDATE_MANIFEST_URL` не менялся

## Сборка через GitHub Actions

| Workflow | Файл | Триггер | Результат |
| --- | --- | --- | --- |
| **CI** | `ci.yml` | push/PR `main` | test, lint, typecheck, registry |
| **Release** | `release.yml` | push тега `v*.*.*` | build matrix + **GitHub Release assets** |
| **Release** | `release.yml` | `workflow_dispatch` | build only → **Artifacts** (без Release) |

### Tag push (релиз)

Push тега `vX.Y.Z` после manifest в `main` → сборка в **softphone-electron** → publish в **axatalk-releases**.

### Ручной прогон без релиза

1. [Actions → Release](https://github.com/HailRase/softphone-electron/actions/workflows/release.yml)
2. **Run workflow** → ветка `main` → **Run workflow**
3. Скачать **Artifacts** (`installer-*`)

Для дополнения уже существующего Release без нового тега: скачать артефакты и **Edit release → Attach binaries** (см. `platforms` в manifest).

### Mac / Linux без локальной сборки

Используйте **Run workflow** или push тега. Локально: `build:mac` только на macOS; `build:linux` на Windows — через CI.

## Проверка manifest

```bash
curl -s "https://raw.githubusercontent.com/HailRase/axatalk-releases/main/update-manifest.json"
```

Должен вернуться JSON с `latestVersion` и HTTPS `downloadUrl`.

## Частые проблемы

| Симптом | Причина | Решение |
| --- | --- | --- |
| «Проверка недоступна» | URL не зашит при сборке | Проверить `.env.production`, пересобрать |
| 404 на raw URL | Файла нет в `main` | Merge и push manifest |
| Обновление не видно | `latestVersion` ≤ установленной | Поднять версию в manifest |
| 404 на скачивание | Неверный тег, имя файла или `platforms` без asset | Сверить Release; убрать лишние ключи из `platforms` |
| CI Build installers failed | Падают тесты в workflow | `npm run release:preflight` локально; исправить; новый Run workflow |
| `GH_TOKEN is not set` на CI | `GITHUB_TOKEN` в Actions включает implicit publish | `scripts/run-electron-builder.mjs` + пустые токены на шаге Build; **новый** Run workflow |

## Приватный репозиторий (softphone-electron)

Исходный код — **private** `HailRase/softphone-electron`. Публичная дистрибуция — **`HailRase/axatalk-releases`** (только README, manifest, Releases).

Чеклист переноса: `guides/Distribution-Migration-Checklist.md`.  
Секрет CI: `AXATALK_RELEASES_TOKEN` (write на `axatalk-releases`).

См. также: `RELEASE-PLAYBOOK.md`, `Manual-Update-Manifest.md`, контракт полей JSON.
