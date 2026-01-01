// Calm Pastel Soft-UI Theme
// Optimized for student productivity with gentle, distraction-free aesthetics
// Color palette from user-provided reference

import { Platform, TextStyle } from 'react-native';

// ============================================
// PRIMARY PASTEL PALETTE
// ============================================
export const pastel = {
    peach: '#F7CBC9',      // Peach Soft - Primary accent, warm elements
    beige: '#E9DDD8',      // Warm Beige - Secondary surfaces
    white: '#F7F7F7',      // Cloud White - App background
    mistBlue: '#D5E5E5',   // Mist Blue - Cards, cool surfaces
    mint: '#C9DDDC',       // Pale Mint - Success, highlights, CTAs
    slate: '#5D6B6B',      // Slate Green - Primary text, icons
};

// ============================================
// SEMANTIC COLORS (Muted, never harsh)
// ============================================
export const semantic = {
    success: '#8DD7D8',           // Soft mint (from palette)
    successLight: '#C9ECEC',      // Lighter mint for backgrounds
    warning: '#E8C9A0',           // Warm pastel orange
    warningLight: '#F5E6D3',      // Light warning background
    error: '#E8A0A0',             // Muted coral (not harsh red)
    errorLight: '#F5D5D5',        // Light error background
    info: '#A0C4E8',              // Soft blue
    infoLight: '#D5E5F5',         // Light info background
};

// ============================================
// PRIORITY COLORS (Soft versions)
// ============================================
export const priority = {
    high: '#E8A0A0',              // Muted coral
    highBg: 'rgba(232, 160, 160, 0.15)',
    medium: '#E8C9A0',            // Warm pastel orange
    mediumBg: 'rgba(232, 201, 160, 0.15)',
    low: '#8DD7D8',               // Soft mint
    lowBg: 'rgba(141, 215, 216, 0.15)',
};

// ============================================
// TEXT COLORS
// ============================================
export const text = {
    primary: '#5D6B6B',           // Deep slate - main text
    secondary: 'rgba(93, 107, 107, 0.7)',  // 70% opacity
    muted: 'rgba(93, 107, 107, 0.5)',      // 50% opacity
    disabled: 'rgba(93, 107, 107, 0.35)',  // 35% opacity
    inverse: '#F1F7F7',           // Light text on dark backgrounds
};

// ============================================
// BACKGROUND & SURFACE COLORS
// ============================================
export const background = {
    primary: '#F1F7F7',           // Main app background (cloud white)
    secondary: '#E8F0F0',         // Slightly darker for sections
    card: '#FFFFFF',              // Pure white-ish card base
    cardAlt: '#F7CBCA',           // Peach card variant
    cardMint: '#D5E6E5',          // Mist blue card variant
    overlay: 'rgba(93, 107, 107, 0.4)',  // Modal overlay
};

// ============================================
// FOCUS MODE (Darker pastels for reduced eye strain)
// ============================================
export const focus = {
    background: '#E5ECEC',        // Darker pastel for reduced eye strain
    card: '#DDE6E6',              // Slightly darker cards
    accent: '#C9DDDC',            // Pale mint accent
    text: '#5D6B6B',              // Slate text
};

// ============================================
// SPACING SCALE (Generous, breathable)
// ============================================
export const spacing = {
    xs: 8,     // XS
    sm: 12,    // SM
    md: 16,    // MD
    lg: 24,    // LG
    xl: 32,    // XL
};

// ============================================
// BORDER RADIUS (Soft, rounded everything)
// ============================================
export const borderRadius = {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 28,
    pill: 9999,
};

// ============================================
// GRADIENT PRESETS (for LinearGradient)
// ============================================
export const gradients = {
    // Warm beige gradient (default cards)
    warm: ['#EDE2DD', '#E9DDD8'] as const,
    // Sage mint gradient (success, timer)
    mint: ['#D3E3E2', '#C9DDDC'] as const,
    // Soft peach gradient (streak, alerts)
    peach: ['#F9D5D3', '#F7CBC9'] as const,
    // Light sage (buttons, focus)
    sage: ['#DDEAEA', '#D5E5E5'] as const,
    // Glass/frosted effect
    glass: ['rgba(247, 247, 247, 0.6)', 'rgba(247, 247, 247, 0.4)'] as const,
    // App background
    background: ['#F9F9F9', '#F7F7F7'] as const,
};

