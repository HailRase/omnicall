# UI Kit Visual Spec

## Purpose

- Define the shadcn-like visual canon for the internal UI Kit.
- Convert Tailwind-first design references into CSS Modules and tokens.
- Give agents exact visual targets before implementing components.
- Keep components consistent across light and dark themes.

## Inputs

- shadcn/ui component structure, variants, density, and composition patterns.
- Radix data attributes, focus behavior, and primitive accessibility contracts.
- Project tokens from `src/renderer/styles/tokens.css`.

## Outputs

- Component CSS must follow this visual spec.
- Storybook stories must show every visual state listed here.
- UI Kit checklists are incomplete until this spec is verified.

## Core Principle

The UI Kit must feel shadcn-like without copying Tailwind as an implementation detail. Match the proportions, states, radius, focus language, and calm neutral surfaces; implement everything through CSS Modules and project semantic tokens.

## Token Translation

Use existing tokens first. If a value is missing, add a semantic token before hardcoding it in a component.

| shadcn concept | Project token target |
| --- | --- |
| `background` | `--color-bg-surface` |
| `foreground` | `--color-text-primary` |
| `muted` | `--color-bg-surface-alt` |
| `muted-foreground` | `--color-text-secondary` |
| `border` | `--color-border-subtle` |
| `input` | `--color-border-control` |
| `ring` | `--color-outline-focus` |
| `primary` | `--color-accent-primary` |
| `primary-foreground` | `--color-text-on-accent` |
| `destructive` | `--color-text-danger`, `--color-bg-danger` |
| `popover` | `--color-bg-surface-elevated` |
| `popover shadow` | `--shadow-menu-elevated` |

## Canonical Geometry

These values are the visual target for first-pass implementation. Prefer tokens when equivalent tokens exist.

| Item | Value |
| --- | --- |
| Control radius | `var(--radius-control)` |
| Panel/popover radius | `var(--radius-panel)` |
| Hairline border | `1px solid var(--color-border-subtle)` |
| Focus outline | `2px solid var(--color-outline-focus)` |
| Focus offset | `2px` |
| Icon gap | `var(--space-xs)` |
| Compact gap | `var(--space-2xs)` |
| Content gap | `var(--space-sm)` |
| Panel gap | `var(--space-md)` |

## Component Sizes

### Button And Input Heights

Use a small, medium, large scale. `md` is the default.

| Size | Height | Horizontal padding | Font size |
| --- | --- | --- | --- |
| `sm` | `32px` | `var(--space-sm)` | `var(--font-size-xs)` |
| `md` | `36px` | `var(--space-md)` | base inherited size |
| `lg` | `40px` | `var(--space-lg)` | base inherited size |
| `icon-sm` | `32px` square | `0` | icon only |
| `icon-md` | `36px` square | `0` | icon only |
| `icon-lg` | `40px` square | `0` | icon only |

### Overlay Sizes

| Surface | Width |
| --- | --- |
| Dialog `sm` | `360px` max |
| Dialog `md` | `480px` max |
| Dialog `lg` | `640px` max |
| Dropdown menu | `220px` minimum |
| Select content | trigger width minimum |
| Toast | `360px` max |

## Button Visual Canon

All buttons:

- inline-flex, centered, nowrap, no text selection.
- transition color, background, border, box-shadow, opacity.
- disabled and loading states must suppress pointer actions.
- focus-visible uses the global focus ring.
- icon children use `var(--icon-size-sm)` or `var(--icon-size-md)`.
- default native `type` must be `button`.
- native props must not override internally controlled disabled, loading, busy, or state attributes.

Variants:

| Variant | Default | Hover | Active | Disabled |
| --- | --- | --- | --- | --- |
| `primary` | accent bg, on-accent text | stronger/elevated accent feel | slightly pressed | opacity 0.5 |
| `secondary` | surface-alt bg, primary text | surface-highlight bg | surface-deep bg | opacity 0.5 |
| `outline` | transparent/surface bg, control border | surface-alt bg | surface-deep bg | opacity 0.5 |
| `ghost` | transparent | surface-alt bg | surface-deep bg | opacity 0.5 |
| `destructive` | danger bg/text or danger border | stronger danger bg | pressed danger bg | opacity 0.5 |
| `link` | transparent accent text | underline | underline | opacity 0.5 |

Button implementation hard rules:

