import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, pastel, background, text, shadows, spacing } from '../../constants/theme';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    onClear?: () => void;
    style?: ViewStyle;
    autoFocus?: boolean;
}

/**
 * Soft-UI SearchBar Component
 * - Floating rounded search bar
 * - Soft elevation
 * - Clear button when text present
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
        <View style={[styles.container, style]}>
            <Ionicons
                name="search-outline"
                size={20}
                color={text.muted}
                style={styles.searchIcon}
            />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={text.muted}
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
                    <Ionicons name="close-circle" size={20} color={text.muted} />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: background.card,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.lg,
        minHeight: 48,
        ...shadows.soft,
        borderWidth: 1,
        borderColor: pastel.beige,
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
