# Design — Equipos LIS

A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

## Genre

modern-minimal (app / dashboard register; brand palette named by the user).

## Macrostructure family

- App pages: **Workbench** family — tool chrome + content grids. Pages within
  the family share the shell; they vary only in component archetypes
  (dashboard = card grid F6 product-card-grid 4-up → 2-up → 1-up; reservas =
  tabular list). No hero, no marketing sections on app pages.

## Theme

Custom, anchored on the brand teal (user-supplied palette). Hex references:
`#258E8B` primary · `#0E7774` primary-dark (hover) · `#8FC0BF` secondary/soft.

- `--color-paper`   oklch(97.5% 0.008 194)
- `--color-paper-2` oklch(95%   0.010 194)
- `--color-paper-3` oklch(92.5% 0.012 194)
- `--color-ink`     oklch(19%   0.018 194)
- `--color-ink-2`   oklch(36%   0.020 194)
- `--color-rule`    oklch(84%   0.012 194)
- `--color-rule-2`  oklch(90%   0.012 194)
- `--color-muted`   oklch(50%   0.020 194)
- `--color-neutral` oklch(44%   0.020 194)
- `--color-primary`     oklch(52% 0.10 194)  /* #258E8B — brand accent */
- `--color-primary-2`   oklch(48% 0.09 194)  /* #1E807D — navbar/button fills (AA) */
- `--color-primary-dark` oklch(44% 0.095 194) /* #0E7774 — hover, small text on paper */
- `--color-primary-deep` oklch(39% 0.09 194)  /* hover for text links */
- `--color-secondary` oklch(77% 0.050 194)   /* #8FC0BF — soft fills/selected */
- `--color-accent-ink` oklch(97.5% 0.008 194) /* text on teal surfaces */
- `--color-focus` oklch(56% 0.16 194)         /* focus rings (higher chroma) */

Semantic status tokens (equipment state — never color alone, pair with icon+label):

- `--color-ok` oklch(55% 0.15 150) / `--color-ok-bg` oklch(93% 0.03 150)
- `--color-busy` oklch(50% 0.19 25) / `--color-busy-bg` oklch(93% 0.02 25)
- `--color-maintenance` oklch(45% 0.02 194) / `--color-maintenance-bg` oklch(92% 0.01 194)

## Typography

- Display: **Geist**, weight 600–700, style normal
- Body:    **Geist**, weight 400 (500/600 for emphasis)
- Mono:    **Geist Mono**, weight 400–500 (outlier: serial numbers, stats, tabular data)
- Display tracking: `-0.02em`
- Type scale anchor: major third (1.25) from 16px; display `clamp(2rem, 4vw + 0.5rem, 3rem)`
- Rule: display and headings are always roman (`font-style: normal`)

## Spacing

4-point named scale (see `tokens.css`). Pages must use named tokens
(`var(--space-md)`), never raw values.

## Motion

- Easings: `--ease-out` cubic-bezier(0.16, 1, 0.3, 1) · `--ease-in`
  cubic-bezier(0.7, 0, 0.84, 0) · `--ease-in-out` cubic-bezier(0.65, 0, 0.35, 1)
- Durations: micro 120 ms · short 220 ms · long 420 ms (exits ≈ 75 % of enter)
- Reveal pattern: none on app pages (function carries the page). Single
  orchestrated drawer slide-in + backdrop fade; nothing else animates.
- Reduced-motion fallback: opacity-only crossfade ≤ 150 ms.

## Microinteractions stance

- Silent success — no celebratory toasts.
- Button press: scale/press via `transform: translateY(1px)` at 100 ms.
- Hover delays: n/a (no tooltips in shell).
- Focus: `:focus-visible` ring `var(--color-focus)`, instant, never animated.
- Toasts: only for failures (reservation 409/400/5xx), corner-stacked, no layout shift.

## CTA voice

- Primary: filled teal (`--color-primary-2` → hover `--color-primary-dark`),
  white text 600, radius `--radius-sm`, min-height 44 px.
- Secondary: ghost — transparent, 1 px rule border, dark-teal text.
- Labels are verbs: "Reservar", "Cancelar reserva", "Aplicar filtros".

## Per-page allowances

- App pages MUST NOT use enrichment — function carries the page.
- Content pages: typography only.

## What pages MUST share

- The LIS logo (circular, masked with `border-radius: 50%`) + wordmark "Equipos LIS".
- The accent colour and its placement (≤ 5 % per viewport).
- The display + body fonts.
- The CTA voice (button shape, radius, padding rhythm).
- The page-head pattern (h1 display + lede, stacked single column).

## What pages MAY differ on

- Component archetypes within the app family (cards vs. table vs. modal).
- Nothing else: theme, type, and CTA voice are locked.

## Exports

Drop-in formats for re-using this design system in other projects.
The canonical mapping lives in `.agents/skills/hallmark/references/export-formats.md`.

### tokens.css
```css
:root {
  --color-paper:      oklch(97.5% 0.008 194);
  --color-paper-2:    oklch(95%   0.010 194);
  --color-paper-3:    oklch(92.5% 0.012 194);
  --color-ink:        oklch(19%   0.018 194);
  --color-ink-2:      oklch(36%   0.020 194);
  --color-rule:       oklch(84%   0.012 194);
  --color-rule-2:     oklch(90%   0.012 194);
  --color-muted:      oklch(50%   0.020 194);
  --color-neutral:    oklch(44%   0.020 194);
  --color-primary:     oklch(52% 0.10 194);
  --color-primary-2:   oklch(48% 0.09 194);
  --color-primary-dark: oklch(44% 0.095 194);
  --color-primary-deep: oklch(39% 0.09 194);
  --color-secondary:  oklch(77% 0.050 194);
  --color-accent-ink: oklch(97.5% 0.008 194);
  --color-focus:      oklch(56% 0.16 194);

  --font-display: "Geist", "Segoe UI", system-ui, sans-serif;
  --font-body:    "Geist", "Segoe UI", system-ui, sans-serif;
  --font-mono:    "Geist Mono", ui-monospace, monospace;

  --space-3xs: 0.125rem;  --space-2xs: 0.25rem;  --space-xs: 0.5rem;
  --space-sm:  0.75rem;   --space-md:  1rem;     --space-lg: 1.5rem;
  --space-xl:  2.5rem;    --space-2xl: 4rem;     --space-3xl: 6rem;
  --space-4xl: 9rem;

  --text-xs: 0.75rem; --text-sm: 0.875rem; --text-base: 1rem;
  --text-md: 1.25rem; --text-lg: 1.5625rem; --text-xl: 1.9531rem;
  --text-2xl: 2.4414rem; --text-display: clamp(2rem, 4vw + 0.5rem, 3rem);

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:  cubic-bezier(0.7, 0, 0.84, 0);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-micro: 120ms; --dur-short: 220ms; --dur-long: 420ms;

  --radius-sm: 6px; --radius-md: 10px; --radius-pill: 999px;

  --z-base: 1; --z-raised: 10; --z-dropdown: 100; --z-sticky: 200;
  --z-modal: 400; --z-toast: 500; --z-tooltip: 600;

  --bp-sm: 40rem; --bp-md: 60rem; --bp-lg: 90rem;
}
```