// ============================================
// DARK MODE COLORS (Premium Study System)
// ============================================
// Philosophy: Calm, premium, discipline-focused
// Designed for hours of continuous usage
// No visual noise, no gamified chaos
// ============================================
export const darkMode = {
    // BACKGROUND SYSTEM - Soft charcoal gradient, never pure black
    background: {
        // Gradient colors (top to bottom)
        gradientTop: '#0E1113',
        gradientMiddle: '#0C0F11',
        gradientBottom: '#0A0D0F',
        // Solid fallbacks
        primary: '#0C0F11',              // App root background
        secondary: 'rgba(255,255,255,0.06)', // Default card surface
        card: 'rgba(255,255,255,0.06)',  // Card container
        elevated: '#1B1E24',             // Sheets, Modals
        cardAlt: '#1B1E24',              // Elevated alternative
        cardMint: 'rgba(201,221,220,0.18)', // Mint tinted (16-20%)
        cardPeach: 'rgba(247,203,201,0.18)', // Peach tinted
        cardMist: 'rgba(213,229,229,0.18)', // Mist Blue tinted
        cardBeige: 'rgba(233,221,216,0.16)', // Beige tinted
        overlay: 'rgba(0, 0, 0, 0.5)',   // Modal dim background
        divider: 'rgba(255, 255, 255, 0.08)', // Divider lines
    },
    // TEXT COLORS - No pure white
    text: {
        primary: 'rgba(255, 255, 255, 0.92)',   // Most content
        secondary: 'rgba(255, 255, 255, 0.65)', // Descriptions, subtitles
        muted: 'rgba(255, 255, 255, 0.40)',     // Dates, labels, hints
        disabled: 'rgba(255, 255, 255, 0.25)', // Disabled, inactive
        inverse: '#0C0F11',                     // Dark text on light bg
    },
    // PASTEL TINTS - Used at 16-20% opacity only
    pastel: {
        mint: '#C9DDDC',              // Focus / Success / Primary CTA
        peach: '#F7CBC9',             // Warnings / Burnout / Alerts
        mistBlue: '#D5E5E5',          // Information / Neutral
        beige: '#E9DDD8',             // Secondary highlights
        white: 'rgba(255,255,255,0.06)', // Maps to card bg
        slate: 'rgba(255, 255, 255, 0.65)', // Secondary text
    },
    // PASTEL TINT BACKGROUNDS (16-20% opacity)
    tints: {
        mint: 'rgba(201,221,220,0.18)',
        peach: 'rgba(247,203,201,0.18)',
        mistBlue: 'rgba(213,229,229,0.18)',
        beige: 'rgba(233,221,216,0.16)',
    },
    // SEMANTIC COLORS
    semantic: {
        success: '#C9DDDC',                    // Mint
        successLight: 'rgba(201,221,220,0.18)', // 18% mint bg
        warning: '#F7CBC9',                    // Peach
        warningLight: 'rgba(247,203,201,0.18)', // 18% peach bg
        error: '#E88A8A',                      // Muted error
        errorLight: 'rgba(232, 138, 138, 0.15)',
        info: '#D5E5E5',                       // Mist Blue
        infoLight: 'rgba(213,229,229,0.18)',
    },
    // FOCUS MODE - Ultra dark (#080B0D)
    focus: {
        background: '#080B0D',        // Darker than root
        card: 'rgba(255,255,255,0.04)',
        accent: '#C9DDDC',            // Mint accent
        progressRing: '#C9DDDC',      // Pastel accent only
        text: 'rgba(255, 255, 255, 0.92)',
    },
    // PRIORITY COLORS
    priority: {
        high: '#E88A8A',
        highBg: 'rgba(232, 138, 138, 0.15)',
        medium: '#F7CBC9',
        mediumBg: 'rgba(247,203,201,0.18)',
        low: '#C9DDDC',
        lowBg: 'rgba(201,221,220,0.18)',
    },
    // TAB BAR - Floating pill style
    tabBar: {
        background: 'rgba(255,255,255,0.08)',
        activeIcon: 'rgba(255, 255, 255, 0.92)',
        inactiveIcon: 'rgba(255, 255, 255, 0.40)',
        activeDot: '#C9DDDC',
    },
    // SEARCH BAR - Recessed style
    searchBar: {
        background: 'rgba(255,255,255,0.06)',
        border: 'rgba(255,255,255,0.08)',
        placeholder: 'rgba(255, 255, 255, 0.40)',
    },
    // COMPONENT STYLES
    components: {
        cardBorder: 'rgba(255, 255, 255, 0.04)',
        inputBackground: 'rgba(255,255,255,0.06)',
        buttonPrimaryBg: '#C9DDDC',
        buttonPrimaryText: '#0C0F11',
        buttonSecondaryBorder: 'rgba(255, 255, 255, 0.12)',
        buttonSecondaryBg: 'transparent',
    },
    // HEATMAP
    heatmap: {
        empty: '#1C1F26',
        active: '#C9DDDC',
    },
    // STREAK ICON
    streak: {
        glow: 'rgba(247,203,201,0.4)',
        icon: '#F7CBC9',
    },
};

