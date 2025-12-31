import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput as PaperTextInput } from 'react-native-paper';
import { OnboardingQuestion } from '../../types/profile';
import { QuestionOption } from './QuestionOption';
import { background, text, pastel, spacing, borderRadius } from '../../constants/theme';

interface QuestionCardProps {
    question: OnboardingQuestion;
    value: string | null;
    onAnswer: (value: string) => void;
}

export function QuestionCard({ question, value, onAnswer }: QuestionCardProps) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text variant="headlineSmall" style={styles.question}>
                    {question.question}
                </Text>
                {question.helper && (
                    <Text variant="bodySmall" style={styles.helper}>
                        {question.helper}
                    </Text>
                )}
            </View>

            {question.type === 'multiple_choice' && question.options && (
                <View style={styles.options}>
                    {question.options.map((option) => (
                        <QuestionOption
                            key={option.value}
                            label={option.label}
                            description={option.description}
                            value={option.value}
                            selected={value === option.value}
                            onSelect={() => onAnswer(option.value)}
                        />
                    ))}
                </View>
            )}

            {question.type === 'text_input' && (
                <PaperTextInput
                    mode="outlined"
                    value={value || ''}
                    onChangeText={onAnswer}
                    placeholder="Type your answer..."
                    multiline
                    numberOfLines={3}
                    maxLength={question.maxLength}
                    style={styles.textInput}
                    outlineColor={pastel.beige}
                    activeOutlineColor={pastel.mint}
                    textColor={text.primary}
                    placeholderTextColor={text.muted}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        marginBottom: spacing.lg,
    },
    question: {
        color: text.primary,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    helper: {
        color: text.secondary,
        lineHeight: 20,
    },
    options: {
        flex: 1,
    },
    textInput: {
        backgroundColor: background.primary,
        fontSize: 16,
    },
});
