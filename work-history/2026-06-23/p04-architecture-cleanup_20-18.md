# P04 architecture cleanup

**Дата:** 2026-06-23 20:18
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/CallEngine.ts`
- `src/application/services/ActiveCallControlService.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/App.tsx`
- `src/renderer/bootstrap/readBootstrapConfig.ts`
- `src/application/helpers/dialpadValidation.ts`

## Что
- Вынес P04 orchestration (`hangup/hold/resume/mute/unmute`) из `CallEngine` в отдельный application service `ActiveCallControlService` без изменения публичного входа через Use Cases.
- Сохранил observability для P04: structured logs с `operation`, `correlationId`, `featureId`, `boundedContext`, `previousState`, `nextState`, `result`, `normalizedError`.
- Оставил `CallEngine` orchestration entry point: методы P04 делегируют в новый сервис, состояние и трекинг вызовов не перенесены в UI/store/adapters.
- Убрал прямые импорты `@domain/*` из `src/renderer/**`; добавил application-level helper `isDialpadNumberValid` и facade wrappers `*ById`/`*ByCallId`.
- Обновил renderer-компоненты и bootstrap на application-level типы/операции, сохранив presentational роль UI.
- Проверил ограничения: нет `any`, `@ts-ignore`, `as unknown as`, нет direct SIP/Electron/adapters imports в renderer.

## Зачем
- Уменьшить монолитность application service и восстановить архитектурные границы между Renderer и Domain.
- Сохранить поведение P04 без функциональных изменений перед переходом к P05.

## Результат
- `npm run test` — успешно.
- `npm run lint` — успешно.
- `npm run typecheck` — успешно.
- P04 поведение, disabled reasons projection и вход через Use Cases сохранены.
