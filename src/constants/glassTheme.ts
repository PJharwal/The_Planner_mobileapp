/**
 * Glass Theme Design Tokens
 * 
 * Premium dark glassmorphism design system for Tasky.
 * Inspired by Apple Vision Pro, Calm, Linear.
 */

// ==============================================
// BACKGROUND COLORS (Dark Foundation)
// ==============================================
export const darkBackground = {
    primary: '#0B0F14',      // Deep charcoal blue-black
    secondary: '#0E1621',    // Slightly lighter for gradients
    elevated: '#121820',     // Cards that need slight elevation
};

// ==============================================
// RADIUS PRESETS (Consistent Border Radius)
// ==============================================
export const glass = {
    background: {
        light: 'rgba(255, 255, 255, 0.08)',   // Very subtle
        default: 'rgba(255, 255, 255, 0.12)', // Standard opacity
        medium: 'rgba(255, 255, 255, 0.15)',  // More visible
        strong: 'rgba(255, 255, 255, 0.18)',  // Prominent
        highlight: 'rgba(255, 255, 255, 0.22)', // For selected states
    },
    border: {
        default: 'rgba(255, 255, 255, 0.10)',
        light: 'rgba(255, 255, 255, 0.06)',
        softBlue: 'rgba(90, 184, 255, 0.15)',
    },
    blur: {
        light: 15,
        default: 20,
        strong: 30,
    },
    radius: {
        sm: 16,
        md: 20,
        lg: 24,
        xl: 28,
    },
};

// ==============================================
// ACCENT COLORS
// ==============================================
export const glassAccent = {
    // Primary - Soft Blue (actions, focus indicators)
    blue: '#7AB8FF',
    blueGlow: 'rgba(122, 184, 255, 0.15)',
    blueMuted: 'rgba(122, 184, 255, 0.6)',

    // Secondary - Mint (success, capacity, calm)
    mint: '#7EE0C7',
    mintGlow: 'rgba(126, 224, 199, 0.15)',
    mintMuted: 'rgba(126, 224, 199, 0.6)',

    // Warm - Peach/Orange (streaks, warnings)
    warm: '#FFB88C',
    warmGlow: 'rgba(255, 184, 140, 0.15)',
    warmMuted: 'rgba(255, 184, 140, 0.6)',

    // Error - Soft coral
    error: '#FF8A8A',
    errorGlow: 'rgba(255, 138, 138, 0.15)',
};

// ==============================================
// TEXT COLORS (for dark backgrounds)
// ==============================================
export const glassText = {
    primary: 'rgba(255, 255, 255, 0.92)',    // Main text
    secondary: 'rgba(255, 255, 255, 0.65)',  // Subtitles, labels
    muted: 'rgba(255, 255, 255, 0.45)',      // Hints, placeholders
    disabled: 'rgba(255, 255, 255, 0.25)',   // Disabled state
    inverse: '#000000ff',                       // Text on light surfaces
};

/**
 * Glass Shadow (Legacy - use glassElevation instead)
 * @deprecated Import from glassElevation.ts for new code
 * 
 * Kept for backward compatibility during migration.
 * Maps to the new elevation system.
 */
export const glassShadow = {
    /** @deprecated Use glassElevation.surface */
    card: {
        shadowColor: '#4DA3FF',
        shadowOpacity: 0.12,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
    },
    /** @deprecated Use glassElevation.overlay */
    sheet: {
        shadowColor: '#4DA3FF',
        shadowOpacity: 0.22,
        shadowRadius: 36,
        shadowOffset: { width: 0, height: 20 },
        elevation: 14,
    },
    /** @deprecated Use glassElevation.button */
    button: {
        shadowColor: '#4DA3FF',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
};

// ==============================================
// ANIMATION PRESETS
// ==============================================
export const glassAnimation = {
    duration: {
        fast: 150,
        default: 200,
        slow: 300,
    },
    easing: 'easeOut',
};

// ==============================================
// GRADIENT PRESETS
// ==============================================
export const glassGradient = {
    // Subtle background gradient
    background: ['#fafafaff', '#f5f5f5ff'] as const,
    // Card inner glow (top to bottom)
    cardGlow: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)'] as const,
    // Blue accent gradient
    blue: ['#7AB8FF', '#5A9EE5'] as const,
    // Mint accent gradient
    mint: ['#7EE0C7', '#5EC4A7'] as const,
};

// ==============================================
// AURORA GLOW COLORS (for Mesh Gradient Background)
// ==============================================
export const auroraGlow = {
    // Primary blue aurora (center-top glow)
    bluePrimary: ['rgba(90, 184, 255, 0.5)', 'rgba(90, 184, 255, 0.35)', 'rgba(90, 184, 255, 0.15)'] as const,
    // Secondary blue (offset glow)
    blueSecondary: ['rgba(77, 163, 255, 0.35)', 'rgba(77, 163, 255, 0.15)'] as const,
    // Purple-blue tint
    purple: ['rgba(106, 123, 255, 0.15)', 'rgba(106, 123, 255, 0.08)'] as const,
    // Subtle mint accent
    mint: ['rgba(126, 224, 199, 0.03)', 'rgba(126, 224, 199, 0.06)'] as const,
};

// ==============================================
// EXPO-BLUR TINT PRESETS
// ==============================================
export const glassTint = {
    default: 'dark' as const,
    light: 'light' as const,
    system: 'systemUltraThinMaterialDark' as const,
};
