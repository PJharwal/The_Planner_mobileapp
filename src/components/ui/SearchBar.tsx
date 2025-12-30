import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, gradients, text, spacing } from '../../constants/theme';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    onClear?: () => void;
    style?: ViewStyle;
    autoFocus?: boolean;
}

/**
 * Calm UI SearchBar Component
 * - Warm gradient background
 * - 20px rounded corners
 * - Soft shadow
 */
export function SearchBar({
    value,
    onChangeText,
    placeholder = 'Search...',
    onClear,
    style,
    autoFocus = false,
}: SearchBarProps) {
    const handleClear = () => {
        onChangeText('');
        onClear?.();
    };

    return (
        <LinearGradient
            colors={gradients.warm}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, style]}
        >
            <Ionicons
                name="search-outline"
                size={18}
                color="rgba(93, 107, 107, 0.65)"
                style={styles.searchIcon}
            />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="rgba(93, 107, 107, 0.65)"
                style={styles.input}
                autoFocus={autoFocus}
                returnKeyType="search"
            />
            {value.length > 0 && (
                <TouchableOpacity
                    onPress={handleClear}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.clearButton}
                >
                    <Ionicons name="close-circle" size={18} color="rgba(93, 107, 107, 0.65)" />
                </TouchableOpacity>
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: borderRadius.lg, // 20px
        paddingHorizontal: 20,
        minHeight: 56,
        // Soft shadow
        shadowColor: 'rgba(93, 107, 107, 1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 3,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: text.primary,
        paddingVertical: spacing.md,
    },
    clearButton: {
        marginLeft: spacing.sm,
    },
});

export default SearchBar;
