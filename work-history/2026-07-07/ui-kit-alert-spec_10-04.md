# UI Kit Alert spec

**Дата:** 2026-07-07 10:04
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/ui-kit/UI-KIT.md`

## Что
- Проверено: отдельного компонента `Alert` (не `AlertDialog`) в UI-KIT не было
- Добавлена секция `### Alert` в Phase 4: Feedback
- Описан shadcn-like composable API: `Alert`, `AlertTitle`, `AlertDescription`, `AlertAction`
- Зафиксированы variants `default | destructive`, визуал и поведение inline callout
- Указано `Radix: no` (у shadcn Alert нет Radix-примитива; отличие от `AlertDialog`)
- Добавлены stories, tests, checklist по шаблону остальных компонентов
- Обновлены Target Location и Storybook title convention

## Зачем
Зафиксировать требования к inline Alert callout в UI Kit до реализации через `/ui-kit`.

## Результат
Секция `Alert` добавлена со статусом `planned`; реализация в `src/renderer/components/ui/alert/` ещё не начата.
