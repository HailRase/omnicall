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

Variants:

| Variant | Default | Hover | Active | Disabled |
| --- | --- | --- | --- | --- |
| `primary` | accent bg, on-accent text | stronger/elevated accent feel | slightly pressed | opacity 0.5 |
| `secondary` | surface-alt bg, primary text | surface-highlight bg | surface-deep bg | opacity 0.5 |
| `outline` | transparent/surface bg, control border | surface-alt bg | surface-deep bg | opacity 0.5 |
| `ghost` | transparent | surface-alt bg | surface-deep bg | opacity 0.5 |
| `destructive` | danger bg/text or danger border | stronger danger bg | pressed danger bg | opacity 0.5 |
| `link` | transparent accent text | underline | underline | opacity 0.5 |

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

Toast:

- compact elevated surface.
- left status stripe or subtle tone background.
- title is semibold.
- description is secondary text.
- actions use UI Kit `Button`.
- close uses UI Kit `IconButton`.

Tones:

- `default`: neutral surface.
- `info`: accent border or subtle accent background.
- `success`: success text/border.
- `warning`: warning text/border.
- `destructive`: danger text/border/background.

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
- light theme.
- dark theme.
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
