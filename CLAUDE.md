# Project Guidelines

## Design Context

### Users

Medical students accessing their learning materials, lectures, and academic calendar. They use the portal during focused study sessions, often for extended periods, navigating between subjects, video lectures, and event schedules. The interface should support concentration without visual fatigue.

### Language

**English only.** Neither app ships localization (i18n) or a language switcher. All UI copy is authored as plain English literals in the components.

### Brand Personality

**Modern, Clean, Innovative**

The portal should feel like a premium, production-grade experience — not a generic learning management system. Think clinical precision meets cutting-edge technology. Professional but not cold, sophisticated but not pretentious.

### Aesthetic Direction

**Reference:** Vercel, Linear — ultra-clean light UI with subtle depth, soft shadows, and purposeful visual hierarchy.

**Visual Tone:**
- Light-first design: a faint blue-tinted canvas (`#f4f8ff`) with white surfaces/cards
- Single light-blue + white theme. **No dark mode**, no theme toggle.
- Primary accent: light blue `#2f80ed` (hover `#1b66cc`), used for CTAs, links, and active states
- Soft borders (slate at low opacity) and gentle shadows for depth — no heavy black shadows
- Generous whitespace; content over chrome

**Anti-References:**
- ❌ Generic AI-generated aesthetics (template-y, lacking intentional design)
- ❌ Cluttered or overwhelming interfaces
- ❌ Dark navy backgrounds, white-on-dark text, glass-morphism over dark surfaces
- ❌ Dated enterprise admin panel aesthetics
- ❌ Excessive gamification or childish elements

### Tech Stack

- **web-client** (student portal): Next.js (App Router) + **HeroUI** (`@heroui/react`, the renamed NextUI) + Tailwind CSS. Prefer HeroUI components and Tailwind utilities; write custom CSS only when necessary. Ant Design is used only for the calendar grid.
- **web-admin** (content management): Vite + **Refine.dev** (`@refinedev/antd`) + Ant Design. Keep it lightweight, clean, and consistent with the same light-blue palette.
- **Shared tokens:** `@medical-portal/shared` (`HERO_TOKENS.light`, `HERO_BRAND`) is the single source of truth for colors. Both apps consume it (Tailwind config + Ant Design `ConfigProvider`).

### Design Principles

1. **Calm Over Chaos** — Reduce visual noise. Every element should earn its place. Use whitespace intentionally to create breathing room and support focus.

2. **Light & Legible** — High contrast slate text on white/near-white surfaces. Color is used sparingly and purposefully, never for decoration alone.

3. **Subtle, Not Boring** — Micro-interactions, gentle hover states, and smooth transitions add polish without distraction. The interface should feel alive but not animated for animation's sake.

4. **Content-First Hierarchy** — Students are here to learn. Navigation and chrome should recede; content (lectures, subjects, schedules) should command attention.

5. **Production-Grade Polish** — No placeholder vibes, no half-implemented states. Every empty state, loading skeleton, and error message should feel intentional and designed.

6. **Lightweight** — Favor fewer dependencies and less custom CSS. Reach for the component library and utility classes before hand-rolling styles.

### Component Patterns

#### Cards
- White surfaces (`bg-white`, `bg-[var(--bg-surface)]`)
- Soft slate borders (`border-slate-200`, `border-[var(--border-subtle)]`)
- Subtle shadows (`shadow-subtle` / `shadow-soft`); lift gently on hover (`-translate-y-1` + brand border)
- Hairline borders (`border-slate-200/70`); **no gradient accent bars** — differentiation comes from a single restrained brand accent and editorial typography

#### Floating UI (Dropdowns, Modals, Sheets)
- **Solid white/elevated surfaces** (`bg-[var(--bg-surface-elevated)]`)
- Clear slate borders (`border-slate-200`)
- Soft shadows for depth (`--shadow-lg`)
- Light scrim overlays for modals (`bg-slate-900/20 backdrop-blur-sm`)

#### Typography Scale
- **Editorial serif display for headings.** Page titles `font-serif text-3xl/4xl font-semibold tracking-tight`, slate-900; section headings `font-serif text-lg/2xl font-semibold tracking-tight`, slate-900
- Body text: `text-sm text-slate-600` (`var(--ink-2)`) — sans
- Labels/captions: `text-xs text-slate-400` (`var(--ink-3)`)
- Fonts (web-client, via `next/font`): **Noto Serif** for display/headings (`font-serif`), **Noto Sans** for body/UI (`font-sans`), **Noto Serif Thai** for Thai content. The Latin faces have no Thai glyphs, so Thai text falls through to Noto Serif Thai automatically in every context — no per-string tagging. web-admin still uses `@fontsource/noto-sans`.

#### Color Usage
- Primary blue (`#2f80ed`): Active states, CTAs, links, emphasis
- Slate text ramp: `slate-900` → `slate-600` → `slate-400` for primary/secondary/muted
- **Single brand accent** (`brand` / `brand-subtle`) — no multi-color/rainbow card bars
- Status colors: Red (danger/errors), Amber (warnings/coming-soon), Green (success); calendar event types (exam=red, lecture=blue, holiday=green, event=purple) are kept only where the color carries meaning

#### Empty States
- 48px icon at ~35% opacity in the brand blue or slate, centered
- Friendly heading (`text-lg font-semibold`, slate-900)
- Helpful subtext (`text-sm text-slate-500`)
- Optional CTA as a subtle bordered button

#### App Shell
- **Desktop (≥ lg):** fixed left **sidebar** (brand wordmark, primary nav, bottom user block) + slim sticky top bar with search; content in a centered `max-w-6xl` column
- **Mobile/tablet (< lg):** top bar (menu + brand + avatar) opens a slide-over **drawer**; persistent **bottom nav** for primary destinations

#### Mobile Considerations
- Collapsed navigation in a slide-over drawer (< lg breakpoint) + bottom nav bar
- Stacked layouts on narrow screens
- Touch-friendly tap targets (min 44px)
- Solid white surfaces on all mobile overlays
