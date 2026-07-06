# UI Kit Implementation Plan

## Purpose

Build an internal React UI Kit inspired by shadcn/ui design patterns, implemented with CSS Modules, semantic tokens, Radix primitives where behavior is complex, Storybook, and strict TypeScript.

The UI Kit is framework-local. It must not import product state, Use Cases, Electron APIs, SIP, repositories, stores, or softphone business logic.

## Goals

- Provide one consistent component language for all renderer UI.
- Match shadcn-like density, radius, focus rings, variants, and composition.
- Keep the existing stack: React, CSS Modules, tokens, Storybook, Vitest.
- Use Radix only for accessibility-heavy primitives.
- Let agents implement one component at a time with a repeatable checklist.

## Non-Goals

- Do not introduce Tailwind.
- Do not run `shadcn init` as the source of truth.
- Do not migrate all existing screens in one pass.
- Do not put product copy, SIP rules, Electron behavior, or store access in UI Kit.
- Do not add compatibility shims for unfinished component APIs.

## Target Location

```txt
src/renderer/components/ui/
  button/
    Button.tsx
    Button.module.css
    Button.stories.tsx
    Button.test.tsx
    index.ts
  dialog/
  dropdown-menu/
  ...
```

Exports:

```txt
src/renderer/components/ui/index.ts
```

Storybook title convention:

```txt
UI Kit/Button
UI Kit/Dialog
UI Kit/Dropdown Menu
```

## Design Sources

- shadcn/ui: visual language, public API shape, variants, composition ideas.
- Radix UI: Dialog, DropdownMenu, Select, Tooltip, Popover, Tabs, AlertDialog, Checkbox, RadioGroup, Switch.
- Existing project tokens: `src/renderer/styles/tokens.css`.
- Existing CSS rules: co-located CSS Modules, kebab-case selectors, camelCase TS access.
- Visual canon: `docs/ui-kit/VISUAL-SPEC.md`.

## Visual Canon

Every UI Kit implementation must read `docs/ui-kit/VISUAL-SPEC.md` before code. The spec defines shadcn-like density, control heights, padding, focus rings, overlay sizing, menu states, toast tones, Storybook visual gates, and the first-component rule.

`Button` is the visual baseline. Do not implement later UI Kit primitives until `Button` is complete unless the user explicitly overrides the order.

## Architecture Rules

- Components are presentational and reusable.
- Inputs are props, children, callbacks, refs, and controlled values.
- Outputs are DOM, callbacks, accessible state, and visual state.
- No `any`, no `@ts-ignore`, no `as unknown as`.
- No hardcoded product text; labels come from props or children.
- No direct Lucide imports; icon-only controls use the project icon layer.
- No inline colors, hardcoded hex/rgb, or theme branches in React.
- Light and dark themes must work through semantic tokens.

## Styling Rules

- Use CSS Modules for all component styles.
- Use `clsx` for conditional classes.
- Use typed maps for variants and sizes.
- Use semantic tokens for color, spacing, radius, shadow, z-index, and focus.
- Keep selectors local; no global component styles.
- Prefer data attributes for state styling: `data-state`, `data-disabled`, `data-invalid`.

## TypeScript API Rules

- Export a `Props` type for every component.
- Prefer discriminated unions when props have exclusive modes.
- Prefer explicit public return types.
- Support `className` for the root element.
- Support `children` when composition is natural.
- Support `disabled`, `invalid`, `loading`, and `aria-*` only where meaningful.
- Support controlled and uncontrolled modes only for components that need both.
- Forward refs for interactive primitives.

## Accessibility Rules

- Every interactive component must be keyboard reachable.
- Every focusable control must have visible focus.
- Icon-only controls require an accessible label.
- Disabled controls must not trigger callbacks.
- Invalid state must be exposed with `aria-invalid` when applicable.
- Dialog-like surfaces must manage focus, escape, outside click, and aria labeling.
- Menu/select components must support keyboard navigation and typeahead when Radix provides it.

## Storybook Rules

Every UI Kit component needs stories under `UI Kit/*`:

- Default
- Variants
- Sizes
- Disabled
- Invalid or Destructive when applicable
- Loading when applicable
- Controlled state when applicable
- Light Theme
- Dark Theme
- Keyboard or interaction notes for complex primitives

## Test Rules

Use Vitest and Testing Library. Test behavior, not implementation details:

- renders required content
- applies semantic roles and labels
- calls callbacks on valid interaction
- blocks callbacks when disabled/loading
- handles keyboard behavior where applicable
- reflects controlled state
- exposes invalid or expanded state where applicable

## Universal Quality Gates

Every component checklist inherits these gates. Do not mark a component `done` until the applicable inherited gates are satisfied.

### Base Gates

