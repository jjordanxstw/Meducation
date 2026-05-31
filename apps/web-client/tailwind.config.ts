import type { Config } from 'tailwindcss';
import { heroui } from '@heroui/react';
import { HERO_TOKENS } from '@medical-portal/shared';

const light = HERO_TOKENS.light;

/**
 * Editorial light-blue accent — web-client local. We intentionally do NOT edit
 * `@medical-portal/shared` here so web-admin keeps its current palette; this is
 * the single source of truth for the student portal's blue.
 */
const BRAND = {
  50: '#eef5ff',
  100: '#d9e8ff',
  200: '#bcd6ff',
  300: '#8fbbff',
  400: '#5e97f7',
  500: '#2f80ed',
  600: '#1b66cc',
  700: '#1857ad',
  800: '#194a8c',
  900: '#1a3f73',
} as const;

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
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
        brand: BRAND[500],
        'brand-hover': BRAND[600],
        'brand-subtle': 'var(--brand-weak)',
        primary: {
          ...BRAND,
          DEFAULT: BRAND[500],
          foreground: '#ffffff',
        },
        success: light.state.success.fg,
        warning: light.state.warning.fg,
        danger: light.state.danger.fg,
        info: light.state.info.fg,
      },
      fontFamily: {
        // Body / UI — Latin in Noto Sans, Thai falls through to Noto Serif Thai.
        sans: ['var(--font-noto-sans)', 'var(--font-noto-serif-thai)', 'Noto Sans', 'sans-serif'],
        body: ['var(--font-noto-sans)', 'var(--font-noto-serif-thai)', 'Noto Sans', 'sans-serif'],
        // Display — Latin in Noto Serif, Thai in Noto Serif Thai.
        serif: ['var(--font-noto-serif)', 'var(--font-noto-serif-thai)', 'Georgia', 'serif'],
        display: ['var(--font-noto-serif)', 'var(--font-noto-serif-thai)', 'Georgia', 'serif'],
        heading: ['var(--font-noto-serif)', 'var(--font-noto-serif-thai)', 'Georgia', 'serif'],
      },
      boxShadow: {
        subtle: 'var(--shadow-subtle)',
        soft: 'var(--shadow-md)',
        lift: 'var(--shadow-lg)',
      },
      animation: {
        marquee: 'marquee 38s linear infinite',
        'fade-in-up': 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'underline-in': 'underline-in 0.3s ease-out both',
        float: 'float 7s ease-in-out infinite',
        'top-loading': 'top-loading 1s linear infinite',
        watermark: 'watermark 30s ease-in-out infinite',
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
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'underline-in': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-22px)' },
        },
        'top-loading': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        watermark: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(-15deg)' },
          '25%': { transform: 'translate(5%, 3%) rotate(-12deg)' },
          '50%': { transform: 'translate(10%, 0) rotate(-18deg)' },
          '75%': { transform: 'translate(5%, -3%) rotate(-12deg)' },
        },
      },
    },
  },
  safelist: ['scrollbar-hide'],
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              ...BRAND,
              DEFAULT: BRAND[500],
              foreground: '#ffffff',
            },
          },
        },
      },
    }),
  ],
};

export default config;