// ============================================
// CARD SYSTEM (Single Source of Truth)
// ============================================
export const cardSystem = {
    borderRadius: 20,
    padding: {
        default: 16,
        large: 18,
    },
    shadow: {
        color: 'rgba(0,0,0,0.35)',
        blur: 20,
        yOffset: 8,
    },
    spacing: {
        vertical: 14,
        horizontal: 12,
    },
};

// ============================================
// ANIMATION SYSTEM (Strict Rules)
// ============================================
export const animation = {
    duration: {
        fast: 200,
        normal: 400,
        slow: 800,
        max: 1200,
    },
    easing: 'easeOutCubic',
    // Allowed animations only
    allowed: {
        fade: true,
        translateY: { min: -8, max: 8 },
        scale: { min: 0.98, max: 1.02 },
    },
    // Never use: bounce, spring, elastic
};

// Helper function to get theme colors
export type ThemeMode = 'light' | 'dark';

export function getThemeColors(mode: ThemeMode) {
    if (mode === 'dark') {
        return {
            background: darkMode.background,
            text: darkMode.text,
            pastel: darkMode.pastel,
            semantic: darkMode.semantic,
            focus: darkMode.focus,
            priority: darkMode.priority,
        };
    }
    return {
        background,
        text,
        pastel,
        semantic,
        focus,
        priority,
    };
}


// ============================================
// TYPOGRAPHY (Semantic Role System)
// Figtree = content/learning/reflection (warm, human)
// System Font = UI/controls/numbers (precise, professional)
// ============================================

// Font families
export const fontFamily = {
    // Content fonts (Figtree) - for thinking, reading, reflection
    content: {
        regular: 'Figtree_400Regular',
        medium: 'Figtree_500Medium',
        semibold: 'Figtree_600SemiBold',
        bold: 'Figtree_700Bold',
    },
    // UI fonts (System) - for buttons, tabs, numbers
    ui: Platform.select({
        ios: 'System',
        android: 'sans-serif',
        default: 'System',
    }),
    // Numeric fonts (System monospace variant) - for timers, stats
    numeric: Platform.select({
        ios: 'System',
        android: 'monospace',
        default: 'monospace',
    }),
};

// Semantic typography roles
export const typography = {
    // Display - Large emotional headings (Figtree)
    display: {
        fontFamily: 'Figtree_600SemiBold',
        fontSize: 32,
        lineHeight: 40,
        letterSpacing: -0.5,
    } as TextStyle,

    // Headline - Screen titles (Figtree)
    headline: {
        fontFamily: 'Figtree_600SemiBold',
        fontSize: 28,
        lineHeight: 34,
        letterSpacing: -0.3,
    } as TextStyle,

    // Title - Section headers (Figtree)
    title: {
        fontFamily: 'Figtree_500Medium',
        fontSize: 20,
        lineHeight: 26,
    } as TextStyle,

    // Subtitle - Card titles (Figtree)
    subtitle: {
        fontFamily: 'Figtree_500Medium',
        fontSize: 16,
        lineHeight: 22,
    } as TextStyle,

    // Body - Reading text (Figtree)
    body: {
        fontFamily: 'Figtree_400Regular',
        fontSize: 16,
        lineHeight: 24,
    } as TextStyle,

    // BodySmall - Secondary text (Figtree)
    bodySmall: {
        fontFamily: 'Figtree_400Regular',
        fontSize: 14,
        lineHeight: 20,
    } as TextStyle,

    // Label - Form labels, hints (System)
    label: {
        fontFamily: fontFamily.ui,
        fontSize: 14,
        lineHeight: 18,
    } as TextStyle,

    // UI - Buttons, tabs, controls (System)
    ui: {
        fontFamily: fontFamily.ui,
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '500',
    } as TextStyle,

    // UISmall - Small buttons, chips (System)
    uiSmall: {
        fontFamily: fontFamily.ui,
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '500',
    } as TextStyle,

    // Numeric - Timers, stats, numbers (System monospace)
    numeric: {
        fontFamily: fontFamily.numeric,
        fontSize: 16,
        lineHeight: 20,
        fontVariant: ['tabular-nums'],
    } as TextStyle,

    // NumericLarge - Timer display (System monospace)
    numericLarge: {
        fontFamily: fontFamily.numeric,
        fontSize: 48,
        lineHeight: 56,
        fontVariant: ['tabular-nums'],
        fontWeight: '300',
    } as TextStyle,

    // Caption - Smallest text (System)
    caption: {
        fontFamily: fontFamily.ui,
        fontSize: 11,
        lineHeight: 14,
    } as TextStyle,
};

