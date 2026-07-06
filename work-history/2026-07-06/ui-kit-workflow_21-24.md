# UI Kit Workflow

**Дата:** 2026-07-06 21:35
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

## Зачем
- Унифицировать будущий renderer UI и дать агентам предсказуемый процесс создания компонентов без Tailwind и без смешивания с продуктовой логикой.

## Результат
- Инфраструктура UI Kit-документации, visual canon и agent workflow создана.
- Проверки: `ReadLints` по изменённым Markdown/rule/command файлам — без ошибок; тесты не запускались, так как production-код не менялся.
