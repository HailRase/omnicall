# OCP socket → Notification Center only

**Дата:** 2026-08-02 20:41
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/integration/ocp/createOcpToastNotificationPresenter.ts`
- `src/renderer/integration/ocp/createOcpToastNotificationPresenter.test.ts`
- `notification-center/00-PRODUCT-SPEC.md`, `03-POLICY-AND-CHANNELS.md`, `07-SECURITY-ISOLATION.md`, `11-ACCEPTANCE.md`
- `docs/softphone/adr/ADR-0025-*.md`, `ADR-0026-*.md`
- `docs/softphone/Feature-Registry.md` (F-034)

## Что
- Mapper презентует только `body` + `type` (`success`/`error`; остальное → `info`)
- Убраны suppress по `deleted`/`blocked` и override `sticky` → `durationMs: 0`
- Пустой `body` (trim) → null; пустой `id` → без id (генерация в `notify`)
- Теги `module: ocp`, `functionId: ocp.notification`, `interruptClass: remote` сохранены
- Синхронизированы политика Notification Center, ADR-0025/0026 и evidence F-034

## Зачем
- Remote OCP notifications идут только через Softphone Notification Center prefs, без OCP wire lifecycle.

## Результат
- `vitest` mapper + OcpNotificationService: PASS
- Фильтр OCP/producer tagging (28 tests): PASS
- `tsc -p tsconfig.web.json`: PASS
- SoftphoneReadyShell wiring без изменений (`map` → `notify`)
