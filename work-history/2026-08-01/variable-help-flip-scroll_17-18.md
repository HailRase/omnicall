# Variable help: flip inside scroll container

**Дата:** 2026-08-01 17:18
**Статус:** выполнено
**Коммит:** —

## Где
- `findNearestScrollContainer.ts` (+ tests)
- `ExternalServicesVariableHelpButton.tsx` (+ flip test)
- `ExternalServices.module.css` / `ExternalApplications.module.css` (`position: relative` on scroll panes)
- `external-services-plan/05-UI-UX.md`

## Что
- Popup монтируется в ближайший `overflow: auto|scroll` (не `hidden`, не `body`)
- Floating UI `flip`/`shift` с `boundary = scroll pane`
- Локальный z-index; при нехватке места снизу открывается сверху

## Зачем
- Нормальная автоориентация в scroll-контейнере без обрезания и без наезда на соседние панели

## Результат
- vitest: findNearestScrollContainer + help button (вкл. flip) — OK
