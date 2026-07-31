# Min dwell bootstrap splash

**Дата:** 2026-07-29 11:01
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useBootstrapSplashProgress.ts` (+ test)
- `src/renderer/hooks/useBootSplashController.test.ts`
- `src/shared/platform/startupSplashColors.ts` (+ test)
- `docs/softphone/Bootstrap-Splash-Contract.md`, `UI-Architecture.md`, `UX-UI-Design-Blueprint.md`, `Feature-Registry.md`, `Legacy-Feature-Coverage.md`, `STATUS.md`, `I18N-Coverage.md`

## Что
- Добавлен UI-only min visible dwell `BOOTSTRAP_SPLASH_MIN_VISIBLE_MS` = 4000
- После `ready` splash держит bounce/прогресс ≤88 до истечения dwell, затем 100% → settle → exit
- `prefers-reduced-motion` пропускает min dwell; error path без задержки
- `initialize` / bootstrap gate не замедляются
- Обновлены тесты и контрактная документация (F-016 / LF-002)

## Зачем
- На быстром старте анимация загрузки исчезала до того, как её успевали увидеть

## Результат
- `vitest` splash suite PASS (16): progress, controller, colors, bootSplashDom
- Downgrade bootstrap/SIP/error path не вносился
