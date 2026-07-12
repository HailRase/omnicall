# Guides — Axatalk / Enterprise Softphone

Единая папка **пользовательских и операционных руководств** (onboarding, установка, релизы, агенты Cursor).

Архитектура, Registry, handoffs и STATUS остаются в [`docs/softphone/`](../docs/softphone/).

## Каталог

| Аудитория | Файл | О чём |
| --- | --- | --- |
| Конечный пользователь | [`User-Guide-RU.md`](User-Guide-RU.md) | Скачивание, SIP, ежедневная работа |
| Пользователь / IT | [`install-instruction.md`](install-instruction.md) | Установка, первый звонок, сборка установщиков |
| Разработчик (Cursor) | [`Cursor-Agents-Guide.md`](Cursor-Agents-Guide.md) | Команды `/ui`, `/logic`, `/release`, циклы агентов |
| Разработчик (релиз) | [`Developer-Release-CI-Guide.md`](Developer-Release-CI-Guide.md) | Версии, CI/CD, Linux-установщики |
| Релиз / DevOps | [`RELEASE-PLAYBOOK.md`](RELEASE-PLAYBOOK.md) | Release cut, теги, manifest, проверки |
| Релиз / DevOps | [`GitHub-Releases-Update-Guide.md`](GitHub-Releases-Update-Guide.md) | GitHub Releases и in-app проверка обновлений |
| Релиз / DevOps | [`Distribution-Migration-Checklist.md`](Distribution-Migration-Checklist.md) | Private source → public axatalk-releases |
| Релиз / интеграция | [`Manual-Update-Manifest.md`](Manual-Update-Manifest.md) | Контракт JSON manifest (F-020) |
| UI-агент | [`Icon-Agent-Guide.md`](Icon-Agent-Guide.md) | Иконки Lucide, `AppIcon`, registry |
| UI / logic (гарнитура F-012) | [`../docs/softphone/HEADSET-AGENT-ONBOARDING.md`](../docs/softphone/HEADSET-AGENT-ONBOARDING.md) | Слои, потоки mute/connect, Jabra vs Poly |

## Точки входа

- Агенты Cursor: [`AGENTS.md`](../AGENTS.md)
- Карта всей документации: [`docs/softphone/README.md`](../docs/softphone/README.md)
- Живой статус проекта: [`docs/softphone/STATUS.md`](../docs/softphone/STATUS.md)