// Mode-based typography variants
export type TypographyMode = 'default' | 'focus' | 'exam';

export function getTypography(mode: TypographyMode = 'default') {
    if (mode === 'focus') {
        // Focus mode: slightly increased line height, lighter feel
        return {
            ...typography,
            body: { ...typography.body, lineHeight: 26, letterSpacing: 0.1 },
            title: { ...typography.title, fontFamily: 'Figtree_400Regular' },
        };
    }
    if (mode === 'exam') {
        // Exam mode: tighter, more contrast
        return {
            ...typography,
            title: { ...typography.title, fontFamily: 'Figtree_600SemiBold' },
            body: { ...typography.body, lineHeight: 22 },
        };
    }
    return typography;
}

// Legacy support
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

export const lineHeight = {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
};

// ============================================
// NEUMORPHIC SHADOWS (Soft, dual-tone)
// ============================================
export const neumorphic = {
    // Light shadow (top-left)
    light: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: -4, height: -4 },
        shadowOpacity: 0.7,
        shadowRadius: 8,
    },
    // Dark shadow (bottom-right)
    dark: {
        shadowColor: '#C5D0D0',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },
};

// Combined shadow for iOS
export const shadows = {
    soft: {
        shadowColor: '#5D6B6B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    medium: {
        shadowColor: '#5D6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    elevated: {
        shadowColor: '#5D6B6B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
    },
    // Card shadow (neumorphic-inspired single shadow)
    card: {
        shadowColor: '#B8C5C5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 3,
    },
};

// ============================================
// LEGACY SUPPORT (for gradual migration)
// Keep old structure for components not yet updated
// ============================================
export const colors = {
    background: background.primary,
    card: background.card,
    cardBorder: pastel.beige,

    primary: {
        50: '#E8F5F5',
        100: '#D5ECEC',
        200: '#C0E3E3',
        300: '#A8D9D9',
        400: pastel.mint,    // Main primary
        500: '#6EC5C6',
        600: '#55B3B4',
        700: '#3F9FA0',
        800: '#2E8586',
        900: '#1F6B6C',
    },

    accent: {
        400: pastel.peach,
        500: '#F0B5B4',
        600: '#E89E9D',
    },

    success: semantic.success,
    warning: semantic.warning,
    error: semantic.error,
    info: semantic.info,

    text: text,

    dark: {
        50: pastel.white,
        100: '#E8F0F0',
        200: pastel.mistBlue,
        300: pastel.beige,
        400: '#9BA8A8',
        500: '#7A8989',
        600: pastel.slate,
        700: '#4D5858',
        800: '#3D4545',
        900: '#2D3333',
        950: '#1D2222',
    },

    white: '#FEFEFE',
    black: '#2D3333',
    transparent: 'transparent',

    priority: priority,
};

