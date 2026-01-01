/**
 * AppText - Semantic Typography Component
 * 
 * Uses role-based typography for consistent, intentional font usage:
 * - Figtree for content/learning/reflection (warm, human)
 * - System font for UI/controls/numbers (precise, professional)
 * 
 * @example
 * <AppText variant="title">Section Title</AppText>
 * <AppText variant="body">Reading content...</AppText>
 * <AppText variant="numeric">25:00</AppText>
 * <AppText variant="ui">Button Label</AppText>
 */
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { typography, text } from '../../constants/theme';

export type TextVariant = keyof typeof typography;

interface AppTextProps extends TextProps {
    variant?: TextVariant;
    color?: string;
    align?: 'left' | 'center' | 'right';
    children: React.ReactNode;
}

export function AppText({
    variant = 'body',
    color = text.primary,
    align = 'left',
    style,
    children,
    ...props
}: AppTextProps) {
    const variantStyle = typography[variant];

    return (
        <Text
            style={[
                variantStyle,
                { color, textAlign: align },
                style,
            ]}
            {...props}
        >
            {children}
        </Text>
    );
}

// Quick shortcuts for common variants
export function DisplayText({ children, style, ...props }: Omit<AppTextProps, 'variant'>) {
    return <AppText variant="display" style={style} {...props}>{children}</AppText>;
}

export function HeadlineText({ children, style, ...props }: Omit<AppTextProps, 'variant'>) {
    return <AppText variant="headline" style={style} {...props}>{children}</AppText>;
}

export function TitleText({ children, style, ...props }: Omit<AppTextProps, 'variant'>) {
    return <AppText variant="title" style={style} {...props}>{children}</AppText>;
}

export function BodyText({ children, style, ...props }: Omit<AppTextProps, 'variant'>) {
    return <AppText variant="body" style={style} {...props}>{children}</AppText>;
}

export function LabelText({ children, style, ...props }: Omit<AppTextProps, 'variant'>) {
    return <AppText variant="label" style={style} {...props}>{children}</AppText>;
}

export function UIText({ children, style, ...props }: Omit<AppTextProps, 'variant'>) {
    return <AppText variant="ui" style={style} {...props}>{children}</AppText>;
}

export function NumericText({ children, style, ...props }: Omit<AppTextProps, 'variant'>) {
    return <AppText variant="numeric" style={style} {...props}>{children}</AppText>;
}

export function TimerText({ children, style, ...props }: Omit<AppTextProps, 'variant'>) {
    return <AppText variant="numericLarge" style={style} {...props}>{children}</AppText>;
}
