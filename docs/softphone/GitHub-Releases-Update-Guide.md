# GitHub Releases и проверка обновлений (Axatalk)

Пошаговая инструкция для ручной публикации релизов и in-app проверки обновлений (F-020).

## Два разных URL

| Назначение | Где задаётся | Пример |
| --- | --- | --- |
| **Manifest** (JSON с версией) | `.env.production` → `VITE_UPDATE_MANIFEST_URL` | `https://raw.githubusercontent.com/HailRase/softphone-electron/main/docs/softphone/release/update-manifest.json` |
| **Установщики** | Внутри manifest: `downloadUrl`, `platforms` | `https://github.com/HailRase/softphone-electron/releases/latest` |

Manifest лежит в репозитории по фиксированному пути. После merge в `main` его можно обновлять без пересборки уже установленных клиентов.

## Имена файлов (electron-builder)

Шаблон: `Axatalk-${version}-${platform}-${arch}.${ext}` (`productName: Axatalk` в `electron-builder.yml`).

| Платформа | Пример для `0.0.1` |
| --- | --- |
| Windows NSIS | `Axatalk-0.0.1-win-x64.exe` |
| macOS DMG (arm64) | `Axatalk-0.0.1-mac-arm64.dmg` |
| macOS DMG (x64) | `Axatalk-0.0.1-mac-x64.dmg` |
| Linux AppImage | `Axatalk-0.0.1-linux-x64.AppImage` |
| Linux deb | `Axatalk-0.0.1-linux-x64.deb` |

Перед публикацией сверьте имена в `dist/win`, `dist/mac`, `dist/linux` — они должны совпадать с полями `platforms` в manifest.

## Первичная настройка (один раз)

1. Убедитесь, что `docs/softphone/release/update-manifest.json` есть в ветке **`main`** на GitHub.
2. В `.env.production` задан `VITE_UPDATE_MANIFEST_URL` (уже прописан для `HailRase/softphone-electron`).
3. Соберите установщик: `npm run build:win` (или mac/linux).
4. Создайте GitHub Release (см. ниже) и загрузите артефакты.
5. Проверьте в приложении: **Настройки → Общее → О программе → Проверить обновления**.

## Создание GitHub Release

1. Откройте https://github.com/HailRase/softphone-electron/releases
2. **Draft a new release**
3. **Tag:** `v0.0.1` (должен совпадать с `package.json` version, с префиксом `v`)
4. **Title:** `0.0.1` или `Axatalk 0.0.1`
5. Описание — changelog
6. **Attach binaries** из `dist/win`, `dist/mac`, `dist/linux`
7. **Publish release**

### Ссылки для manifest

- Страница последнего релиза (`downloadUrl`):
  `https://github.com/HailRase/softphone-electron/releases/latest`
- Прямая ссылка на файл (`platforms.*`):
  `https://github.com/HailRase/softphone-electron/releases/download/v0.0.1/Axatalk-0.0.1-win-x64.exe`

Точную ссылку удобно копировать: страница release → правый клик по файлу → «Копировать адрес ссылки».

## Каждый следующий релиз

1. Поднять `version` в `package.json`
2. `npm run build:win|mac|linux`
3. Создать release с тегом `v<version>`, загрузить новые файлы
4. Обновить `docs/softphone/release/update-manifest.json`:
   - `latestVersion`
   - `releaseDate`, `releaseNotesUrl`
   - URL в `platforms` (имена файлов содержат новую версию)
5. Commit + push в **`main`**
6. Пересборка клиента **не нужна**, если `VITE_UPDATE_MANIFEST_URL` не менялся

## Проверка manifest

```bash
curl -s "https://raw.githubusercontent.com/HailRase/softphone-electron/main/docs/softphone/release/update-manifest.json"
```

Должен вернуться JSON с `latestVersion` и HTTPS `downloadUrl`.

## Частые проблемы

| Симптом | Причина | Решение |
| --- | --- | --- |
| «Проверка недоступна» | URL не зашит при сборке | Проверить `.env.production`, пересобрать |
| 404 на raw URL | Файла нет в `main` | Merge и push manifest |
| Обновление не видно | `latestVersion` ≤ установленной | Поднять версию в manifest |
| 404 на скачивание | Неверный тег или имя файла | Сверить с GitHub Release |

## Приватный репозиторий

`raw.githubusercontent.com` и `releases/download` для private repo требуют авторизацию. Для production лучше публичный repo для manifest или отдельный HTTPS/CDN.

См. также: `Manual-Update-Manifest.md`, контракт полей JSON.
