# P11 WU5 — CSS Modules And Design Tokens Migration

> **Миссия:** продолжить UI-4 — перевести затронутые renderer-компоненты на **CSS Modules + semantic tokens**; уменьшить `styles.css`; без визуального редизайна.
> **Baseline:** WU4 closed (694 tests). Foundation: `tokens.css`, `globals.css`, pilot `UserAvatar` / `RegistrationStatusDot`.

---

## ОБЯЗАТЕЛЬНО прочитать

1. `docs/softphone/P11-CSS-Modules-Tokens-Migration.md` — правила агента
2. `docs/softphone/UI-Design-System.md` — tokens + UI-4
3. `docs/softphone/UI-Architecture.md` — `styles/` layout
4. `src/renderer/styles/tokens.css` — единственный источник цветов/spacing
5. `src/renderer/styles/README.md`

---

## Контекст

| Item | Value |
| --- | --- |
| Phase | **P11 WU5** (UI-4 incremental) |
| Feature | **F-016** |
| Pilot done | `UserAvatar.module.css`, `RegistrationStatusDot.module.css` |
| Legacy | `src/renderer/styles.css` (tokens via `var()`, globals removed) |

---

## Правила (обязательны)

- Новый или изменённый компонент → **только** `*.module.css` + `var(--*)`
- **Запрещено:** новые классы в `styles.css`, raw hex в модулях
- При миграции компонента — **удалить** его блок из `styles.css` в том же PR/WU
- `clsx` для вариантов; `data-testid` сохранять
- Shells (`shells/`, `widgets/`) — те же правила при касании стилей

---

## Рекомендуемый scope одного WU5-среза

Выбери **одну** зону (не всё сразу):

| Slice | Files | `styles.css` blocks |
| --- | --- | --- |
| A | `SoftphoneShellHeader.tsx`, header shell classes | `.shell__header*`, `.shell__header-action` |
| B | `SettingsOverlay.tsx`, `ShellOverlaySheet.tsx` | `.settings-overlay*`, `.shell-overlay-sheet*` |
| C | `CallLineRow.tsx`, call line | `.call-line-row*` |
| D | `Dialpad.tsx`, controls | `.dialpad*` |

Один срез = один gate. Следующий WU5 prompt — следующий slice.

---

## Deliverables (на срез)

| # | Item |
| --- | --- |
| 1 | `*.module.css` для всех затронутых TSX |
| 2 | Удаление соответствующих global rules из `styles.css` |
| 3 | Только token vars в новых CSS |
| 4 | Tests + Storybook (если есть story) green |
| 5 | `npm run ui:catalog` при изменении components |
| 6 | Handoff + work-history |

---

## Anti-patterns

- Tailwind без ADR
- Inline `style={{ color: ... }}`
- Дублирование token values в модулях
- Пропуск удаления global CSS после миграции

---

## Verification

```bash
npm run test && npm run lint && npm run typecheck
npm run ui:catalog
```

---

## Gate WU5 (per slice)

- [ ] Touched components use CSS Modules
- [ ] No new globals in `styles.css`
- [ ] Migrated globals removed
- [ ] Tokens only (no raw colors in modules)
- [ ] Tests pass

**Повторять WU5** по slice A→D пока `styles.css` не опустеет (UI-4 complete).
