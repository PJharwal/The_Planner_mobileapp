import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../glass';
import { Checkbox } from './Checkbox';
import { Chip } from './Chip';
import { spacing } from '../../constants/theme';
import { glassText, glassAccent } from '../../constants/glassTheme';

interface TaskRowProps {
    title: string;
    completed: boolean;
    priority?: 'low' | 'medium' | 'high';
    subtitle?: string;
    onToggle: () => void;
    onPress?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    style?: StyleProp<ViewStyle>;
}

export function TaskRow({
    title,
    completed,
    priority = 'medium',
    subtitle,
    onToggle,
    onPress,
    onEdit,
    onDelete,
    style,
}: TaskRowProps) {
    const getPriorityVariant = (): 'priority-high' | 'priority-medium' | 'priority-low' => {
        return `priority-${priority}` as const;
    };

    const content = (
        <GlassCard style={[styles.container, completed && styles.completed, style]} intensity="light" bordered={!completed}>
            <Checkbox checked={completed} onToggle={onToggle} />
            <View style={styles.content}>
                <Text
                    style={[
                        styles.title,
                        completed && styles.titleCompleted,
                    ]}
                    numberOfLines={2}
                >
                    {title}
                </Text>
                {subtitle && (
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {subtitle}
                    </Text>
                )}
            </View>
            <View style={styles.actions}>
                <Chip variant={getPriorityVariant()} size="sm">
                    {priority}
                </Chip>
                {(onEdit || onDelete) && (
                    <View style={styles.iconActions}>
                        {onEdit && (
                            <TouchableOpacity
                                onPress={onEdit}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                style={styles.iconButton}
                            >
                                <Ionicons name="pencil-outline" size={18} color={glassText.secondary} />
                            </TouchableOpacity>
                        )}
                        {onDelete && (
                            <TouchableOpacity
                                onPress={onDelete}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                style={styles.iconButton}
                            >
                                <Ionicons name="trash-outline" size={18} color={glassAccent.warm} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </GlassCard>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    completed: {
        opacity: 0.6,
    },
    content: {
        flex: 1,
        marginLeft: spacing.md,
        marginRight: spacing.sm,
    },
    title: {
        fontSize: 15,
        fontWeight: '500',
        color: glassText.primary,
    },
    titleCompleted: {
        color: glassText.muted,
        textDecorationLine: 'line-through',
    },
    subtitle: {
        fontSize: 13,
        color: glassText.secondary,
        marginTop: 2,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    iconActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: 4,
    },
});

export default TaskRow;
