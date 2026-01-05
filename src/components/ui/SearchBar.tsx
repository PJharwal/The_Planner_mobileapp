import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { glassText } from '../../constants/glassTheme';

import { GlassInput } from '../glass/GlassInput';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    onClear?: () => void;
    style?: ViewStyle;
    autoFocus?: boolean;
}

/**
 * Glass SearchBar Component
 * - Glassmorphism blur
 * - No sharp borders
 * - Integrated GlassInput
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
            <GlassInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                leftIcon={
                    <Ionicons
                        name="search-outline"
                        size={18}
                        color={glassText.muted}
                    />
                }
                bordered={false}
                style={styles.inputContainer}
                autoFocus={autoFocus}
            // We use a custom clear button, so we handle layout manually if needed
            />
            {value.length > 0 && (
                <TouchableOpacity
                    onPress={handleClear}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.clearButton}
                >
                    <Ionicons name="close-circle" size={18} color={glassText.muted} />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 0,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    inputContainer: {
        flex: 1,
    },
    clearButton: {
        position: 'absolute',
        right: 16,
        top: '50%',
        marginTop: -9,
        zIndex: 10,
    },
});

export default SearchBar;
