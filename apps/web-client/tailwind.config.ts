import type { Config } from 'tailwindcss';
import { nextui } from '@nextui-org/react';
import { HERO_BRAND, HERO_TOKENS } from '@medical-portal/shared';

const light = HERO_TOKENS.light;
const dark = HERO_TOKENS.dark;

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
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
        brand: light.brand.primary,
        'brand-hover': light.brand.primaryHover,
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
        success: light.state.success.fg,
        warning: light.state.warning.fg,
        danger: light.state.danger.fg,
        info: light.state.info.fg,
      },
      fontFamily: {
        // Latin first, Thai (Sarabun) as automatic fallback for Thai glyphs.
        heading: ['var(--font-noto-sans)', 'var(--font-sarabun)', 'Noto Sans', 'Sarabun', 'sans-serif'],
        body: ['var(--font-noto-sans)', 'var(--font-sarabun)', 'Noto Sans', 'Sarabun', 'sans-serif'],
        sans: ['var(--font-noto-sans)', 'var(--font-sarabun)', 'Noto Sans', 'Sarabun', 'sans-serif'],
        thai: ['var(--font-sarabun)', 'Sarabun', 'sans-serif'],
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
        'fade-in-up': 'fade-in-up 0.35s ease-out both',
        'underline-in': 'underline-in 0.3s ease-out both',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'underline-in': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
    },
  },
  safelist: ['scrollbar-hide'],
  darkMode: 'class',
  plugins: [
    nextui({
      themes: {
        light: {
          colors: {
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
        },
        dark: {
          colors: {
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
              foreground: dark.brand.foreground,
            },
          },
        },
      },
    }),
  ],
};

export default config;
