import type { Config } from 'tailwindcss';
import { nextui } from '@nextui-org/react';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
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
          foreground: '#FFFFFF',
        },
      },
      fontFamily: {
        heading: ['Kanit', 'sans-serif'],
        body: ['Prompt', 'sans-serif'],
        sans: ['Prompt', 'sans-serif'],
      },
    },
  },
  darkMode: 'class',
  plugins: [
    nextui({
      themes: {
        light: {
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
              foreground: '#FFFFFF',
            },
          },
        },
      },
    }),
  ],
};

export default config;
