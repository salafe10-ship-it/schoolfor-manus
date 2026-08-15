/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EnterpriseThemeMode = 'light' | 'dark' | 'copper' | 'golden';

export interface DesignTokens {
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    background: string;
    surface: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
  };
  typography: {
    fontFamily: string;
    scale: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
  };
  spacing: {
    tight: string;
    normal: string;
    relaxed: string;
    loose: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    enterprise: string;
  };
}

export const EnterpriseThemes: Record<EnterpriseThemeMode, DesignTokens> = {
  light: {
    colors: {
      primary: '#4f46e5', // Indigo 600
      primaryHover: '#4338ca',
      secondary: '#64748b',
      background: '#f8fafc',
      surface: '#ffffff',
      border: '#e2e8f0',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      accent: '#0ea5e9',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
    typography: {
      fontFamily: 'Cairo, Inter, sans-serif',
      scale: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem' }
    },
    spacing: { tight: '0.5rem', normal: '1rem', relaxed: '1.5rem', loose: '2rem' },
    borderRadius: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
    shadows: { sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', enterprise: '0 10px 25px -5px rgba(79, 70, 229, 0.1)' }
  },
  dark: {
    colors: {
      primary: '#6366f1',
      primaryHover: '#818cf8',
      secondary: '#94a3b8',
      background: '#0f172a',
      surface: '#1e293b',
      border: '#334155',
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      accent: '#38bdf8',
      success: '#34d399',
      warning: '#fbbf24',
      danger: '#f87171',
    },
    typography: {
      fontFamily: 'Cairo, Inter, sans-serif',
      scale: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem' }
    },
    spacing: { tight: '0.5rem', normal: '1rem', relaxed: '1.5rem', loose: '2rem' },
    borderRadius: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
    shadows: { sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)', md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)', lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', enterprise: '0 10px 25px -5px rgba(99, 102, 241, 0.2)' }
  },
  copper: {
    colors: {
      primary: '#b45309', // Copper / Amber 700
      primaryHover: '#92400e',
      secondary: '#78350f',
      background: '#fffbeb',
      surface: '#ffffff',
      border: '#fde68a',
      textPrimary: '#451a03',
      textSecondary: '#78350f',
      accent: '#d97706',
      success: '#059669',
      warning: '#d97706',
      danger: '#dc2626',
    },
    typography: {
      fontFamily: 'Cairo, Inter, sans-serif',
      scale: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem' }
    },
    spacing: { tight: '0.5rem', normal: '1rem', relaxed: '1.5rem', loose: '2rem' },
    borderRadius: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
    shadows: { sm: '0 1px 2px 0 rgba(180, 83, 9, 0.05)', md: '0 4px 6px -1px rgba(180, 83, 9, 0.1)', lg: '0 10px 15px -3px rgba(180, 83, 9, 0.1)', enterprise: '0 10px 25px -5px rgba(180, 83, 9, 0.15)' }
  },
  golden: {
    colors: {
      primary: '#d97706', // Golden Amber 600
      primaryHover: '#b45309',
      secondary: '#92400e',
      background: '#fef3c7',
      surface: '#ffffff',
      border: '#fcd34d',
      textPrimary: '#78350f',
      textSecondary: '#92400e',
      accent: '#f59e0b',
      success: '#10b981',
      warning: '#d97706',
      danger: '#ef4444',
    },
    typography: {
      fontFamily: 'Cairo, Inter, sans-serif',
      scale: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem' }
    },
    spacing: { tight: '0.5rem', normal: '1rem', relaxed: '1.5rem', loose: '2rem' },
    borderRadius: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
    shadows: { sm: '0 1px 2px 0 rgba(217, 119, 6, 0.05)', md: '0 4px 6px -1px rgba(217, 119, 6, 0.1)', lg: '0 10px 15px -3px rgba(217, 119, 6, 0.1)', enterprise: '0 10px 25px -5px rgba(217, 119, 6, 0.2)' }
  }
};
