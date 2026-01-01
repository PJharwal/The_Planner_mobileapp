/**
 * useTheme Hook - Access theme colors based on current mode
 * Comprehensive theming with dark mode support
 */
import { useMemo } from 'react';
import { useThemeStore } from '../store/themeStore';
import {
    background,
    text,
    pastel,
    semantic,
    focus,
    darkMode,
    priority,
    cardSystem,
    animation,
} from '../constants/theme';

export function useTheme() {
    const { mode, toggleTheme, isDark } = useThemeStore();

    const colors = useMemo(() => {
        if (mode === 'dark') {
            return {
                background: darkMode.background,
                text: darkMode.text,
                pastel: darkMode.pastel,
                semantic: darkMode.semantic,
                focus: darkMode.focus,
                priority: darkMode.priority,
                components: darkMode.components,
                tabBar: darkMode.tabBar,
                searchBar: darkMode.searchBar,
                tints: darkMode.tints,
                streak: darkMode.streak,
                heatmap: darkMode.heatmap,
            };
        }
        return {
            background: {
                ...background,
                gradientTop: '#F7F7F7',
                gradientMiddle: '#F5F5F5',
                gradientBottom: '#F3F3F3',
                divider: 'rgba(93, 107, 107, 0.12)',
            },
            text,
            pastel,
            semantic,
            focus,
            priority,
            components: {
                cardBorder: 'rgba(93, 107, 107, 0.08)',
                inputBackground: background.secondary,
                buttonPrimaryBg: pastel.mint,
                buttonPrimaryText: text.primary,
                buttonSecondaryBorder: pastel.beige,
                buttonSecondaryBg: 'transparent',
            },
            tabBar: {
                background: 'rgba(255,255,255,0.95)',
                activeIcon: text.primary,
                inactiveIcon: text.muted,
                activeDot: pastel.mint,
            },
            searchBar: {
                background: background.secondary,
                border: 'rgba(93, 107, 107, 0.12)',
                placeholder: text.muted,
            },
            tints: {
                mint: `${pastel.mint}20`,
                peach: `${pastel.peach}20`,
                mistBlue: `${pastel.mistBlue}20`,
                beige: `${pastel.beige}20`,
            },
            streak: {
                glow: `${pastel.peach}60`,
                icon: pastel.peach,
            },
            heatmap: {
                empty: background.secondary,
                active: pastel.mint,
            },
        };
    }, [mode]);

    return {
        mode,
        toggleTheme,
        isDark: isDark(),
        colors,
        cardSystem,
        animation,
    };
}
