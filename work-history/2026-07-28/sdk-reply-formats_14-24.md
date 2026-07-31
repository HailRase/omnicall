# Форматы ответов SDK и публикация

**Дата:** 2026-07-28 14:27
**Статус:** выполнено
**Коммит:** —

## Где
- `omnicall-kit/README.md`
- `omnicall-kit/packages/sdk/README.md`
- `omnicall-kit/docs/guide/README.md`
- `omnicall-kit/docs/guide/operator-status-reservation.md`
- `omnicall-kit/packages/sdk/package.json`

## Что
- Описаны форматы успешных ответов всех публичных команд SDK и правила работы с `revision`.
- Добавлен полный контракт `changeStatus`/`finishAppeal`: `applied`, `reserved`, бронь и восстановление после reconnect.
- Дополнены API reference и индекс developer guide.
- Исправлена проверка зависимости SDK на опубликованный protocol `0.1.0`.
- Уточнено, что успешная мутация не обновляет snapshot-кэш `getRevision()`.
- Выпущен `@softomnitel/omnicall-kit@0.1.4` с тегом npm `latest`.

## Зачем
- Интеграторам CRM нужны однозначные результаты команд и корректная обработка отложенной смены статуса без обращения к внутренним OCP-состояниям.

## Результат
- `npx -y -p npm@10 npm run release:preflight` — PASS.
- `npx -y -p npm@10 npm run release:check` — PASS.
- `npx -y -p npm@10 npm run docs:check` — PASS.
- npm `latest` подтверждён как `0.1.4`.
