# План External Services

**Дата:** 2026-07-29 21:27
**Статус:** выполнено
**Коммит:** —

## Где
- `external-services-plan/`
- ветка `feature/external-services`

## Что
- Создан полный пакет из 16 плановых документов для F-031.
- Зафиксированы архитектура main-process HTTP, typed IPC и изоляция Call Engine.
- Описаны модель `UserSettings` v12, профильное хранение и расширение F-030.
- Составлены карты событий, переменных, focus gate, очереди и журнала.
- Разбита реализация на WU-00…WU-12 с HOW, границами и evidence.
- Добавлены acceptance, testing, security, risks и continuation протоколы.
- После discovery уточнены post-store event binding, точки Settings gating и UI Kit exports.

## Зачем
- Подготовить исполнимый logic-first план исходящих HTTP-автоматизаций без регрессий SIP, OCP и SDK.

## Результат
- План готов; WU-00 оставлен `pending`, production-код и канонические документы не изменялись.
- Проверка: 16 обязательных Markdown-файлов найдены; `git diff --check -- external-services-plan work-history/2026-07-29/external-services-plan_21-27.md` — PASS.
