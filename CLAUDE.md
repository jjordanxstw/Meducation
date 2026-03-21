# Project Guidelines

## Design Context

### Users

Medical students accessing their learning materials, lectures, and academic calendar. They use the portal during focused study sessions, often for extended periods, navigating between subjects, video lectures, and event schedules. The interface should support concentration without visual fatigue.

### Brand Personality

**Modern, Clean, Innovative**

The portal should feel like a premium, production-grade experience — not a generic learning management system. Think clinical precision meets cutting-edge technology. Professional but not cold, sophisticated but not pretentious.

### Aesthetic Direction

**Reference:** Vercel, Linear — ultra-clean dark UI with subtle animations, glass effects, and purposeful visual hierarchy.

**Visual Tone:**
- Dark-first design with deep navy backgrounds (#0d1b2e, #0a1628, #07131f)
- Primary accent: #0070F3 (Vercel blue) used sparingly for emphasis
- Glass morphism with subtle blur, transparency, and soft borders
- Gradient orbs for atmospheric depth without distraction
- Typography: Kanit for headings (bold, modern), Prompt for body (readable, clean)

**Anti-References:**
- ❌ Generic AI-generated aesthetics (template-y, lacking intentional design)
- ❌ Cluttered or overwhelming interfaces
- ❌ Dated enterprise admin panel aesthetics
- ❌ Excessive gamification or childish elements

### Design Principles

1. **Calm Over Chaos** — Reduce visual noise. Every element should earn its place. Use whitespace intentionally to create breathing room and support focus.

2. **Dark With Purpose** — The dark theme isn't just aesthetic; it reduces eye strain during long study sessions. Ensure sufficient contrast for readability while maintaining the moody atmosphere.

3. **Subtle, Not Boring** — Micro-interactions, gentle hover states, and smooth transitions add polish without distraction. The interface should feel alive but not animated for animation's sake.

4. **Content-First Hierarchy** — Students are here to learn. Navigation and chrome should recede; content (lectures, subjects, schedules) should command attention.

5. **Production-Grade Polish** — No placeholder vibes, no half-implemented states. Every empty state, loading skeleton, and error message should feel intentional and designed.

### Component Patterns

#### Cards
- Glass surfaces with subtle backgrounds (`bg-white/5`, `bg-[var(--surface-0)]`)
- Soft borders (`border-white/10`, `border-white/[0.08]`)
- Colored accent bars for visual differentiation (4px gradient tops)
- Smooth hover transitions with subtle scale/shadow changes

#### Floating UI (Dropdowns, Modals, Sheets)
- **SOLID backgrounds only** — Never transparent (`bg-[#0d1b2e]`, `bg-[#0a1628]`)
- Strong shadows for depth (`shadow-2xl shadow-black/80`)
- Clear borders (`border-white/10`)
- Dark scrim overlays for modals (`bg-black/40 backdrop-blur-sm`)

#### Typography Scale
- Page titles: `text-2xl font-bold` (Kanit)
- Section headings: `text-lg font-semibold` (Kanit)
- Body text: `text-sm text-white/70` (Prompt)
- Labels/captions: `text-xs text-white/50`

#### Color Usage
- Primary blue (#0070F3): Active states, CTAs, links, emphasis
- White opacity hierarchy: 100% → 80% → 70% → 50% → 30% for text/elements
- Subject accent colors: Blue, Purple, Emerald, Amber, Rose gradients
- Status colors: Red (danger/errors), Amber (warnings/coming-soon), Green (success)

#### Empty States
- 48px icon at 40% opacity, centered
- Friendly heading (`text-lg font-semibold text-white/80`)
- Helpful subtext (`text-sm text-white/50`)
- Optional CTA as ghost button

#### Mobile Considerations
- Collapsed navigation in drawer (< md breakpoint)
- Stacked layouts on narrow screens
- Touch-friendly tap targets (min 44px)
- Solid backgrounds on all mobile overlays
