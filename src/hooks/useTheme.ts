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
    gradients,
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
                gradients: darkMode.gradients,
                priority,  // Keep priority same for both modes
            };
        }
        return {
            background,
            text,
            pastel,
            semantic,
            focus,
            gradients,
            priority,
        };
    }, [mode]);

    return {
        mode,
        toggleTheme,
        isDark: isDark(),
        colors,
    };
}
