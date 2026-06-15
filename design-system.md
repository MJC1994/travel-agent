# Travel Agent Design System

**Inspiration:** Uber Base Design System  
**Version:** 1.0.0  
**Last updated:** 2026-06-14  

A tokenised reference for the Journey Search Agent UI. Tokens are implemented as CSS custom properties in `frontend/src/tokens.css`.

---

## Design Principles

1. **Bold clarity** — High contrast, minimal chrome, content-first layouts.
2. **Confident typography** — Strong headings, readable body text, tight letter-spacing on display sizes.
3. **Pill-shaped controls** — Primary actions and inputs use full-radius (pill) shapes.
4. **Monochrome + accent** — Black and white dominate; green signals success and active states.
5. **Mobile-first** — Single-column, thumb-friendly touch targets (minimum 44×44px).

---

## Colour Tokens

### Brand

| Token | Value | Usage |
|---|---|---|
| `--color-black` | `#000000` | Primary buttons, user chat bubbles, header |
| `--color-white` | `#ffffff` | Page background, inverse text |
| `--color-green` | `#06C167` | Accent, active mic, success states |
| `--color-green-dark` | `#048848` | Accent hover / pressed |
| `--color-blue` | `#276EF1` | Links, informational highlights |
| `--color-red` | `#E11900` | Errors, destructive actions |
| `--color-yellow` | `#FFC043` | Warnings, attention |

### Neutral Scale

| Token | Value | Usage |
|---|---|---|
| `--color-gray-50` | `#F6F6F6` | Page surface, input backgrounds |
| `--color-gray-100` | `#EEEEEE` | Agent chat bubbles |
| `--color-gray-200` | `#E2E2E2` | Borders, dividers |
| `--color-gray-300` | `#CBCBCB` | Strong borders, disabled outlines |
| `--color-gray-400` | `#AFAFAF` | Placeholder text, muted icons |
| `--color-gray-500` | `#757575` | Tertiary text |
| `--color-gray-600` | `#545454` | Secondary text |
| `--color-gray-700` | `#333333` | Emphasis text |
| `--color-gray-800` | `#1F1F1F` | Near-black surfaces |
| `--color-gray-900` | `#141414` | Darkest surface |

### Semantic Aliases

| Token | Resolves To | Usage |
|---|---|---|
| `--color-background` | `--color-white` | App background |
| `--color-surface` | `--color-gray-50` | Subtle background areas |
| `--color-surface-elevated` | `--color-white` | Cards, modals |
| `--color-border` | `--color-gray-200` | Default borders |
| `--color-border-strong` | `--color-gray-300` | Emphasised borders |
| `--color-text-primary` | `--color-black` | Headings, body |
| `--color-text-secondary` | `--color-gray-600` | Subtitles, metadata |
| `--color-text-tertiary` | `--color-gray-500` | Hints, timestamps |
| `--color-text-inverse` | `--color-white` | Text on dark surfaces |
| `--color-text-link` | `--color-blue` | Inline links |
| `--color-accent` | `--color-green` | Active / success |
| `--color-accent-hover` | `--color-green-dark` | Accent hover |
| `--color-error` | `--color-red` | Validation errors |

### Chat-Specific

| Token | Resolves To | Usage |
|---|---|---|
| `--color-bubble-agent` | `--color-gray-100` | Agent message background |
| `--color-bubble-agent-text` | `--color-text-primary` | Agent message text |
| `--color-bubble-user` | `--color-black` | User message background |
| `--color-bubble-user-text` | `--color-text-inverse` | User message text |

---

## Typography Tokens

### Font Families

| Token | Stack | Usage |
|---|---|---|
| `--font-display` | Inter, system-ui, sans-serif | Headings, app title |
| `--font-body` | Inter, system-ui, sans-serif | Body, chat messages |
| `--font-mono` | ui-monospace, SF Mono, monospace | Code, station codes |

> **Note:** Uber uses proprietary *Uber Move*. Inter is the web substitute — geometric, neutral, and freely available via Google Fonts.

### Font Sizes

| Token | Size | Usage |
|---|---|---|
| `--font-size-xs` | 12px / 0.75rem | Timestamps, badges |
| `--font-size-sm` | 14px / 0.875rem | Secondary labels, hints |
| `--font-size-base` | 16px / 1rem | Body text, chat messages |
| `--font-size-md` | 18px / 1.125rem | Input text, emphasised body |
| `--font-size-lg` | 20px / 1.25rem | Section headings |
| `--font-size-xl` | 24px / 1.5rem | Screen titles |
| `--font-size-2xl` | 32px / 2rem | Hero headings |
| `--font-size-3xl` | 40px / 2.5rem | Marketing / splash |

### Font Weights