- [ ] Native `...rest` props are spread before internally controlled props.
- [ ] Controlled props cannot override disabled/loading/ARIA/data-state guards.
- [ ] Public `className` is preserved on the documented root slot.
- [ ] Public ref points to the documented root or interactive element.
- [ ] CSS uses semantic tokens only; no hardcoded colors or theme branches.
- [ ] Variant hover/active states do not use CSS `filter` or `brightness`.
- [ ] Storybook shows all variants in both light and dark themes.

### Native Control Gates

- [ ] Default native type/role is safe and documented.
- [ ] Disabled and loading states block interaction.
- [ ] Keyboard activation works through native behavior.
- [ ] Tests cover default type/role, ref, className, disabled/loading, and protected controlled props.

### Form Control Gates

- [ ] Label, hint, and error are connected through ids or Radix primitives.
- [ ] Invalid state exposes `aria-invalid` where supported.
- [ ] `aria-describedby` includes hint/error ids where applicable.
- [ ] Controlled and uncontrolled modes are documented when both exist.
- [ ] Tests cover value/checked changes, disabled blocking, invalid attributes, labels, and descriptions.

### Radix Primitive Gates

- [ ] Radix owns focus, roving focus, typeahead, escape, outside click, and focus restore behavior.
- [ ] CSS targets Radix `data-state`, `data-disabled`, `data-highlighted`, `data-side`, `data-align`, or `data-orientation` where applicable.
- [ ] Portal content uses deterministic z-index, surface, border, shadow, and theme tokens.
- [ ] Tests cover open/close, keyboard navigation, disabled items, escape behavior, and controlled state where applicable.

### Feedback And Display Gates

- [ ] Tone variants use semantic tokens only.
- [ ] Accessible role matches urgency or is intentionally decorative.
- [ ] Reduced motion is respected for loading or skeleton animations.
- [ ] Tests cover tone rendering, accessible role, slot rendering, and decorative behavior where applicable.

## Agent Workflow

Each UI Kit implementation session must handle exactly one component family.

1. Read `.cursor/skills/ui-kit-component-agent/SKILL.md`.
2. Read this file.
3. Read `docs/ui-kit/VISUAL-SPEC.md`.
4. Pick the first unchecked component or the user-selected component.
5. Copy the component checklist into the working notes.
6. Implement component, CSS Module, tests, stories, and barrel export.
7. Verify light, dark, interaction, and visual-canon states in Storybook stories.
8. Run focused tests first, then project checks requested by the command.
9. Update this file: mark completed checklist items and set the next component.
10. Add work-history.
11. Report completed items and next recommended component.

## Component Template

Use this template when adding a new component section.

```md
### ComponentName

Status: [ ] planned [ ] in progress [ ] done
Radix: yes | no
Priority: P0 | P1 | P2

Purpose:
- ...

API:
- ...

Stories:
- [ ] Default
- [ ] Variants
- [ ] Sizes
- [ ] Disabled
- [ ] Light Theme
- [ ] Dark Theme

Tests:
- [ ] ...

Checklist:
- [ ] Component implemented
- [ ] CSS Module implemented
- [ ] Typed variants implemented
- [ ] Applicable Universal Quality Gates satisfied
- [ ] Storybook added under UI Kit/ComponentName
- [ ] Tests added
- [ ] Barrel export added
- [ ] Light/dark verified
- [ ] Accessibility verified
- [ ] Documentation status updated
```

## Implementation Phases

### Phase 0: Foundation

Status: [ ] planned [ ] in progress [x] done

Checklist:

- [x] Create `src/renderer/components/ui/`.
- [x] Create root `index.ts`.
- [x] Define shared UI types for `Size`, `Tone`, and `PolymorphicSlot` only if needed.
- [x] Define variant naming conventions.
- [x] Add Storybook grouping convention.
- [x] Confirm tokens cover shadcn-like surfaces, focus, destructive, muted, popover, and ring.
- [x] Review `docs/ui-kit/VISUAL-SPEC.md` and convert missing values to semantic tokens before component code.

### Phase 1: Core Controls

Build first. These remove most local button/input duplication.

### Button

Status: [ ] planned [ ] in progress [x] done
Radix: no
Priority: P0

Purpose:

- Base action component.
- Supports variants, sizes, disabled, loading, and optional full width.
- Emits click only for enabled user actions.

API:

- `variant`: `primary | secondary | outline | ghost | destructive | link`
- `size`: `sm | md | lg | icon`
- `loading?: boolean`
- `fullWidth?: boolean`
- `className?: string`
- native button props except unsafe overrides

Stories:

- [x] Default
- [x] Variants
- [x] Sizes
- [x] Disabled
- [x] Loading
- [x] Full Width
- [x] Light Theme
- [x] Dark Theme
- [x] Light Theme with all variants
- [x] Dark Theme with all variants

Tests:

- [x] Renders children.
- [x] Calls `onClick` when enabled.
- [x] Does not call `onClick` when disabled.
- [x] Does not call `onClick` when loading.
- [x] Exposes busy state when loading.
- [x] Defaults native `type` to `button`.
- [x] Forwards refs to the native button.
- [x] Preserves caller `className`.
- [x] Sets native `disabled` while loading.
- [x] Protects internally controlled disabled/loading attributes from native prop override.

