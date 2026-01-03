/**
 * Glass Card Specification
 * 
 * CANONICAL CARD RULES - All cards MUST follow these exact values.
 * Any deviation is a bug and should be fixed immediately.
 * 
 * Purpose: Ensures visual consistency, alignment, and polish across the entire app.
 */

import { ViewStyle, TextStyle } from 'react-native';

// ==============================================
// CARD DIMENSIONS (DO NOT DEVIATE)
// ==============================================

/**
 * Card Border Radius
 * ALL cards use 20px - no exceptions
 */
export const CARD_RADIUS = 20;

/**
 * Card Horizontal Inset
 * Distance from screen edge to card edge
 * ALL screens must use this value
 */
export const CARD_HORIZONTAL_INSET = 16;

/**
 * Card Vertical Spacing
 * Gap between cards in a list/column
 */
export const CARD_VERTICAL_GAP = 14;

// ==============================================
// CARD INTERNAL PADDING (STANDARD)
// ==============================================

/**
 * Standard card padding
 * Use for: Task cards, Analytics cards, Stats cards, Calendar cards
 */
export const CARD_PADDING = {
    horizontal: 16,
    vertical: 16,
    // For compact cards (e.g., small stats)
    compact: {
        horizontal: 14,
        vertical: 12,
    },
};

// ==============================================
// TEXT ALIGNMENT INSIDE CARDS
// ==============================================

/**
 * Title inside card
 */
export const CARD_TITLE_STYLE: TextStyle = {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
};

/**
 * Metadata/subtitle inside card
 */
export const CARD_METADATA_STYLE: TextStyle = {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    opacity: 0.7,
};

/**
 * Body text inside card
 */
export const CARD_BODY_STYLE: TextStyle = {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
};

// ==============================================
// SHADOW (CONSISTENT EVERYWHERE)
// ==============================================

/**
 * Standard card shadow - MUST be used for all cards
 * Imported from glassElevation.surface
 */
export const CARD_SHADOW: ViewStyle = {
    shadowColor: '#4DA3FF',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
};

// ==============================================
// INPUT MATCHING CARDS
// ==============================================

/**
 * Inputs should visually match cards
 * Use these values for text inputs, search bars, etc.
 */
export const INPUT_CARD_STYLE: ViewStyle = {
    borderRadius: CARD_RADIUS,
    paddingHorizontal: CARD_PADDING.horizontal,
    paddingVertical: 14, // Slightly less for single-line inputs
};

// ==============================================
// BOTTOM SHEET / MODAL CARDS
// ==============================================

/**
 * Bottom sheets and modals should align with card grid
 */
export const SHEET_CARD_STYLE: ViewStyle = {
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    paddingHorizontal: CARD_HORIZONTAL_INSET,
    paddingVertical: 20,
};

// ==============================================
// BUTTON INSIDE CARDS
// ==============================================

/**
 * Buttons inside cards should be consistent
 */
export const CARD_BUTTON_STYLE: ViewStyle = {
    borderRadius: 12, // Slightly less than card to feel "nested"
    paddingHorizontal: 16,
    paddingVertical: 10,
};

// ==============================================
// VALIDATION HELPER
// ==============================================

/**
 * Use this to verify card compliance
 */
export const isCardCompliant = (style: ViewStyle): boolean => {
    return (
        style.borderRadius === CARD_RADIUS &&
        style.paddingHorizontal === CARD_PADDING.horizontal
    );
};

/**
 * Quick access for common card container style
 */
export const cardContainerStyle = (additionalStyle?: ViewStyle): ViewStyle => ({
    borderRadius: CARD_RADIUS,
    marginHorizontal: CARD_HORIZONTAL_INSET,
    marginBottom: CARD_VERTICAL_GAP,
    ...additionalStyle,
});

/**
 * Quick access for common card inner style
 */
export const cardInnerStyle = (compact = false): ViewStyle => ({
    padding: compact ? CARD_PADDING.compact.vertical : CARD_PADDING.vertical,
    paddingHorizontal: compact ? CARD_PADDING.compact.horizontal : CARD_PADDING.horizontal,
});

export default {
    CARD_RADIUS,
    CARD_HORIZONTAL_INSET,
    CARD_VERTICAL_GAP,
    CARD_PADDING,
    CARD_TITLE_STYLE,
    CARD_METADATA_STYLE,
    CARD_BODY_STYLE,
    CARD_SHADOW,
    INPUT_CARD_STYLE,
    SHEET_CARD_STYLE,
    CARD_BUTTON_STYLE,
    cardContainerStyle,
    cardInnerStyle,
};
