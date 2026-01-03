import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { OnboardingQuestion } from '../../types/profile';
import { QuestionOption } from './QuestionOption';
import { GlassInput } from '../glass/GlassInput';
import { GlassCard } from '../glass/GlassCard';
import { glassText, glassAccent, glass } from '../../constants/glassTheme';

interface QuestionCardProps {
    question: OnboardingQuestion;
    value: string | null;
    onAnswer: (value: string) => void;
}

export function QuestionCard({ question, value, onAnswer }: QuestionCardProps) {
    const isScale = question.layout === 'scale';

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
                isScale ? (
                    <View style={styles.scaleContainer}>
                        {question.options.map((option) => {
                            const isSelected = value === option.value;
                            return (
                                <GlassCard
                                    key={option.value}
                                    intensity="light"
                                    bordered={!isSelected}
                                    style={[
                                        styles.scaleOption,
                                        isSelected && styles.scaleOptionSelected
                                    ]}
                                >
                                    <TouchableOpacity
                                        onPress={() => onAnswer(option.value)}
                                        activeOpacity={0.7}
                                        style={styles.scaleTouchable}
                                    >
                                        <Text style={[
                                            styles.scaleLabel,
                                            isSelected && styles.scaleLabelSelected
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                </GlassCard>
                            );
                        })}
                    </View>
                ) : (
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
                )
            )}

            {question.type === 'text_input' && (
                <GlassInput
                    value={value || ''}
                    onChangeText={onAnswer}
                    placeholder="Type your answer..."
                    multiline
                    numberOfLines={3}
                    style={styles.textInput}
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
        marginBottom: 32,
    },
    question: {
        color: glassText.primary,
        fontWeight: '600',
        marginBottom: 8,
    },
    helper: {
        color: glassText.secondary,
        lineHeight: 20,
    },
    options: {
        flex: 1,
        gap: 4,
    },
    scaleContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center', // Center the pills
    },
    scaleOption: {
        flex: 1,
        minWidth: '40%', // At least 2 per row if they wrap, or change logic to be 100% width pills? 
        // User said "Horizontal pills (1-5)". Usually implies a single row.
        // But some labels like "Less than 1 hour" are long.
        // I'll assume they might wrap. But let's try to fit them if short.
        padding: 0,
    },
    scaleOptionSelected: {
        borderColor: glassAccent.blue, // Scale uses Blue usually or Mint? User said "Type B - Scale Selector".
        backgroundColor: glassAccent.blue + '20', // transparent blue
    },
    scaleTouchable: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scaleLabel: {
        color: glassText.primary,
        fontWeight: '500',
        fontSize: 14,
        textAlign: 'center',
    },
    scaleLabelSelected: {
        color: glassAccent.blue,
        fontWeight: '700',
    },
    textInput: {
        marginTop: 8,
    },
});