Checklist:

- [x] Component implemented
- [x] CSS Module implemented
- [x] Typed variants implemented
- [x] Storybook added under `UI Kit/Button`
- [x] Tests added
- [x] Barrel export added
- [x] Light/dark all-variant parity verified
- [x] Accessibility verified
- [x] No CSS `filter`/`brightness` variant states
- [x] Native prop spread cannot override controlled UI state
- [x] Documentation status updated after fix pass

### IconButton

Status: [ ] planned [ ] in progress [x] done
Radix: no
Priority: P0

Purpose:

- Icon-only action component.
- Wraps the project semantic icon layer.
- Requires accessible label and optional tooltip.

API:

- `iconId`: project semantic icon id
- `ariaLabel`: required string
- `variant`: `ghost | outline | secondary | destructive | primary`
- `size`: `sm | md | lg`
- `tooltipLabel?: string`
- `disabledReason?: string | null`
- `loading?: boolean`

Stories:

- [x] Default
- [x] Variants
- [x] Sizes
- [x] Disabled Reason
- [x] Tooltip
- [x] Light Theme
- [x] Dark Theme
- [x] Light Theme with all variants
- [x] Dark Theme with all variants

Tests:

- [x] Requires accessible label through props type.
- [x] Renders semantic icon.
- [x] Does not trigger when disabled reason exists.
- [x] Shows tooltip label through tooltip wrapper.
- [x] Defaults native `type` to `button`.
- [x] Forwards refs to the native button.
- [x] Preserves caller `className`.
- [x] Sets native `disabled` while loading.
- [x] Blocks click when `disabled` prop is true.
- [x] Shows `disabledReason` through tooltip.
- [x] Protects internally controlled disabled/loading/label attributes from native prop override.

Checklist:

- [x] Component implemented
- [x] CSS Module implemented
- [x] Typed variants implemented
- [x] Storybook added under `UI Kit/IconButton`
- [x] Tests added
- [x] Barrel export added
- [x] Light/dark all-variant parity verified
- [x] Accessibility verified
- [x] No CSS `filter`/`brightness` variant states
- [x] Native prop spread cannot override controlled UI state
- [x] Semantic `AppIcon` layer preserved
- [x] Documentation status updated after fix pass

### Input

Status: [ ] planned [ ] in progress [x] done
Radix: no
Priority: P0

Purpose:

- Text entry control.
- Supports invalid, disabled, readonly, prefix, suffix, and size.
- Leaves labels and messages to `FormField`.

API:

- `size`: `sm | md | lg`
- `invalid?: boolean`
- `prefix?: ReactNode`
- `suffix?: ReactNode`
- `className?: string`
- native input props

Stories:

- [x] Default
- [x] Sizes
- [x] Disabled
- [x] Readonly
- [x] Invalid
- [x] Prefix/Suffix
- [x] Light Theme
- [x] Dark Theme

Tests:

- [x] Renders as textbox for text input.
- [x] Forwards value changes.
- [x] Applies `aria-invalid` when invalid.
- [x] Does not call change handler when disabled.
- [x] Forwards refs to the native input.
- [x] Preserves caller `className`.
- [x] Exposes readonly state through `data-readonly`.
- [x] Renders prefix and suffix affixes.
- [x] Protects internally controlled invalid/disabled attributes from native prop override.

Checklist:

- [x] Component implemented
- [x] CSS Module implemented
- [x] Typed sizes implemented
- [x] Applicable Universal Quality Gates satisfied
- [x] Storybook added under `UI Kit/Input`
- [x] Tests added
- [x] Barrel export added
- [x] Light/dark verified
- [x] Accessibility verified
- [x] No CSS `filter`/`brightness` variant states
- [x] Native prop spread cannot override controlled UI state
- [x] Documentation status updated

### Textarea

Status: [ ] planned [ ] in progress [x] done
Radix: no
Priority: P1

Purpose:

- Multiline text entry control.
- Supports invalid, disabled, readonly, and resize policy.
- Leaves labels and messages to `FormField`.

API:

- `size`: `sm | md | lg`
- `invalid?: boolean`
- `resize`: `none | vertical`
- native textarea props

Stories:

- [x] Default
- [x] Sizes
- [x] Disabled
- [x] Readonly
- [x] Invalid
- [x] Resize
- [x] Light Theme
- [x] Dark Theme

Tests:

- [x] Renders multiline textbox.
- [x] Forwards value changes.
- [x] Applies `aria-invalid` when invalid.
- [x] Does not call change handler when disabled.
- [x] Forwards refs to the native textarea.
- [x] Preserves caller `className`.
- [x] Exposes readonly state through `data-readonly`.
- [x] Applies resize policy through `data-resize`.
- [x] Protects internally controlled invalid/disabled attributes from native prop override.

Checklist:

