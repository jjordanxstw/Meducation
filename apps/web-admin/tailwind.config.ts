import type { Config } from 'tailwindcss';
import { HERO_BRAND, HERO_TOKENS } from '@medical-portal/shared';

const light = HERO_TOKENS.light;

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: light.bg.surface,
        'surface-elevated': light.bg.surfaceElevated,
        muted: light.bg.muted,
        'ink-1': light.text.primary,
        'ink-2': light.text.secondary,
        'ink-3': light.text.muted,
        'border-subtle': light.border.subtle,
        'border-default': light.border.default,
        // web-admin uses a dark-blue brand accent (shared tokens stay light for web-client).
        brand: '#1d4ed8',
        'brand-hover': '#1e40af',
        'brand-subtle': light.brand.primarySubtle,
        primary: {
          50: HERO_BRAND.blue[50],
          100: HERO_BRAND.blue[100],
          200: HERO_BRAND.blue[200],
          300: HERO_BRAND.blue[300],
          400: HERO_BRAND.blue[400],
          500: HERO_BRAND.blue[500],
          600: HERO_BRAND.blue[600],
          700: HERO_BRAND.blue[700],
          800: HERO_BRAND.blue[800],
          900: HERO_BRAND.blue[900],
          DEFAULT: HERO_BRAND.blue[500],
          foreground: light.brand.foreground,
        },
      },
      fontFamily: {
        kanit: ['var(--font-kanit)'],
        prompt: ['var(--font-prompt)'],
        heading: ['var(--font-kanit)'],
        body: ['var(--font-prompt)'],
        sans: ['var(--font-prompt)'],
      },
      backgroundImage: {
        'radial-gradient': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};

export default config;
