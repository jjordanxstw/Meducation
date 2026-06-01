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

Both apps share a single, owned, headless UI foundation: **Tailwind CSS + Radix UI primitives + shadcn-style components** (copied into each app's `components/ui`, built with `class-variance-authority` + `cn()` from `lib/utils`), with **lucide-react** icons. There is no third-party component library (no HeroUI, no Ant Design). Prefer the in-repo `components/ui` primitives and Tailwind utilities; only add a new primitive when one doesn't already exist.

- **web-client** (student portal): Next.js (App Router) + Tailwind + Radix. Interactive primitives carry `'use client'`. Data layer (untouched by UI work): TanStack Query (`hooks/`), Zustand (`stores/auth.store`), NextAuth, axios (`lib/api`). Calendar is a custom Tailwind grid in `components/CalendarSection.tsx` (no external calendar lib).
- **web-admin** (content management): Vite + **Refine.dev headless core** (`@refinedev/core` — data provider, auth provider, routing, resources, `mutationMode: 'undoable'`) — *not* `@refinedev/antd`. UI is Tailwind + Radix; **TanStack Table** (`components/ui/data-table.tsx`) is driven by Refine core's `useTable`; forms use **react-hook-form + zod** (`components/ui/form.tsx`); charts use **Recharts**; toasts use **sonner** (which also backs the custom Refine `notificationProvider` that preserves the 5s undo-delete UX). The app shell is `components/layout/AdminShell.tsx`, driven by Refine core's `useMenu`.
- **Shared tokens:** `@medical-portal/shared` (`HERO_TOKENS.light`, `HERO_BRAND`) is the single source of truth for colors; the brand accent is unified at `#2f80ed` across both apps. Both apps consume it via their Tailwind configs.

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
- **Two fonts only — no serif display face.** Both apps render a single sans family for everything. Page titles `text-3xl/4xl font-semibold tracking-tight`, slate-900; section headings `text-lg/2xl font-semibold tracking-tight`, slate-900. Weight and size carry the hierarchy, not a contrasting typeface. (`font-serif`/`font-display` classes still exist but are mapped to the same sans stack, so they're harmless no-ops.)
- Body text: `text-sm text-slate-600` (`var(--ink-2)`)
- Labels/captions: `text-xs text-slate-400` (`var(--ink-3)`)
- Fonts: **Lato** for all Latin text, **IBM Plex Sans Thai Looped** for Thai. Lato has no Thai glyphs, so Thai text falls through to IBM Plex Sans Thai Looped automatically in every context — no per-string tagging. web-client loads both via `next/font/google` (`--font-lato`, `--font-ibm-thai`); web-admin loads them via `@fontsource/lato` + `@fontsource/ibm-plex-sans-thai-looped`. `sans`/`serif`/`display`/`heading` in both Tailwind configs all resolve to the same Lato → IBM Plex Sans Thai Looped stack.

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