- [x] Component implemented
- [x] CSS Module implemented
- [x] Typed sizes implemented
- [x] Applicable Universal Quality Gates satisfied
- [x] Storybook added under `UI Kit/Textarea`
- [x] Tests added
- [x] Barrel export added
- [x] Light/dark verified
- [x] Accessibility verified
- [x] No CSS `filter`/`brightness` variant states
- [x] Native prop spread cannot override controlled UI state
- [x] Documentation status updated

### Label

Status: [ ] planned [ ] in progress [x] done
Radix: no
Priority: P1

Purpose:

- Accessible form label.
- Keeps label typography consistent.
- Supports required and disabled visuals.

API:

- `required?: boolean`
- `disabled?: boolean`
- native label props

Stories:

- [x] Default
- [x] Required
- [x] Disabled
- [x] Light Theme
- [x] Dark Theme

Tests:

- [x] Associates with a control through `htmlFor`.
- [x] Renders required indicator when requested.

Checklist:

- [x] Component implemented
- [x] CSS Module implemented
- [x] Storybook added under `UI Kit/Label`
- [x] Tests added
- [x] Barrel export added
- [x] Light/dark verified
- [x] Accessibility verified
- [x] Documentation status updated

## Phase 2: Form Controls

### FormField

Status: [ ] planned [ ] in progress [x] done
Radix: no
Priority: P0

Purpose:

- Composes label, control, hint, and error message.
- Provides ids for accessible descriptions.
- Keeps product forms visually consistent.

API:

- `label?: ReactNode`
- `hint?: ReactNode`
- `error?: ReactNode`
- `required?: boolean`
- `disabled?: boolean`
- `children: ReactElement`

Stories:

- [x] Default
- [x] Hint
- [x] Error
- [x] Required
- [x] Disabled
- [x] Light Theme
- [x] Dark Theme

Tests:

- [x] Connects label to control.
- [x] Connects hint and error with descriptions.
- [x] Gives error priority over hint when both exist.
- [x] Forwards disabled and required state to label and control.
- [x] Forwards ref to the root field container.
- [x] Preserves caller `className`.
- [x] Merges existing `aria-describedby` on the control.
- [x] Protects controlled ids and invalid state from child prop override.

Checklist:

- [x] Component implemented
- [x] CSS Module implemented
- [x] Applicable Universal Quality Gates satisfied
- [x] Storybook added under `UI Kit/FormField`
- [x] Tests added
- [x] Barrel export added
- [x] Light/dark verified
- [x] Accessibility verified
- [x] Documentation status updated

### Checkbox

Status: [ ] planned [ ] in progress [x] done
Radix: yes
Priority: P1

Purpose:

- Boolean selection control.
- Supports checked, unchecked, indeterminate, disabled, and invalid.
- Uses Radix for state and keyboard behavior.

API:

- `checked?: boolean | "indeterminate"`
- `defaultChecked?: boolean | "indeterminate"`
- `onCheckedChange`
- `invalid?: boolean`
- `disabled?: boolean`

Stories:

- [x] Default
- [x] Checked
- [x] Indeterminate
- [x] Disabled
- [x] Invalid
- [x] Light Theme
- [x] Dark Theme

Tests:

- [x] Toggles on click.
- [x] Toggles on keyboard.
- [x] Emits checked state.
- [x] Does not toggle when disabled.

Checklist:

- [x] Component implemented
- [x] CSS Module implemented
- [x] Radix primitive wrapped
- [x] Storybook added under `UI Kit/Checkbox`
- [x] Tests added
- [x] Barrel export added
- [x] Light/dark verified
- [x] Accessibility verified
- [x] Documentation status updated

### Switch

Status: [ ] planned [ ] in progress [x] done
Radix: yes
Priority: P1

Purpose:

- Immediate on/off setting control.
- Supports controlled and uncontrolled modes.
- Uses Radix for switch semantics.

API:

- `checked?: boolean`
- `defaultChecked?: boolean`
- `onCheckedChange`
- `disabled?: boolean`

Stories:

- [x] Default
- [x] Checked
- [x] Disabled
- [x] With Label
- [x] Light Theme
- [x] Dark Theme

Tests:

- [x] Toggles state.
- [x] Emits checked value.
- [x] Does not toggle when disabled.
- [x] Has switch role.

Checklist:

- [x] Component implemented
- [x] CSS Module implemented
- [x] Radix primitive wrapped
- [x] Storybook added under `UI Kit/Switch`
- [x] Tests added
- [x] Barrel export added
- [x] Light/dark verified
- [x] Accessibility verified
- [x] Documentation status updated

### RadioGroup

Status: [ ] planned [ ] in progress [ ] done
Radix: yes
Priority: P2

Purpose:

- Mutually exclusive option set.
- Supports keyboard navigation.
- Uses Radix for radio semantics.

API:

- `value?: string`
- `defaultValue?: string`
- `onValueChange`
- `disabled?: boolean`
- `orientation?: "horizontal" | "vertical"`

