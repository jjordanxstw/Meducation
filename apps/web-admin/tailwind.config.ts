import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef1f6',
          100: '#dce3ec',
          200: '#b9c6d9',
          300: '#95aac6',
          400: '#708db2',
          500: '#1b2d48',
          600: '#16253b',
          700: '#111d2f',
          800: '#0b1522',
          900: '#050d15',
          DEFAULT: '#1b2d48',
          dark: '#142238',
          light: '#708db2',
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