- Put native prop spreads before internally controlled props.
- Internally controlled props include `disabled`, `aria-busy`, `data-loading`, `data-state`, and event handlers that guard disabled/loading behavior.
- Do not use CSS `filter`, `brightness`, or opacity tricks for primary hover/active colors.
- If a hover/active color is missing, add or reuse a semantic token before styling the component.
- Baseline stories must show all variants in both light and dark themes.
- Baseline tests must cover default type, ref forwarding, className preservation, loading disabled semantics, and protected controlled attributes.

## IconButton Visual Canon

Icon-only buttons follow the `Button` visual canon plus stricter accessibility rules:

- `ariaLabel` is required and must control the rendered `aria-label`.
- `aria-label` must not be overridable through native props.
- Icons must render through the project semantic icon layer (`AppIcon`), never raw icon imports.
- `disabledReason` must disable the button and become the tooltip label.
- `tooltipLabel` is optional for enabled icon buttons.
- loading state replaces the icon with a decorative spinner and sets native `disabled`.
- light and dark stories must show every icon button variant.
- tests must cover `disabledReason` tooltip, disabled prop, loading disabled semantics, ref forwarding, className preservation, and protected controlled attributes.

## Universal Implementation Canon

These rules apply to every UI Kit component unless the component cannot technically support the behavior.

- Native `...rest` props are spread before internally controlled props.
- Internally controlled props include generated ids, labels, `disabled`, `aria-*`, `data-*`, `open`, `value`, `checked`, and guarded event handlers.
- Public `className` must be preserved on the documented root slot.
- Public refs must point to the documented interactive element or root slot.
- State is exposed through semantic DOM state first: native attributes, ARIA, and `data-*`.
- Component state must not be represented only by CSS class names.
- No caller prop may weaken accessibility or disabled/loading guards.
- Stories must make root slot, variants, sizes, states, light theme, and dark theme reviewable without reading code.

## Form Control Canon

Inputs, textareas, selects, checkboxes, switches, radio groups, and form fields:

- labels and descriptions must connect through ids or Radix primitives.
- invalid state uses `aria-invalid` when the rendered element supports it.
- hint and error text must be connectable through `aria-describedby`.
- disabled state must block interaction and use disabled visuals.
- readonly state must not look disabled and must remain readable.
- controlled and uncontrolled modes must be documented and tested when both are supported.
- tests must cover value/checked changes, disabled blocking, invalid attributes, labels, descriptions, and className/ref behavior.

## Radix Primitive Canon

Radix-backed components must preserve Radix behavior instead of reimplementing it:

- use Radix primitives for focus management, roving focus, typeahead, escape handling, and outside interactions.
- style Radix `data-state`, `data-disabled`, `data-highlighted`, `data-side`, `data-align`, and `data-orientation` attributes.
- do not replace Radix focus trap or keyboard behavior with custom handlers.
- expose controlled and uncontrolled state when Radix root supports it.
- portal content must have deterministic z-index, surface, border, shadow, and theme tokens.
- tests must cover open/close, keyboard navigation, disabled items, escape behavior, and controlled state where applicable.

## Feedback And Display Canon

Toast, notification, badge, progress, spinner, skeleton, card, empty state, and similar display components:

- tone variants must use semantic tokens, not hardcoded colors.
- role must match urgency: `status`, `alert`, `progressbar`, or no role for decorative surfaces.
- loading placeholders must respect reduced motion.
- destructive/warning/success/info states need both visual and accessible meaning when interactive.
- tests must cover tone rendering, accessible role, reduced-motion or decorative behavior when applicable, and slot rendering.

## Form Visual Canon

Inputs, textareas, selects:

- background: `--color-bg-surface`.
- border: `--color-border-control`.
- text: `--color-text-primary`.
- placeholder: `--color-text-muted`.
- invalid border: `--color-border-danger-accent`.
- disabled opacity: 0.5; disabled cursor: not-allowed.
- readonly uses normal opacity but muted background.

Labels:

- font weight: `var(--font-weight-semibold)`.
- disabled label uses muted text.
- required marker uses danger text.

Messages:

- hint uses secondary text.
- error uses danger text.
- error replaces hint when both exist.

## Overlay Visual Canon

Dialogs, alert dialogs, dropdowns, popovers, select content, and tooltips:

