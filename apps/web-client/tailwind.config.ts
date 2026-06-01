import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';
import { HERO_BRAND, HERO_TOKENS } from '@medical-portal/shared';

const light = HERO_TOKENS.light;

/** Editorial light-blue accent — single source of truth lives in @medical-portal/shared. */
const BRAND = HERO_BRAND.blue;

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
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
        // Two-font system: Lato (Latin) with IBM Plex Sans Thai Looped for Thai.
        // serif/display/heading share the same stack so no element renders a
        // different face.
        sans: ['var(--font-lato)', 'var(--font-ibm-thai)', 'Lato', 'sans-serif'],
        body: ['var(--font-lato)', 'var(--font-ibm-thai)', 'Lato', 'sans-serif'],
        serif: ['var(--font-lato)', 'var(--font-ibm-thai)', 'Lato', 'sans-serif'],
        display: ['var(--font-lato)', 'var(--font-ibm-thai)', 'Lato', 'sans-serif'],
        heading: ['var(--font-lato)', 'var(--font-ibm-thai)', 'Lato', 'sans-serif'],
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
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
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
  plugins: [tailwindcssAnimate],
};

export default config;
