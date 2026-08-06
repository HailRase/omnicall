# Уменьшение индикаторов вкл/выкл

**Дата:** 2026-08-03 11:37
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-services/ExternalServices.module.css`
- `src/renderer/components/settings/external-applications/ExternalApplications.module.css`
- `external-services-plan/05-UI-UX.md`

## Что
- Точки статуса enabled/disabled в сайдбарах F-031 и F-032: `0.5rem` → `0.3125rem` (~5px)
- Слегка подправлены `top`/`left` под меньший размер
- Заметка в `05-UI-UX.md`

## Зачем
- Компактнее индикаторы вкл/выкл в списках Внешних сервисов и Внешних приложений

## Результат
- Только CSS Modules + токены; поведение и a11y без изменений