Stories:

- [ ] Default
- [ ] Horizontal
- [ ] Disabled Group
- [ ] Disabled Item
- [ ] Light Theme
- [ ] Dark Theme

Tests:

- [ ] Selects an item.
- [ ] Emits selected value.
- [ ] Supports keyboard navigation.

Checklist:

- [ ] Component implemented
- [ ] CSS Module implemented
- [ ] Radix primitive wrapped
- [ ] Storybook added under `UI Kit/RadioGroup`
- [ ] Tests added
- [ ] Barrel export added
- [ ] Light/dark verified
- [ ] Accessibility verified
- [ ] Documentation status updated

### Select

Status: [ ] planned [ ] in progress [x] done
Radix: yes
Priority: P1

Purpose:

- Single-value select with consistent popover styling.
- Supports keyboard navigation and typeahead.
- Uses Radix Select.

API:

- `value?: string`
- `defaultValue?: string`
- `onValueChange`
- `placeholder?: ReactNode`
- `disabled?: boolean`
- `invalid?: boolean`
- item model with `value`, `label`, `disabled`

Stories:

- [x] Default
- [x] Placeholder
- [x] Disabled
- [x] Invalid
- [x] Many Items
- [x] Light Theme
- [x] Dark Theme

Tests:

- [x] Opens on trigger interaction.
- [x] Selects an item.
- [x] Emits selected value.
- [x] Supports keyboard selection.

Checklist:

- [x] Component implemented
- [x] CSS Module implemented
- [x] Radix primitive wrapped
- [x] Applicable Universal Quality Gates satisfied
- [x] Storybook added under `UI Kit/Select`
- [x] Tests added
- [x] Barrel export added
- [x] Light/dark verified
- [x] Accessibility verified
- [x] Documentation status updated

## Phase 3: Overlays

### Dialog

Status: [ ] planned [ ] in progress [x] done
Radix: yes
Priority: P0

Purpose:

- General modal surface.
- Manages focus, escape, outside click, title, and description.
- Uses Radix Dialog with CSS Modules.

API:

- `open?: boolean`
- `defaultOpen?: boolean`
- `onOpenChange`
- `title`
- `description?`
- `size`: `sm | md | lg | fullscreen`
- `closeLabel`
- composable `DialogTrigger`, `DialogContent`, `DialogFooter`

Stories:

- [x] Default
- [x] Sizes
- [x] With Footer
- [x] Controlled
- [x] Long Content
- [x] Light Theme
- [x] Dark Theme

Tests:

- [x] Opens and closes.
- [x] Closes on escape.
- [x] Restores focus.
- [x] Has dialog role and accessible name.

Checklist:

- [x] Component implemented
- [x] CSS Module implemented
- [x] Radix primitive wrapped
- [x] Storybook added under `UI Kit/Dialog`
- [x] Tests added
- [x] Barrel export added
- [x] Light/dark verified
- [x] Accessibility verified
- [x] Documentation status updated

### AlertDialog

Status: [ ] planned [ ] in progress [x] done
Radix: yes
Priority: P1

Purpose:

- Blocking confirmation or destructive decision.
- Requires explicit cancel and action labels.
- Uses Radix AlertDialog.

API:

- composable root, trigger, content, header, title, description, footer, action, cancel
- `open?: boolean`
- `onOpenChange`
- action tone via `Button` variant (`primary` or `destructive`)
- loading action via `Button` `loading`

Stories:

- [x] Default
- [x] Destructive
- [x] Controlled
- [x] Loading Action
- [x] Light Theme
- [x] Dark Theme

Tests:

- [x] Opens and closes.
- [x] Calls action.
- [x] Calls cancel.
- [x] Keeps focus inside.
- [x] Has alertdialog role.

Checklist:

- [x] Component implemented
- [x] CSS Module implemented
- [x] Radix primitive wrapped
- [x] Storybook added under `UI Kit/AlertDialog`
- [x] Tests added
- [x] Barrel export added
- [x] Light/dark verified
- [x] Accessibility verified
- [x] Documentation status updated

### DropdownMenu

Status: [ ] planned [ ] in progress [x] done
Radix: yes
Priority: P0

Purpose:

- Action menu anchored to a trigger.
- Supports items, destructive items, separators, labels, checked items, and disabled reasons.
- Uses Radix DropdownMenu.

API:

- `open?: boolean`
- `onOpenChange`
- `align?: "start" | "center" | "end"`
- `side?: "top" | "right" | "bottom" | "left"`
- composable trigger/content/item components

Stories:

- [x] Default
- [x] With Icons
- [x] Destructive Item
- [x] Disabled Item
- [x] Checkbox Item
- [x] Controlled
- [x] Light Theme
- [x] Dark Theme

Tests:

- [x] Opens from trigger.
- [x] Selects item.
- [x] Skips disabled item.
- [x] Supports keyboard navigation.
- [x] Closes on escape.
- [x] Supports controlled open state.
- [x] Toggles checkbox item.
- [x] Preserves caller className on content.