- use portals for floating or modal content.
- style with `data-state="open"` and `data-state="closed"`.
- use `--color-bg-surface-elevated`.
- use `--color-border-subtle`.
- use `--shadow-menu-elevated` for menus/popovers.
- use `--color-overlay-scrim` for modal overlays.
- never animate focus trap behavior; animate only visual opacity/transform.

Default animation target:

- open: fade in from opacity 0 to 1.
- content: translate `2px` to `0`.
- duration: 120ms to 180ms.
- reduced motion: no transform animation.

## Menu Visual Canon

Dropdown and select items:

- height: `32px` minimum.
- padding: `var(--space-xs) var(--space-sm)`.
- gap: `var(--space-xs)`.
- border radius: `calc(var(--radius-control) - 4px)` when valid CSS is accepted.
- highlighted state uses `--color-bg-surface-alt`.
- destructive item uses danger text and danger hover surface.
- disabled item uses opacity 0.5 and no pointer interaction.

Use Radix state attributes:

- `[data-highlighted]`
- `[data-disabled]`
- `[data-state]`
- `[data-side]`
- `[data-align]`

## Toast And Notification Canon

Sonner (primary, product notifications):

- native `sonner` styled toasts — **not** `unstyled`; stack/hover behavior comes from the library.
- theme bridge maps Sonner CSS variables (`--normal-bg`, `--normal-text`, …) to semantic tokens.
- light/dark follows `data-theme` on `documentElement` + `useDocumentTheme` → Sonner `theme` prop.
- product surface: compact elevated neutral toast — no mandatory left status stripe.
- background: `--color-bg-surface-elevated` (via `--normal-bg` bridge).
- foreground: `--color-text-primary`.
- description: `--color-text-secondary`.
- border: `--color-border-subtle`.
- shadow: `--shadow-menu-elevated`.
- radius: `--radius-panel`.
- product success/error: neutral surface + `AppIcon` tint only (`NotificationToast.module.css`).
- stacked toasts: `expand={false}`, `gap={14}`, `offset={24}` in `NotificationViewport`.
- optional `richColors` — only for ad-hoc/demo toasts, not product notifications.

Radix Toast (legacy primitives):

- same density goals; tone stripe optional and not used by product notifications after Sonner migration.
- title is semibold.
- description is secondary text.
- actions use UI Kit `Button`.
- close uses UI Kit `IconButton`.

Tones (`richColors` / legacy Radix):

- `default`: neutral surface.
- `info`: accent/emphasis tokens.
- `success`: success text/border/background.
- `warning`: warning text/border.
- `destructive` / `error`: danger text/border/background.

## Card And Badge Canon

Card:

- surface background.
- subtle border.
- panel radius.
- optional elevated shadow only when interactive or floating.
- selected state uses focus/accent border without changing layout.

Badge:

- height: `22px` to `24px`.
- radius full.
- compact horizontal padding.
- semibold small text.
- icon gap: `var(--space-2xs)`.

## Focus And Keyboard Gate

Every story for interactive components must support keyboard verification:

- Tab reaches the control.
- Enter or Space activates buttons and checkbox-like controls.
- Escape closes dialogs, menus, popovers, select content, and tooltips when supported.
- Arrow keys work for menu, select, tabs, radio group, and roving-focus primitives.
- Focus is restored to trigger after modal/menu close when Radix provides it.

## Storybook Visual Review Gate

Before a UI Kit component is marked done, Storybook must show:

- all variants in one story.
- all sizes in one story.
- disabled state.
- invalid or destructive state when applicable.
- loading state when applicable.
- light theme with all variants.
- dark theme with all variants.
- dense composition example, such as form row, card action row, or menu trigger.

## Agent Visual Checklist

Agents must verify this list manually before marking a component done:

- [ ] It visually matches shadcn-like density and spacing.
- [ ] Radius, border, focus, hover, active, and disabled states are intentional.
- [ ] Light and dark stories use the same component CSS.
- [ ] No Tailwind utility classes are introduced.
- [ ] No hardcoded hex/rgb colors are introduced.
- [ ] Radix data attributes are used for open, highlighted, checked, disabled, and side states.
- [ ] Storybook exposes enough states for review without reading code.

## First Component Rule

`Button` defines the initial density and variant language. Do not implement `Input`, `Dialog`, `DropdownMenu`, `Toast`, or `Card` until `Button` is completed or the user explicitly overrides the order.
