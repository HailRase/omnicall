# Axatalk — дистрибуция

Публичный репозиторий **только для установки** десктопного софтфона [Axatalk](https://github.com/HailRase/axatalk-releases/releases/latest).

Здесь **нет исходного кода** приложения. Разработка ведётся в приватном репозитории `HailRase/softphone-electron` (доступ только у команды и CI).

---

## Для пользователей и IT

### Что это

**Axatalk** — десктопный SIP-софтфон (Windows, macOS, Linux): регистрация на PBX, исходящие и входящие звонки, настройки аккаунта.

### Скачать

**Последний релиз:** https://github.com/HailRase/axatalk-releases/releases/latest

| ОС | Файл | Рекомендация |
| --- | --- | --- |
| Windows | `Axatalk-<версия>-win-x64.exe` или `-win-x64.msi` | `.exe` — мастер; `.msi` — IT/GPO |
| macOS (Apple Silicon) | `Axatalk-<версия>-mac-arm64.dmg` | Перетащить в «Программы» |
| Linux | `Axatalk-<версия>-linux-x86_64.AppImage` | **Предпочтительно** |
| Linux (Debian/Ubuntu) | `Axatalk-<версия>-linux-amd64.deb` | Только через терминал (см. ниже) |

### Установка Linux — важно

**Не полагайтесь на двойной клик по `.deb`.** Ubuntu App Center часто показывает карточку пакета и закрывается — это сбой GUI ОС, не Axatalk.

```bash
cd ~/Downloads
sudo apt install ./Axatalk-*-linux-amd64.deb
```

**AppImage:**

```bash
chmod +x Axatalk-*-linux-x86_64.AppImage
./Axatalk-*-linux-x86_64.AppImage
```

### Первый запуск

1. Запустите **Axatalk**.
2. Дождитесь загрузки (исчезнет «Booting application…»).
3. **Аватар** → **Настройки** → **Аккаунт**.
4. Введите SIP-логин, пароль, домен и WebSocket-сервер (`wss://…`).
5. **Авторизоваться**.

### Проверка обновлений

В приложении: **Настройки → Общее → О программе → Проверить обновления**.

Клиент читает файл [`update-manifest.json`](update-manifest.json) из этого репозитория и открывает страницу скачивания при наличии новой версии. Автоустановка **не выполняется**.

### Содержимое репозитория

| Файл | Назначение |
| --- | --- |
| `README.md` | Эта инструкция |
| `update-manifest.json` | Версия и ссылки для in-app проверки обновлений (F-020) |
| **Releases** | Установщики по тегам `v0.0.1`, `v0.0.2`, … |

Других файлов проекта здесь быть не должно.

---

## Для агентов Cursor и разработчиков

### Роль репозитория

| Репозиторий | Видимость | Содержимое |
| --- | --- | --- |
| `HailRase/softphone-electron` | **Private** (целевое состояние) | Код, тесты, CI, документация, агенты |
| `HailRase/axatalk-releases` | **Public** | README, `update-manifest.json`, GitHub Releases (бинарники) |

**Не клонируйте этот репозиторий для разработки.** Рабочая копия — `softphone-electron`.

### Как попадают файлы сюда

1. В `softphone-electron`: release cut → тег `vX.Y.Z` на **private** repo.
2. CI workflow **Release** собирает win/mac/linux.
3. Job **publish**:
   - создаёт Release в `axatalk-releases` с тегом `vX.Y.Z` (только `.exe`, `.msi`, `.dmg`, `.AppImage`, `.deb`);
   - пушит `update-manifest.json` и `README.md` в ветку `main`.

Исходники в `distribution/` в private repo — шаблон для пуша сюда.

### Секреты CI (private repo)

| Secret | Назначение |
| --- | --- |
| `AXATALK_RELEASES_TOKEN` | Fine-grained PAT: **Contents read/write** на `axatalk-releases` |

### Команды (в `softphone-electron`)

```bash
npm run release:sync-manifest      # обновить manifest (URL → axatalk-releases)
node scripts/push-distribution-repo.mjs   # ручной пуш README + manifest (нужен GITHUB_TOKEN)
node scripts/migrate-distribution-releases.mjs v0.0.1 v0.0.2   # миграция старых релизов
```

### Документация (private repo)

- `guides/Distribution-Migration-Checklist.md` — чеклист переноса
- `guides/RELEASE-PLAYBOOK.md` — release cut
- `guides/Developer-Release-CI-Guide.md` — CI/CD

### Правила агентов

- `/ui`, `/logic` — **не** пушат в `axatalk-releases`.
- `/release` — после тега проверяет Release и raw manifest на **этом** репозитории.
- Не добавлять в `axatalk-releases` исходники, `.env`, ключи, `node_modules`.

---

## Поддержка

- Настройка PBX — администратор телефонии.
- Установка клиента — IT по этой странице и [Releases](https://github.com/HailRase/axatalk-releases/releases).