Checklist:

- [x] Component implemented
- [x] CSS Module implemented
- [x] Radix primitive wrapped
- [x] Applicable Universal Quality Gates satisfied
- [x] Storybook added under `UI Kit/DropdownMenu`
- [x] Tests added
- [x] Barrel export added
- [x] Light/dark verified
- [x] Accessibility verified
- [x] Documentation status updated

### Popover

Status: [ ] planned [ ] in progress [ ] done
Radix: yes
Priority: P2

Purpose:

- Non-modal floating content.
- Supports controlled state, placement, and collision handling.
- Uses Radix Popover.

API:

- `open?: boolean`
- `onOpenChange`
- `side`
- `align`
- composable trigger/content components

Stories:

- [ ] Default
- [ ] Placement
- [ ] Controlled
- [ ] With Form Content
- [ ] Light Theme
- [ ] Dark Theme

Tests:

- [ ] Opens from trigger.
- [ ] Closes on outside interaction.
- [ ] Supports escape.

Checklist:

- [ ] Component implemented
- [ ] CSS Module implemented
- [ ] Radix primitive wrapped
- [ ] Storybook added under `UI Kit/Popover`
- [ ] Tests added
- [ ] Barrel export added
- [ ] Light/dark verified
- [ ] Accessibility verified
- [ ] Documentation status updated

### Tooltip

Status: [ ] planned [ ] in progress [x] done
Radix: yes
Priority: P1

Purpose:

- Short assistive text on hover and focus.
- Supports delay, side, and disabled reason messaging.
- May wrap or replace existing tooltip implementation after parity.

API:

- `label: ReactNode`
- `side?: "top" | "right" | "bottom" | "left"`
- `delayDuration?: number`
- `disabled?: boolean`
- `children: ReactNode`
- composable `TooltipProvider`, `TooltipRoot`, `TooltipTrigger`, `TooltipContent`

Stories:

- [x] Default
- [x] Sides
- [x] Delay
- [x] Disabled
- [x] Long Text
- [x] Light Theme
- [x] Dark Theme

Tests:

- [x] Shows on hover.
- [x] Shows on focus.
- [x] Hides on escape.
- [x] Does not render when disabled.

Checklist:

- [x] Component implemented
- [x] CSS Module implemented
- [x] Radix primitive wrapped
- [x] Storybook added under `UI Kit/Tooltip`
- [x] Tests added
- [x] Barrel export added
- [x] Light/dark verified
- [x] Accessibility verified
- [x] Applicable Universal Quality Gates satisfied
- [x] Documentation status updated

## Phase 4: Feedback

### Toast

Status: [ ] planned [ ] in progress [x] done
Radix: yes
Priority: P1

Purpose:

- Temporary feedback message.
- Supports title, description, action, close, duration, and placement.
- Uses Radix Toast via UI Kit primitives; product `NotificationViewport` composes `ToastProvider`, `ToastRoot`, and `ToastViewport`.

API:

- `tone`: `default | success | warning | destructive | info`
- `title`
- `description?`
- `action?`
- `duration?`
- `closable?: boolean`

Stories:

- [x] Default
- [x] Tones
- [x] With Action
- [x] Closable
- [x] Stacked
- [x] Light Theme
- [x] Dark Theme

Tests:

- [x] Renders title and description.
- [x] Calls action.
- [x] Calls close.
- [x] Auto-dismisses when duration is configured.

Checklist:

- [x] Component implemented
- [x] CSS Module implemented
- [x] Radix primitive wrapped or existing notification wrapper documented
- [x] Applicable Universal Quality Gates satisfied
- [x] Storybook added under `UI Kit/Toast`
- [x] Tests added
- [x] Barrel export added
- [x] Light/dark verified
- [x] Accessibility verified
- [x] Documentation status updated

### Notification

Status: [ ] planned [ ] in progress [x] done
Radix: no
Priority: P1

Purpose:

- Persistent or app-level notification card.
- Supports title, message, tone, actions, close, and metadata slot.
- Can be used by product notification containers.

API:

- `tone`: `default | success | warning | destructive | info`
- `title`
- `message?`
- `actions?: ReactNode`
- `metadata?: ReactNode`
- `onClose?`
- `closable?: boolean`
- `closeLabel?` (required when `closable` is true)

Stories:

- [x] Default
- [x] Tones
- [x] With Actions
- [x] Closable
- [x] Long Content
- [x] Light Theme
- [x] Dark Theme

Tests:

- [x] Renders title and message.
- [x] Calls close.
- [x] Renders actions.
- [x] Uses alert/status role by tone.

Checklist:

- [x] Component implemented
- [x] CSS Module implemented
- [x] Typed tones implemented
- [x] Applicable Universal Quality Gates satisfied
- [x] Storybook added under `UI Kit/Notification`
- [x] Tests added
- [x] Barrel export added
- [x] Light/dark verified
- [x] Accessibility verified
- [x] Documentation status updated

