/**
 * Glass Spacing System
 * 
 * Standardized spacing values for consistent vertical rhythm.
 * Use ONLY these values throughout the app.
 * 
 * Purpose: Ensures cards, sections, and elements align visually
 * with the tab bar and maintain proper breathing space.
 */

/**
 * Vertical Spacing
 * Use for: Card gaps, section spacing, padding
 */
export const spacing = {
    /** Between cards in a list */
    betweenCards: 14,

    /** Card to section header */
    cardToHeader: 18,

    /** Between major sections */
    betweenSections: 24,

    /** Screen horizontal padding */
    screenHorizontal: 16,

    /** Screen top padding */
    screenTop: 12,

    /** Bottom padding above tab bar (accounts for tab height + margin) */
    screenBottom: 96,

    /** Tab bar margins */
    tabBar: {
        bottom: 14,
        horizontal: 16,
        radius: 28,
    },
};

/**
 * Quick access values for common use cases
 */
export const cardGap = spacing.betweenCards;
export const sectionGap = spacing.betweenSections;
export const screenPadding = {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.screenTop,
    paddingBottom: spacing.screenBottom,
};

export default spacing;
