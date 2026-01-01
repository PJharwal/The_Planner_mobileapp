/**
 * Font Loading Utility
 * Loads Figtree font family for content/reflection text
 * SF Pro (system font) used for UI/controls/numbers
 */
import { useFonts } from 'expo-font';
import {
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
} from '@expo-google-fonts/figtree';

// Font family names after loading
export const fontFamilies = {
    // Content fonts (Figtree) - for thinking/learning/reflection
    figtree: {
        regular: 'Figtree_400Regular',
        medium: 'Figtree_500Medium',
        semibold: 'Figtree_600SemiBold',
        bold: 'Figtree_700Bold',
    },
    // System fonts (SF Pro on iOS, Roboto on Android) - for UI/controls
    system: {
        regular: undefined, // Uses default system font
        medium: undefined,
        semibold: undefined,
        bold: undefined,
    },
};

// Hook to load all required fonts
export function useAppFonts() {
    const [fontsLoaded, fontError] = useFonts({
        Figtree_400Regular,
        Figtree_500Medium,
        Figtree_600SemiBold,
        Figtree_700Bold,
    });

    return { fontsLoaded, fontError };
}

// Font loading map for expo-font
export const fontAssets = {
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
};
