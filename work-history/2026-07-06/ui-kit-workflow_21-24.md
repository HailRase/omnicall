# UI Kit Workflow

**Дата:** 2026-07-06 21:59
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/ui-kit/UI-KIT.md`
- `docs/ui-kit/VISUAL-SPEC.md`
- `.cursor/skills/ui-kit-component-agent/SKILL.md`
- `.cursor/rules/ui-kit.mdc`
- `.cursor/commands/ui-kit.md`
- `AGENTS.md`

## Что
- Создан подробный план внутреннего UI Kit на базе shadcn-подхода, Radix, CSS Modules и токенов.
- Добавлен workflow для реализации одного UI Kit-компонента за сессию.
- Добавлено проектное правило, требующее проверять UI Kit перед созданием нового renderer UI.
- Добавлена команда `/ui-kit` для отдельной реализации reusable UI primitives.
- Обновлён `AGENTS.md` с новой командой, skill и правилом.
- Добавлен visual spec с shadcn-like размерами, состояниями, focus ring, overlay/menu/toast каноном и Storybook visual gate.
- Усилены правила после review `Button`: запрещены `filter/brightness` для variant states, добавлен порядок `...rest` до controlled props, P0 baseline tests и all-variant light/dark stories.
- `Button` в `UI-KIT.md` переведён обратно в `in progress` до fix pass по новым baseline-gates.
- Добавлены icon-only gates после review `IconButton`: controlled `aria-label`, semantic `AppIcon`, `disabledReason` tooltip coverage и P0 checklist.
- `IconButton` в `UI-KIT.md` переведён обратно в `in progress` до fix pass по новым baseline-gates.
- Добавлены Universal Quality Gates для остальных UI Kit-компонентов: Base, Native Control, Form Control, Radix Primitive, Feedback/Display.
- Обновлены `/ui-kit`, `ui-kit-component-agent` и `ui-kit.mdc`, чтобы агенты определяли inherited gates перед реализацией любого компонента.

## Зачем
- Унифицировать будущий renderer UI и дать агентам предсказуемый процесс создания компонентов без Tailwind и без смешивания с продуктовой логикой.

## Результат
- Инфраструктура UI Kit-документации, visual canon и agent workflow создана и усилена для всех будущих компонентных классов.
- Проверки: `ReadLints` по изменённым Markdown/rule/command файлам — без ошибок; тесты не запускались, так как production-код не менялся.
