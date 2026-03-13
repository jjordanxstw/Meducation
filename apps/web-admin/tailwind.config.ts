import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0070F3',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#1e3a8a',
          DEFAULT: '#0070F3',
          dark: '#1d4ed8',
          light: '#3b82f6',
          foreground: '#FFFFFF',
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