### Badge

Status: [ ] planned [ ] in progress [ ] done
Radix: no
Priority: P1

Purpose:

- Compact status or category marker.
- Supports tone, size, and optional icon.
- Must not encode product state by itself.

API:

- `tone`: `default | muted | success | warning | destructive | info`
- `size`: `sm | md`
- `iconId?`
- `children`

Stories:

- [ ] Default
- [ ] Tones
- [ ] Sizes
- [ ] With Icon
- [ ] Light Theme
- [ ] Dark Theme

Tests:

- [ ] Renders content.
- [ ] Renders icon when provided.
- [ ] Applies tone class.

Checklist:

- [ ] Component implemented
- [ ] CSS Module implemented
- [ ] Typed tones implemented
- [ ] Storybook added under `UI Kit/Badge`
- [ ] Tests added
- [ ] Barrel export added
- [ ] Light/dark verified
- [ ] Accessibility verified
- [ ] Documentation status updated

### Progress

Status: [ ] planned [ ] in progress [x] done
Radix: yes
Priority: P2

Purpose:

- Progress indicator for determinate operations.
- Supports value, max, label, and tone.
- Uses Radix Progress.

API:

- `value: number | null`
- `max?: number`
- `label?: string`
- `tone`: `default | success | warning | destructive`

Stories:

- [x] Default
- [x] Indeterminate
- [x] Tones
- [x] With Label
- [x] Light Theme
- [x] Dark Theme

Tests:

- [x] Exposes progressbar role.
- [x] Reflects value.
- [x] Handles indeterminate state.

Checklist:

- [x] Component implemented
- [x] CSS Module implemented
- [x] Radix primitive wrapped
- [x] Applicable Universal Quality Gates satisfied
- [x] Storybook added under `UI Kit/Progress`
- [x] Tests added
- [x] Barrel export added
- [x] Light/dark verified
- [x] Accessibility verified
- [x] Documentation status updated

### Spinner

Status: [ ] planned [ ] in progress [ ] done
Radix: no
Priority: P1

Purpose:

- Inline loading indicator.
- Supports size and label.
- Avoids layout shift when used inside buttons.

API:

- `size`: `sm | md | lg`
- `label?: string`
- `decorative?: boolean`

Stories:

- [ ] Default
- [ ] Sizes
- [ ] With Label
- [ ] Decorative
- [ ] Light Theme
- [ ] Dark Theme

Tests:

- [ ] Exposes status when not decorative.
- [ ] Hides from accessibility tree when decorative.

Checklist:

- [ ] Component implemented
- [ ] CSS Module implemented
- [ ] Storybook added under `UI Kit/Spinner`
- [ ] Tests added
- [ ] Barrel export added
- [ ] Light/dark verified
- [ ] Accessibility verified
- [ ] Documentation status updated

### Skeleton

Status: [ ] planned [ ] in progress [x] done
Radix: no
Priority: P2

Purpose:

- Loading placeholder.
- Supports shape, size, and reduced-motion safety.
- Does not announce fake content.

API:

- `shape`: `text | rectangle | circle`
- `width?`
- `height?`
- `className?`

Stories:

- [x] Text
- [x] Rectangle
- [x] Circle
- [x] Composite Card
- [x] Light Theme
- [x] Dark Theme

Tests:

- [x] Renders without accessible fake text.
- [x] Applies requested shape.

Checklist:

- [x] Component implemented
- [x] CSS Module implemented
- [x] Applicable Universal Quality Gates satisfied
- [x] Storybook added under `UI Kit/Skeleton`
- [x] Tests added
- [x] Barrel export added
- [x] Light/dark verified
- [x] Reduced motion verified
- [x] Documentation status updated

## Phase 5: Display And Layout

### Card

Status: [ ] planned [ ] in progress [ ] done
Radix: no
Priority: P1

Purpose:

- Surface container for grouped content.
- Supports header, content, footer, interactive, and selected states.
- Provides shadcn-like border, radius, and shadow.

API:

- `tone`: `default | muted | elevated`
- `interactive?: boolean`
- `selected?: boolean`
- compound sections or simple props

Stories:

- [ ] Default
- [ ] With Header
- [ ] With Footer
- [ ] Interactive
- [ ] Selected
- [ ] Light Theme
- [ ] Dark Theme

Tests:

- [ ] Renders sections.
- [ ] Applies selected state.
- [ ] Preserves passed className.

Checklist:

- [ ] Component implemented
- [ ] CSS Module implemented
- [ ] Storybook added under `UI Kit/Card`
- [ ] Tests added
- [ ] Barrel export added
- [ ] Light/dark verified
- [ ] Accessibility verified
- [ ] Documentation status updated

### Tabs

Status: [ ] planned [ ] in progress [ ] done
Radix: yes
Priority: P1

Purpose:

- Section switching component.
- Supports controlled state and keyboard navigation.
- Uses Radix Tabs.