| Token | Value | Usage |
|---|---|---|
| `--font-weight-regular` | 400 | Body text |
| `--font-weight-medium` | 500 | Labels, buttons |
| `--font-weight-semibold` | 600 | Subheadings |
| `--font-weight-bold` | 700 | Display headings |

### Line Heights

| Token | Value | Usage |
|---|---|---|
| `--line-height-tight` | 1.2 | Headings |
| `--line-height-snug` | 1.35 | Compact UI text |
| `--line-height-normal` | 1.5 | Body, chat bubbles |
| `--line-height-relaxed` | 1.65 | Long-form content |

### Letter Spacing

| Token | Value | Usage |
|---|---|---|
| `--letter-spacing-tight` | -0.02em | Display headings |
| `--letter-spacing-normal` | 0 | Body text |
| `--letter-spacing-wide` | 0.02em | Uppercase labels |

---

## Spacing Tokens (4px Grid)

| Token | Size | Common Usage |
|---|---|---|
| `--space-1` | 4px | Icon padding, tight gaps |
| `--space-2` | 8px | Inline spacing, bubble padding-y |
| `--space-3` | 12px | Bubble padding-x, compact gaps |
| `--space-4` | 16px | Standard padding, section gaps |
| `--space-5` | 20px | Input bar padding |
| `--space-6` | 24px | Section spacing |
| `--space-8` | 32px | Large section gaps |
| `--space-10` | 40px | Page margins |
| `--space-12` | 48px | Hero spacing |
| `--space-16` | 64px | Full-bleed sections |

---

## Border Radius Tokens

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Small chips, tags |
| `--radius-md` | 8px | Cards, message bubbles |
| `--radius-lg` | 12px | Modals, panels |
| `--radius-xl` | 16px | Large cards |
| `--radius-2xl` | 24px | Bottom sheets |
| `--radius-full` | 9999px | Pill buttons, inputs, avatars |

---

## Shadow Tokens

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.06)` | Subtle elevation |
| `--shadow-md` | `0 2px 8px rgba(0,0,0,0.08)` | Input bar, floating elements |
| `--shadow-lg` | `0 4px 16px rgba(0,0,0,0.12)` | Modals, dropdowns |
| `--shadow-input` | `0 0 0 2px #000` | Focus ring (Uber-style solid ring) |

---

## Layout Tokens

| Token | Value | Usage |
|---|---|---|
| `--layout-max-width` | 480px | Chat container max width |
| `--header-height` | 56px | Top navigation bar |
| `--input-bar-height` | 72px | Bottom input area |

---

## Motion Tokens

| Token | Value | Usage |
|---|---|---|
| `--duration-fast` | 120ms | Icon toggles, hover |
| `--duration-normal` | 200ms | Button press, fade |
| `--duration-slow` | 320ms | Panel slide, mic pulse |
| `--ease-default` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Standard transitions |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Mic active pulse |

---

## Z-Index Tokens

| Token | Value | Usage |
|---|---|---|
| `--z-header` | 10 | Sticky header |
| `--z-input` | 10 | Sticky input bar |
| `--z-overlay` | 100 | Modals, toasts |

---

## Component Patterns

### Primary Button (Pill)

```
Background:  --color-black
Text:        --color-white
Radius:      --radius-full
Padding:     --space-3 --space-6
Font:        --font-weight-medium, --font-size-base
Hover:       opacity 0.85
Min height:  48px
```

### Icon Button (Circular)

```
Size:        44×44px (touch target)
Radius:      --radius-full
Background:  transparent → --color-gray-100 on hover
Active:      --color-green background when recording
```

### Text Input (Pill)

```
Background:  --color-gray-50
Border:      1px solid --color-border
Radius:      --radius-full
Padding:     --space-3 --space-4
Focus:       --shadow-input (2px black ring)
Font:        --font-size-base
```

### Chat Bubble — Agent

```
Background:  --color-bubble-agent
Text:        --color-bubble-agent-text
Radius:      --radius-md (--radius-lg on first/last in group)
Align:       left
Max width:   85%
```

### Chat Bubble — User

```
Background:  --color-bubble-user
Text:        --color-bubble-user-text
Radius:      --radius-md
Align:       right
Max width:   85%
```

### Header Bar

```
Background:  --color-black
Text:        --color-white
Height:      --header-height
Font:        --font-weight-semibold, --font-size-lg
```

---

## Accessibility Notes

- Minimum touch target: **44×44px** on all interactive elements.
- Focus states use a **2px solid black ring** (`--shadow-input`), not outline-only.
- Muted state must include both icon change **and** accessible label update.
- Chat messages should use `role="log"` with `aria-live="polite"` for screen readers.
- Colour contrast: all text pairings meet **WCAG AA** (4.5:1 body, 3:1 large text).
