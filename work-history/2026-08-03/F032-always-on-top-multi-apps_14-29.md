# F-032 always-on-top multi-app preview

**Дата:** 2026-08-03 14:29
**Статус:** выполнено
**Коммит:** `02debeb`

## Где
- `WindowBehaviorSwitchSchematicParts.tsx`
- `WindowBehaviorSwitchSchematics.tsx`
- `WindowBehaviorSwitchSchematics.module.css`

## Что
- Always-on-top ON: 4 мелких чужих окна на фоне, карточка OmniCall плавает поверх
- OFF: кластер перекрывает карточку
- Убрана сцена «одно окно двигается и становится прозрачнее»

## Зачем
- Preview должен показывать «моя карточка поверх нескольких приложений»

## Результат
- `ExternalApplicationsPanel.test.tsx` — 9 passed
