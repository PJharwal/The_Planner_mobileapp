// Calm Growth / Focused Student Theme
// Optimized for night study, exam prep, and long sessions

export const colors = {
    // Background colors
    background: '#0F172A',  // Deep slate / blue-black
    card: '#111827',        // Card background
    cardBorder: '#1E293B',  // Subtle card border

    // Primary - Calm Sky Blue
    primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',  // Main primary
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
    },

    // Accent - Purple (for streaks, special features)
    accent: {
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
    },

    // Status colors
    success: '#22C55E',
    warning: '#FACC15',
    error: '#EF4444',
    info: '#38BDF8',

    // Text colors
    text: {
        primary: '#E5E7EB',
        secondary: '#D1D5DB',
        muted: '#9CA3AF',
        disabled: '#6B7280',
    },

    // Dark palette for UI elements
    dark: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        950: '#020617',
    },

    // Common
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',

    // Priority colors
    priority: {
        high: '#EF4444',
        highBg: 'rgba(239, 68, 68, 0.15)',
        medium: '#FACC15',
        mediumBg: 'rgba(250, 204, 21, 0.15)',
        low: '#22C55E',
        lowBg: 'rgba(34, 197, 94, 0.15)',
    },
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,  // rounded-2xl equivalent
    full: 9999,
};

export const fontSize = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 48,
};

export const fontWeight = {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
};

// Shadows - soft, no harsh edges
export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
};
