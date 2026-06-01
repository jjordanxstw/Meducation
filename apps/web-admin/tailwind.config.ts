import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';
import { HERO_BRAND, HERO_TOKENS } from '@medical-portal/shared';

const light = HERO_TOKENS.light;
const BRAND = HERO_BRAND.blue;

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: light.bg.surface,
        'surface-elevated': light.bg.surfaceElevated,
        canvas: light.bg.canvas,
        muted: light.bg.muted,
        'ink-1': light.text.primary,
        'ink-2': light.text.secondary,
        'ink-3': light.text.muted,
        'border-subtle': light.border.subtle,
        'border-default': light.border.default,
        // Single brand accent — unified with web-client via shared tokens.
        brand: BRAND[500],
        'brand-hover': BRAND[600],
        'brand-subtle': light.brand.primarySubtle,
        primary: {
          ...BRAND,
          DEFAULT: BRAND[500],
          foreground: light.brand.foreground,
        },
        success: light.state.success.fg,
        warning: light.state.warning.fg,
        danger: light.state.danger.fg,
        info: light.state.info.fg,
      },
      fontFamily: {
        // Two-font system: Lato (Latin) with IBM Plex Sans Thai Looped for Thai.
        // serif/display/heading intentionally resolve to the same stack so no
        // element renders a different face.
        sans: ['Lato', 'IBM Plex Sans Thai Looped', 'system-ui', 'sans-serif'],
        body: ['Lato', 'IBM Plex Sans Thai Looped', 'system-ui', 'sans-serif'],
        serif: ['Lato', 'IBM Plex Sans Thai Looped', 'system-ui', 'sans-serif'],
        display: ['Lato', 'IBM Plex Sans Thai Looped', 'system-ui', 'sans-serif'],
        heading: ['Lato', 'IBM Plex Sans Thai Looped', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        subtle: light.shadow.sm,
        soft: light.shadow.md,
        lift: light.shadow.lg,
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
