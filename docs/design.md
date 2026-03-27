# ccwrapped Design System

## Overview

ccwrapped uses [shadcn/ui](https://ui.shadcn.com) (New York style) on top of Tailwind CSS 4 with the `@theme` directive for token mapping.

## Color Palette

### Base: Zinc

Neutral grays with a cool tone. Used for backgrounds, surfaces, borders, and muted text.

| Token              | Dark Mode   | Purpose                |
| ------------------ | ----------- | ---------------------- |
| `background`       | zinc-950    | Page background        |
| `foreground`       | zinc-50     | Primary text           |
| `card`             | zinc-900    | Card/surface           |
| `card-foreground`  | zinc-50     | Text on cards          |
| `secondary`        | zinc-800    | Secondary buttons      |
| `muted`            | zinc-800    | Muted backgrounds      |
| `muted-foreground` | zinc-400    | Muted/secondary text   |
| `border`           | zinc-800    | Borders and dividers   |
| `input`            | zinc-800    | Input field borders    |

### Accent: Claude Terracotta

The primary accent color is Claude's brand terracotta (`#da7756`), used for primary actions, links, focus rings, and brand identity.

| Token                | Value       | Purpose                |
| -------------------- | ----------- | ---------------------- |
| `primary`            | `#da7756`   | Primary buttons, CTAs  |
| `primary-foreground` | white       | Text on primary        |
| `ring`               | `#da7756`   | Focus rings            |

### Semantic

| Token                      | Value   | Purpose          |
| -------------------------- | ------- | ---------------- |
| `destructive`              | red-600 | Destructive acts |
| `destructive-foreground`   | white   | Text on red      |

## Typography

- **Font:** Inter (Google Fonts, `next/font`)
- **Scale:** Tailwind defaults (`text-sm` through `text-6xl`)
- **Numeric data:** `tabular-nums` for alignment in tables and stats

## Component Library

shadcn/ui New York style. Components live in `apps/web/components/ui/`.

Installed components:
- `Button` — primary, secondary, destructive, ghost, outline, link variants
- `Card` — Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription
- `Badge` — default, secondary, destructive, outline variants
- `Tabs` — TabsList, TabsTrigger, TabsContent

## Token Usage

All colors are defined as CSS custom properties via Tailwind 4's `@theme` directive in `globals.css`. This generates native Tailwind utility classes:

```
bg-background    text-foreground       border-border
bg-card          text-card-foreground  border-input
bg-primary       text-primary          ring-ring
bg-muted         text-muted-foreground
bg-secondary     text-secondary-foreground
bg-destructive   text-destructive
```

## Class Merging

Use the `cn()` utility (`lib/utils.ts`) for conditional and overridable class names:

```tsx
import { cn } from '@/lib/utils';

<div className={cn("bg-card rounded-lg", isActive && "ring-2 ring-ring", className)} />
```

## Dark-First

Dark mode is the default. Light mode support is planned via `data-theme` attribute and CSS overrides.
