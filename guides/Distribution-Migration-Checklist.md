# Distribution migration checklist

Перенос дистрибуции с `HailRase/softphone-electron` на публичный [`HailRase/axatalk-releases`](https://github.com/HailRase/axatalk-releases).

**Цель:** код приватно; пользователи видят только установщики + `update-manifest.json` + README.

---

## Текущее состояние → целевое

| # | Было | Стало | Статус |
| --- | --- | --- | --- |
| 1 | Релизы на `softphone-electron` | Релизы только на `axatalk-releases` | ☐ CI обновлён — проверить после merge |
| 2 | Manifest raw URL → `softphone-electron/.../update-manifest.json` | → `axatalk-releases/main/update-manifest.json` | ☐ `.env.production` обновлён |
| 3 | `axatalk-releases` пустой | README + manifest + Releases `v0.0.1`, `v0.0.2` | ☐ миграция |
| 4 | `softphone-electron` публичный | **Private** (после миграции) | ☐ вручную в GitHub Settings |
| 5 | Клиенты 0.0.1/0.0.2 смотрят старый manifest URL | Нужен **release cut 0.0.3** с новым URL | ☐ после миграции |

---

## Шаг 1. Смержить изменения в `softphone-electron`

В private repo появляются:

- `scripts/distribution-config.mjs`
- `scripts/sync-release-manifest.mjs` (URL → `axatalk-releases`)
- `scripts/push-distribution-repo.mjs`
- `scripts/migrate-distribution-releases.mjs`
- `distribution/README.md`, `distribution/update-manifest.json`
- `.github/workflows/release.yml` (publish → `axatalk-releases`)
- `.github/workflows/migrate-distribution.yml`

```bash
npm run release:preflight
```

---

## Шаг 2. Создать PAT для CI

1. GitHub → **Settings** → **Developer settings** → **Fine-grained tokens** → **Generate**.
2. Repository access: **Only** `HailRase/axatalk-releases`.
3. Permissions: **Contents** → Read and write.
4. Если `softphone-electron` уже **private** — добавьте второй PAT с **Read** на `softphone-electron` для миграции, либо используйте classic token с `repo` на оба.

В **`softphone-electron`** → Settings → Secrets → Actions:

| Secret | Значение |
| --- | --- |
| `AXATALK_RELEASES_TOKEN` | PAT с **write** только на `axatalk-releases` |

**Важно:** для миграции CI **не** подставляет этот токен в скачивание из `softphone-electron`.  
Скачивание идёт через `github.token` (тот же репозиторий). Запись — через `AXATALK_RELEASES_TOKEN`.

Локально (если source уже private):

```bash
set SOURCE_GITHUB_TOKEN=ghp_...read_softphone...
set DISTRIBUTION_GITHUB_TOKEN=ghp_...write_axatalk_releases...
node scripts/migrate-distribution-releases.mjs v0.0.1 v0.0.2
```

---

## Шаг 3. Миграция существующих релизов (v0.0.1, v0.0.2)

### Вариант A — GitHub Actions (рекомендуется)

1. Actions → **Migrate distribution releases** → **Run workflow**.
2. Tags: `v0.0.1,v0.0.2` (через запятую).
3. Дождаться зелёного статуса.

### Вариант B — локально (нужен `gh` CLI)

```bash
# PAT с read softphone-electron + write axatalk-releases (или два токена — см. выше)
set SOURCE_GITHUB_TOKEN=ghp_...
set DISTRIBUTION_GITHUB_TOKEN=ghp_...
npm run release:sync-manifest
node scripts/migrate-distribution-releases.mjs v0.0.1 v0.0.2
```

### Проверка

- [ ] https://github.com/HailRase/axatalk-releases/releases — теги `v0.0.1`, `v0.0.2`
- [ ] В каждом релизе только `.exe`, `.dmg`, `.AppImage` (и опц. `.deb`) — **без** `.blockmap`, `latest.yml`
- [ ] https://github.com/HailRase/axatalk-releases/blob/main/README.md
- [ ] https://raw.githubusercontent.com/HailRase/axatalk-releases/main/update-manifest.json → `latestVersion: "0.0.2"`
- [ ] Прямые ссылки из manifest открываются (не 404)

---

## Шаг 4. Сделать `softphone-electron` приватным

**Только после** успешной миграции на `axatalk-releases`.

1. `softphone-electron` → Settings → Danger Zone → **Change visibility** → Private.
2. Collaborators: команда + боты CI.
3. Cursor: доступ через ваш GitHub аккаунт с collaborator.

Проверка в инкогнито:

- [ ] `softphone-electron` — 404 / Private
- [ ] `axatalk-releases` — Releases скачиваются без логина

---

## Шаг 5. Release cut 0.0.3 (новые клиенты с правильным manifest URL)

Старые установщики 0.0.1/0.0.2 вшили старый `VITE_UPDATE_MANIFEST_URL`. Нужна пересборка:

```bash
npm run release:preflight
# CHANGELOG [0.0.3]
# package.json → 0.0.3
npm run release:sync-manifest
git commit -m "chore(release): cut v0.0.3"
git push origin main
git tag v0.0.3
git push origin v0.0.3
```

CI опубликует на `axatalk-releases` автоматически.

---

## Шаг 6. Ежедневный release cut (после настройки)

1. `npm run release:preflight`
2. CHANGELOG + bump `package.json`
3. `npm run release:sync-manifest`
4. Commit → push `main`
5. `git tag vX.Y.Z` → `git push origin vX.Y.Z`
6. CI: build в private → publish в **axatalk-releases**
7. Проверить manifest raw URL и Releases

**Теги** остаются на **обоих** репозиториях (private — триггер CI; public — дистрибуция).

---

## Шаг 7. Что отдать пользователям

Только публичные ссылки:

- Скачать: https://github.com/HailRase/axatalk-releases/releases/latest
- Инструкция: README в том же репозитории

**Не** давать ссылку на `softphone-electron`.

---

## Troubleshooting

| Симптом | Решение |
| --- | --- |
| Publish job failed: secret | Добавить `AXATALK_RELEASES_TOKEN` |
| 404 на manifest | `push-distribution-repo` / migrate workflow |
| 404 на installer | Имена в manifest vs файлы в Release |
| Migrate 401 Bad credentials | `AXATALK_RELEASES_TOKEN` использовался для **скачивания** source | Обновить workflow: `SOURCE_GITHUB_TOKEN=github.token`, перезапустить |
| Старые клиенты не видят обновления | Release cut 0.0.3+ с новым `.env.production` |
