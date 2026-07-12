# Fix dialpad history Zustand snapshot loop

**Дата:** 2026-07-10 15:42
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useCallFeatureShell.ts`

## Что
- Убран inline `.map()` в Zustand selector (новый массив на каждый getSnapshot)
- `entries` из store + `useMemo` для `historyRemoteNumbers`

## Зачем
- Белый экран: `getSnapshot should be cached` → Maximum update depth exceeded

## Результат
- Селектор стабилен при неизменных entries; UI снова монтируется
