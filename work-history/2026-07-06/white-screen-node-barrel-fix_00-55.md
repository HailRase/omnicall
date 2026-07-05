# White screen — Node adapters в renderer bundle

**Дата:** 2026-07-06 00:55
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/index.ts`
- `src/infrastructure/index.ts`

## Что
- Убран re-export `FileSettingsRepository` из `@adapters/index` (тянул `node:path` в renderer)
- Убран re-export `NodeFileSystemAdapter` из `@infrastructure/index`
- Node-only адаптеры импортируются напрямую в тестах / main (Step 7)

## Зачем
Белый экран в dev: Vite не мог загрузить renderer из-за `profileStoragePaths.ts` → `node:path` в browser bundle.

## Результат
- `npm run build` — ok
- `FileSettingsRepository.test.ts` — ok (direct imports)