// ============================================
// THEME OBJECT (for React Native Paper)
// ============================================
export const paperTheme = {
    colors: {
        primary: pastel.mint,
        primaryContainer: pastel.mistBlue,
        secondary: pastel.peach,
        secondaryContainer: 'rgba(247, 203, 202, 0.3)',
        tertiary: pastel.beige,
        tertiaryContainer: 'rgba(208, 211, 212, 0.3)',
        surface: background.card,
        surfaceVariant: background.secondary,
        surfaceDisabled: 'rgba(93, 107, 107, 0.12)',
        background: background.primary,
        error: semantic.error,
        errorContainer: semantic.errorLight,
        onPrimary: text.primary,
        onPrimaryContainer: text.primary,
        onSecondary: text.primary,
        onSecondaryContainer: text.primary,
        onTertiary: text.primary,
        onTertiaryContainer: text.primary,
        onSurface: text.primary,
        onSurfaceVariant: text.secondary,
        onSurfaceDisabled: text.disabled,
        onError: text.inverse,
        onErrorContainer: text.primary,
        onBackground: text.primary,
        outline: pastel.beige,
        outlineVariant: 'rgba(208, 211, 212, 0.5)',
        inverseSurface: pastel.slate,
        inverseOnSurface: text.inverse,
        inversePrimary: '#A8E5E5',
        shadow: '#5D6B6B',
        scrim: 'rgba(93, 107, 107, 0.4)',
        backdrop: 'rgba(93, 107, 107, 0.4)',
        elevation: {
            level0: 'transparent',
            level1: background.card,
            level2: '#FAFEFE',
            level3: '#F5FBFB',
            level4: '#F2F9F9',
            level5: '#EFF7F7',
        },
    },
    // Figtree fonts for all Paper Text variants
    fonts: {
        displayLarge: {
            fontFamily: 'Figtree_700Bold',
            fontSize: 57,
            fontWeight: '400',
            letterSpacing: 0,
            lineHeight: 64,
        },
        displayMedium: {
            fontFamily: 'Figtree_600SemiBold',
            fontSize: 45,
            fontWeight: '400',
            letterSpacing: 0,
            lineHeight: 52,
        },
        displaySmall: {
            fontFamily: 'Figtree_600SemiBold',
            fontSize: 36,
            fontWeight: '400',
            letterSpacing: 0,
            lineHeight: 44,
        },
        headlineLarge: {
            fontFamily: 'Figtree_600SemiBold',
            fontSize: 32,
            fontWeight: '400',
            letterSpacing: 0,
            lineHeight: 40,
        },
        headlineMedium: {
            fontFamily: 'Figtree_500Medium',
            fontSize: 28,
            fontWeight: '400',
            letterSpacing: 0,
            lineHeight: 36,
        },
        headlineSmall: {
            fontFamily: 'Figtree_500Medium',
            fontSize: 24,
            fontWeight: '400',
            letterSpacing: 0,
            lineHeight: 32,
        },
        titleLarge: {
            fontFamily: 'Figtree_500Medium',
            fontSize: 22,
            fontWeight: '400',
            letterSpacing: 0,
            lineHeight: 28,
        },
        titleMedium: {
            fontFamily: 'Figtree_500Medium',
            fontSize: 16,
            fontWeight: '500',
            letterSpacing: 0.15,
            lineHeight: 24,
        },
        titleSmall: {
            fontFamily: 'Figtree_500Medium',
            fontSize: 14,
            fontWeight: '500',
            letterSpacing: 0.1,
            lineHeight: 20,
        },
        bodyLarge: {
            fontFamily: 'Figtree_400Regular',
            fontSize: 16,
            fontWeight: '400',
            letterSpacing: 0.15,
            lineHeight: 24,
        },
        bodyMedium: {
            fontFamily: 'Figtree_400Regular',
            fontSize: 14,
            fontWeight: '400',
            letterSpacing: 0.25,
            lineHeight: 20,
        },
        bodySmall: {
            fontFamily: 'Figtree_400Regular',
            fontSize: 12,
            fontWeight: '400',
            letterSpacing: 0.4,
            lineHeight: 16,
        },
        labelLarge: {
            fontFamily: fontFamily.ui,
            fontSize: 14,
            fontWeight: '500',
            letterSpacing: 0.1,
            lineHeight: 20,
        },
        labelMedium: {
            fontFamily: fontFamily.ui,
            fontSize: 12,
            fontWeight: '500',
            letterSpacing: 0.5,
            lineHeight: 16,
        },
        labelSmall: {
            fontFamily: fontFamily.ui,
            fontSize: 11,
            fontWeight: '500',
            letterSpacing: 0.5,
            lineHeight: 16,
        },
    },
};
