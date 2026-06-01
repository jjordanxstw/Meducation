export type HeroThemeMode = 'light' | 'dark';

export type HeroThemeTokens = {
  bg: {
    canvas: string;
    canvasAlt: string;
    surface: string;
    surfaceElevated: string;
    muted: string;
    inverse: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
    link: string;
    linkHover: string;
  };
  border: {
    subtle: string;
    default: string;
    strong: string;
    focus: string;
  };
  brand: {
    primary: string;
    primaryHover: string;
    primaryActive: string;
    primarySubtle: string;
    primaryRing: string;
    foreground: string;
  };
  state: {
    success: { fg: string; bg: string; border: string };
    warning: { fg: string; bg: string; border: string };
    danger: { fg: string; bg: string; border: string };
    info: { fg: string; bg: string; border: string };
  };
  shadow: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    glow: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  admin: {
    siderBg: string;
    siderBgActive: string;
    headerBg: string;
    layoutBg: string;
  };
};

/**
 * Single brand accent for both apps — editorial light blue (CLAUDE.md `#2f80ed`).
 * This is the one source of truth; web-client and web-admin both derive from it.
 */
export const HERO_BRAND = {
  blue: {
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
  },
} as const;

export const HERO_EVENT_TYPES = {
  exam: '#ef4444',
  lecture: '#3b82f6',
  holiday: '#22c55e',
  event: '#a855f7',
} as const;

export const HERO_YEAR_ACCENTS = {
  1: '#fb923c',
  2: '#4ade80',
  3: '#60a5fa',
  4: '#c084fc',
} as const;

export const HERO_TOKENS: Record<HeroThemeMode, HeroThemeTokens> = {
  light: {
    bg: {
      canvas: '#f4f8ff',
      canvasAlt: '#e9f1ff',
      surface: '#ffffff',
      surfaceElevated: '#ffffff',
      muted: '#eef3fb',
      inverse: '#0f172a',
    },
    text: {
      primary: '#0f172a',
      secondary: '#334155',
      muted: '#64748b',
      inverse: '#f8fafc',
      link: '#2f80ed',
      linkHover: '#1b66cc',
    },
    border: {
      subtle: 'rgba(15, 23, 42, 0.08)',
      default: 'rgba(15, 23, 42, 0.14)',
      strong: 'rgba(15, 23, 42, 0.22)',
      focus: 'rgba(47, 128, 237, 0.34)',
    },
    brand: {
      primary: '#2f80ed',
      primaryHover: '#1b66cc',
      primaryActive: '#1857ad',
      primarySubtle: 'rgba(47, 128, 237, 0.12)',
      primaryRing: 'rgba(47, 128, 237, 0.36)',
      foreground: '#ffffff',
    },
    state: {
      success: { fg: '#15803d', bg: 'rgba(34, 197, 94, 0.14)', border: 'rgba(34, 197, 94, 0.24)' },
      warning: { fg: '#b45309', bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.24)' },
      danger: { fg: '#b91c1c', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.24)' },
      info: { fg: '#0369a1', bg: 'rgba(14, 165, 233, 0.14)', border: 'rgba(14, 165, 233, 0.24)' },
    },
    shadow: {
      sm: '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.06)',
      md: '0 6px 18px rgba(15, 23, 42, 0.10), 0 2px 4px rgba(15, 23, 42, 0.06)',
      lg: '0 14px 34px rgba(15, 23, 42, 0.14), 0 6px 10px rgba(15, 23, 42, 0.08)',
      xl: '0 22px 52px rgba(15, 23, 42, 0.18), 0 10px 18px rgba(15, 23, 42, 0.1)',
      glow: '0 0 0 1px rgba(47, 128, 237, 0.16), 0 10px 40px rgba(47, 128, 237, 0.18)',
    },
    radius: {
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.25rem',
      full: '9999px',
    },
    admin: {
      siderBg: '#ffffff',
      siderBgActive: 'rgba(47, 128, 237, 0.10)',
      headerBg: '#ffffff',
      layoutBg: '#f4f8ff',
    },
  },
  dark: {
    bg: {
      canvas: '#07101c',
      canvasAlt: '#0a1628',
      surface: '#0d1b2e',
      surfaceElevated: '#122842',
      muted: '#0a1628',
      inverse: '#f8fafc',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
      muted: '#64748b',
      inverse: '#0f172a',
      link: '#63b3ff',
      linkHover: '#93c5fd',
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.08)',
      default: 'rgba(148, 163, 184, 0.36)',
      strong: 'rgba(148, 163, 184, 0.52)',
      focus: 'rgba(99, 179, 255, 0.44)',
    },
    brand: {
      primary: '#0070F3',
      primaryHover: '#2e8fff',
      primaryActive: '#63b3ff',
      primarySubtle: 'rgba(0, 112, 243, 0.22)',
      primaryRing: 'rgba(99, 179, 255, 0.45)',
      foreground: '#ffffff',
    },
    state: {
      success: { fg: '#86efac', bg: 'rgba(22, 163, 74, 0.24)', border: 'rgba(74, 222, 128, 0.36)' },
      warning: { fg: '#fcd34d', bg: 'rgba(217, 119, 6, 0.25)', border: 'rgba(252, 211, 77, 0.36)' },
      danger: { fg: '#fca5a5', bg: 'rgba(220, 38, 38, 0.24)', border: 'rgba(252, 165, 165, 0.34)' },
      info: { fg: '#93c5fd', bg: 'rgba(14, 116, 233, 0.24)', border: 'rgba(147, 197, 253, 0.34)' },
    },
    shadow: {
      sm: '0 1px 3px rgba(3, 8, 18, 0.46), 0 1px 2px rgba(3, 8, 18, 0.34)',
      md: '0 8px 20px rgba(3, 8, 18, 0.52), 0 2px 6px rgba(3, 8, 18, 0.34)',
      lg: '0 16px 34px rgba(3, 8, 18, 0.62), 0 6px 12px rgba(3, 8, 18, 0.42)',
      xl: '0 26px 58px rgba(3, 8, 18, 0.72), 0 10px 20px rgba(3, 8, 18, 0.5)',
      glow: '0 0 0 1px rgba(99, 179, 255, 0.34), 0 18px 48px rgba(0, 112, 243, 0.24)',
    },
    radius: {
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.25rem',
      full: '9999px',
    },
    admin: {
      siderBg: '#0d1b2e',
      siderBgActive: 'rgba(99, 179, 255, 0.25)',
      headerBg: '#122842',
      layoutBg: '#07101c',
    },
  },
};
