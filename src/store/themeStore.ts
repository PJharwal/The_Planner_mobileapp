/**
 * Theme Store - Dark/Light Mode Management
 * Persists theme preference to AsyncStorage
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'app_theme_mode';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
    mode: ThemeMode;
    isLoading: boolean;

    // Actions
    initialize: () => Promise<void>;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;

    // Computed
    isDark: () => boolean;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
    mode: 'light',
    isLoading: true,

    initialize: async () => {
        try {
            const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (stored === 'dark' || stored === 'light') {
                set({ mode: stored, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.log('Error loading theme:', error);
            set({ isLoading: false });
        }
    },

    toggleTheme: () => {
        const newMode = get().mode === 'light' ? 'dark' : 'light';
        set({ mode: newMode });
        AsyncStorage.setItem(THEME_STORAGE_KEY, newMode).catch(console.log);
    },

    setTheme: (mode: ThemeMode) => {
        set({ mode });
        AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(console.log);
    },

    isDark: () => get().mode === 'dark',
}));
