# Avatar recovery overlay (countdown + reload)

**Дата:** 2026-06-26 14:17
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/deriveConnectionRecoveryShell.ts`
- `src/renderer/components/header/AvatarRecoveryRing.tsx`
- `src/renderer/shells/SoftphoneShellHeader.tsx`
- `docs/softphone/Feature-Registry.md`

## Что
- Убран fullscreen overlay «Ошибка подключения» после исчерпания попыток SIP-перерегистрации (`manual_retry_available` + registration)
- Счётчик автоповтора перенесён поверх аватара с blur, без «Попытка N из M»
- Иконка reload на аватаре при отключённой автоперерегистрации и после исчерпания попыток
- Добавлен `avatarRecoveryOverlayMode`: countdown | reload | in_progress
- Обновлены тесты, Storybook, Feature Registry, UI catalog

## Зачем
Компактный UX восстановления SIP-регистрации на аватаре вместо блокирующего окна ошибки (LF-009, F-016).

## Результат
749 passed, 1 skipped; lint + typecheck + ui:catalog — OK.
