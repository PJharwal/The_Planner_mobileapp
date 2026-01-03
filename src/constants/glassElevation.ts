/**
 * Glass Elevation System
 * 
 * Single source of truth for all elevation/shadow levels in the app.
 * Provides consistent visual hierarchy and depth for the glass UI system.
 * 
 * Visual Hierarchy (bottom → top):
 * 1. Background (no shadow)
 * 2. Surface (cards, panels) - elevation.surface
 * 3. Floating (tabs, FABs) - elevation.floating
 * 4. Overlay (modals, sheets) - elevation.overlay
 * 
 * ⚠️ CRITICAL: No component should define its own shadow.
 *    Everything must import from this file.
 */

import { ViewStyle } from 'react-native';

/**
 * Surface Elevation
 * For: Regular cards, panels, content containers
 * Visual: Subtle blue glow, sits above background
 */
export const surface: ViewStyle = {
    shadowColor: '#4DA3FF',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
};

/**
 * Floating Elevation
 * For: Tab bar, floating action buttons, navigation
 * Visual: Stronger glow, clearly above cards
 */
export const floating: ViewStyle = {
    shadowColor: '#4DA3FF',
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
};

/**
 * Overlay Elevation
 * For: Modals, bottom sheets, paywalls, focus overlays
 * Visual: Strongest glow, top of visual stack
 */
export const overlay: ViewStyle = {
    shadowColor: '#4DA3FF',
    shadowOpacity: 0.22,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 20 },
    elevation: 14,
};

/**
 * Button Elevation (Special Case)
 * For: Interactive buttons that need subtle depth
 * Visual: Minimal shadow, just enough for tactile feel
 */
export const button: ViewStyle = {
    shadowColor: '#4DA3FF',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
};

/**
 * Complete elevation export
 */
export const glassElevation = {
    surface,
    floating,
    overlay,
    button,
};

export default glassElevation;
