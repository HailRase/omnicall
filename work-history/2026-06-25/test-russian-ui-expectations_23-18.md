# Обновление тестов под русскую локализацию UI

**Дата:** 2026-06-25 23:18
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/*.test.ts` (7 файлов)
- `src/renderer/helpers/*.test.ts` (3 файла)
- `src/renderer/shells/SoftphoneShellHeader.test.tsx`
- `src/renderer/components/**/*.test.{ts,tsx}` (11 файлов)

## Что
- Заменены английские ожидания user-visible строк на русские в 21 тестовом файле
- Обновлены projection-тесты: статусы линий, header chrome, recovery, logout, multi-call, transfer
- Обновлены helper-тесты: active call controls, operator status, transfer disabled reasons
- Обновлены component-тесты: модалки, overlay, status selector, queue label, OCP toast

## Зачем
Привести тесты в соответствие с русской локализацией UI после localization pass.

## Результат
- `npm test`: 704 passed, 1 skipped
- Production-код не изменялся
