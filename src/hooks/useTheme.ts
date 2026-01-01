/**
 * useTheme Hook - Access theme colors based on current mode
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
    priority
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
                navigation: darkMode.navigation,
            };
        }
        return {
            background,
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
            },
            navigation: {
                background: background.primary,
                activeIcon: text.primary,
                inactiveIcon: text.muted,
            },
        };
    }, [mode]);

    return {
        mode,
        toggleTheme,
        isDark: isDark(),
        colors,
    };
}