API:

- `value?: string`
- `defaultValue?: string`
- `onValueChange`
- `orientation?: "horizontal" | "vertical"`
- composable list/trigger/content components

Stories:

- [ ] Default
- [ ] Controlled
- [ ] Vertical
- [ ] Disabled Tab
- [ ] Light Theme
- [ ] Dark Theme

Tests:

- [ ] Switches tab on click.
- [ ] Supports keyboard navigation.
- [ ] Emits selected value.

Checklist:

- [ ] Component implemented
- [ ] CSS Module implemented
- [ ] Radix primitive wrapped
- [ ] Storybook added under `UI Kit/Tabs`
- [ ] Tests added
- [ ] Barrel export added
- [ ] Light/dark verified
- [ ] Accessibility verified
- [ ] Documentation status updated

### Avatar

Status: [ ] planned [ ] in progress [ ] done
Radix: yes
Priority: P2

Purpose:

- User or entity avatar.
- Supports image, fallback, status slot, and sizes.
- Uses Radix Avatar.

API:

- `src?: string`
- `alt?: string`
- `fallback`
- `size`: `sm | md | lg`
- `statusSlot?: ReactNode`

Stories:

- [ ] Image
- [ ] Fallback
- [ ] Sizes
- [ ] With Status
- [ ] Light Theme
- [ ] Dark Theme

Tests:

- [ ] Renders fallback.
- [ ] Renders image alt.
- [ ] Applies size.

Checklist:

- [ ] Component implemented
- [ ] CSS Module implemented
- [ ] Radix primitive wrapped
- [ ] Storybook added under `UI Kit/Avatar`
- [ ] Tests added
- [ ] Barrel export added
- [ ] Light/dark verified
- [ ] Accessibility verified
- [ ] Documentation status updated

### Separator

Status: [ ] planned [ ] in progress [ ] done
Radix: yes
Priority: P2

Purpose:

- Visual or semantic content separator.
- Supports horizontal and vertical orientation.
- Uses Radix Separator.

API:

- `orientation?: "horizontal" | "vertical"`
- `decorative?: boolean`

Stories:

- [ ] Horizontal
- [ ] Vertical
- [ ] Decorative
- [ ] Light Theme
- [ ] Dark Theme

Tests:

- [ ] Renders separator role when semantic.
- [ ] Hides role when decorative.
- [ ] Applies orientation.

Checklist:

- [ ] Component implemented
- [ ] CSS Module implemented
- [ ] Radix primitive wrapped
- [ ] Storybook added under `UI Kit/Separator`
- [ ] Tests added
- [ ] Barrel export added
- [ ] Light/dark verified
- [ ] Accessibility verified
- [ ] Documentation status updated

### EmptyState

Status: [ ] planned [ ] in progress [ ] done
Radix: no
Priority: P2

Purpose:

- Consistent empty or no-results state.
- Supports icon, title, description, and action slot.
- Receives all copy from callers.

API:

- `iconId?`
- `title`
- `description?`
- `action?: ReactNode`
- `tone`: `default | muted | warning`

Stories:

- [ ] Default
- [ ] With Icon
- [ ] With Action
- [ ] Warning
- [ ] Light Theme
- [ ] Dark Theme

Tests:

- [ ] Renders title.
- [ ] Renders action slot.
- [ ] Does not hardcode copy.

Checklist:

- [ ] Component implemented
- [ ] CSS Module implemented
- [ ] Storybook added under `UI Kit/EmptyState`
- [ ] Tests added
- [ ] Barrel export added
- [ ] Light/dark verified
- [ ] Accessibility verified
- [ ] Documentation status updated

## Adoption Rule For Product UI

Before adding or changing renderer UI:

1. Check `src/renderer/components/ui`.
2. If a component exists, use it.
3. If a component almost exists, extend it only when the extension is generic.
4. If a missing component is generic and likely reusable, implement it through `/ui-kit`.
5. If the need is product-specific, create a local component that composes UI Kit primitives.
6. Never create a second local button, dialog, menu, toast, input, or select style without documenting why.

## Migration Strategy

- Start with new UI only.
- Replace old local controls only when touching the file for product work.
- Do not migrate critical call flows until core primitives are stable.
- Prefer wrapping existing behavior over rewriting product behavior.
- Keep old components until parity is proven by tests and stories.

## Completion Report Template

Agents must end UI Kit sessions with:

```md
## UI Kit Status

- Component: `ComponentName`
- Status: done | partial | blocked
- Completed checklist items: ...
- Verification: ...
- Next component: `NextComponentName`
- Notes: ...
```

## Quality Gates

A component is not done until:

- TypeScript is strict and public props are explicit.
- Storybook has required stories under `UI Kit/*`.
- Tests cover interaction and accessibility basics.
- CSS uses only modules and semantic tokens.
- Light and dark themes are represented.
- Disabled, invalid, loading, and focus states are intentional.
- Barrel export is present.
- This document marks the component checklist.
