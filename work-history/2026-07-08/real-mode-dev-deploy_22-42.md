# Real mode dev deploy

**Дата:** 2026-07-08 22:42
**Статус:** выполнено
**Коммит:** —

## Где
- `.env.local` (repo root, gitignored)
- `docs/softphone/real-integration/env.local.example`

## Что
- Создан `.env.local` с `VITE_ADAPTER_MODE=real` и dev SBC credentials из example.
- Остановлен предыдущий `npm run dev` (mock по умолчанию).
- Запущен новый `npm run dev` — Electron поднялся на `http://localhost:5173/`.

## Зачем
Проверить CSV import/export и остальной real-adapter smoke после фикса `contactCsvFileGateway` wiring.

## Результат
- Dev server: PASS (`platform_boot` / `app_ready` в логе main).
- Real mode активен через env (дополнительно можно `?adapters=real` в URL).
- Production installer: `npm run build:win` (уже с `VITE_ADAPTER_MODE=real` в `.env.production`).
