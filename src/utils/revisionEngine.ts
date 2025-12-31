// Revision Engine - Smart revision resurfacing
// Automatically surfaces topics for review based on multiple factors

import { supabase } from '../lib/supabase';
import { RevisionSuggestion, ConfidenceLevel, DifficultyLevel } from '../types';
import { differenceInDays, parseISO } from 'date-fns';

interface RevisionFactors {
    daysSinceReview: number;
    confidence: ConfidenceLevel;
    difficulty: DifficultyLevel;
    examDaysAway: number | null;
}

/**
 * Calculate revision priority score (0-100)
 * Higher = more urgent to revise
 */
function calculateRevisionScore(factors: RevisionFactors): number {
    let score = 0;

    // Factor 1: Days since last review (max 40 points)
    // More days = higher priority
    const daysFactor = Math.min(factors.daysSinceReview / 14, 1) * 40;
    score += daysFactor;

    // Factor 2: Confidence level (max 30 points)
    const confidenceScores = { low: 30, medium: 15, high: 0 };
    score += confidenceScores[factors.confidence];

    // Factor 3: Difficulty (max 15 points)
    const difficultyScores = { hard: 15, medium: 8, easy: 0 };
    score += difficultyScores[factors.difficulty || 'medium'];

    // Factor 4: Exam proximity (max 15 points)
    if (factors.examDaysAway !== null && factors.examDaysAway <= 14) {
        score += Math.max(0, 15 - factors.examDaysAway);
    }

    return Math.min(100, Math.round(score));
}

/**
 * Generate reason text based on factors
 */
function generateReasonText(factors: RevisionFactors): { reason: RevisionSuggestion['reason'], text: string } {
    // Priority: Exam soon > Low confidence > Hard topic > Inactive
    if (factors.examDaysAway !== null && factors.examDaysAway <= 7) {
        return {
            reason: 'exam_soon',
            text: `Exam in ${factors.examDaysAway} days`
        };
    }

    if (factors.confidence === 'low') {
        return {
            reason: 'low_confidence',
            text: 'Low confidence - needs practice'
        };
    }

    if (factors.difficulty === 'hard') {
        return {
            reason: 'hard_topic',
            text: 'Challenging topic'
        };
    }

    if (factors.daysSinceReview >= 7) {
        return {
            reason: 'inactive',
            text: `Not reviewed in ${factors.daysSinceReview} days`
        };
    }

    return {
        reason: 'inactive',
        text: 'Due for revision'
    };
}

/**
 * Get revision suggestions for the current user
 * Returns topics that need review, sorted by priority
 */
export async function getRevisionSuggestions(
    userId: string,
    limit: number = 5
): Promise<RevisionSuggestion[]> {
    try {
        // 1. Check for active exam
        const { data: activeExam } = await supabase
            .from('exam_modes')
            .select('exam_date')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        const examDaysAway = activeExam
            ? differenceInDays(parseISO(activeExam.exam_date), new Date())
            : null;

        // 2. Get all sub-topics with their context
        const { data: subTopics } = await supabase
            .from('sub_topics')
            .select(`
                id,
                name,
                difficulty,
                topics!inner (
                    id,
                    name,
                    subjects!inner (
                        id,
                        name,
                        color
                    )
                )
            `)
            .eq('user_id', userId);

        if (!subTopics || subTopics.length === 0) {
            return [];
        }

        // 3. Get confidence levels
        const { data: confidenceLevels } = await supabase
            .from('confidence_tracking')
            .select('sub_topic_id, level')
            .eq('user_id', userId);

        const confidenceMap: Record<string, ConfidenceLevel> = {};
        confidenceLevels?.forEach(c => {
            confidenceMap[c.sub_topic_id] = c.level as ConfidenceLevel;
        });

        // 4. Get last revision dates
        const { data: revisionData } = await supabase
            .from('revision_history')
            .select('sub_topic_id, reviewed_at')
            .eq('user_id', userId)
            .order('reviewed_at', { ascending: false });

        // Get most recent review for each sub-topic
        const lastReviewMap: Record<string, string> = {};
        revisionData?.forEach(r => {
            if (!lastReviewMap[r.sub_topic_id]) {
                lastReviewMap[r.sub_topic_id] = r.reviewed_at;
            }
        });

        // 5. Calculate priority for each sub-topic
        const suggestions: RevisionSuggestion[] = [];

        for (const subTopic of subTopics) {
            const topic = (subTopic as any).topics;
            const subject = topic?.subjects;

            if (!topic || !subject) continue;

            const lastReview = lastReviewMap[subTopic.id];
            const daysSinceReview = lastReview
                ? differenceInDays(new Date(), parseISO(lastReview))
                : 30; // Never reviewed = 30 days

            const confidence = confidenceMap[subTopic.id] || 'medium';
            const difficulty = (subTopic.difficulty as DifficultyLevel) || 'medium';

            const factors: RevisionFactors = {
                daysSinceReview,
                confidence,
                difficulty,
                examDaysAway,
            };

            const score = calculateRevisionScore(factors);
            const { reason, text } = generateReasonText(factors);

            // Only suggest if score is meaningful (>= 25)
            if (score >= 25) {
                suggestions.push({
                    subTopicId: subTopic.id,
                    subTopicName: subTopic.name,
                    topicName: topic.name,
                    subjectName: subject.name,
                    subjectColor: subject.color,
                    reason,
                    reasonText: text,
                    daysSinceReview,
                    confidence,
                    difficulty,
                    priority: score,
                });
            }
        }

        // Sort by priority descending and limit
        suggestions.sort((a, b) => b.priority - a.priority);
        return suggestions.slice(0, limit);

    } catch (error) {
        console.error('Error getting revision suggestions:', error);
        return [];
    }
}

/**
 * Record that a sub-topic was reviewed
 */
export async function recordRevision(userId: string, subTopicId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('revision_history')
            .insert({
                user_id: userId,
                sub_topic_id: subTopicId,
            });

        return !error;
    } catch {
        return false;
    }
}

/**
 * Get days since last review for a sub-topic
 */
export async function getDaysSinceReview(userId: string, subTopicId: string): Promise<number | null> {
    try {
        const { data } = await supabase
            .from('revision_history')
            .select('reviewed_at')
            .eq('user_id', userId)
            .eq('sub_topic_id', subTopicId)
            .order('reviewed_at', { ascending: false })
            .limit(1)
            .single();

        if (!data) return null;

        return differenceInDays(new Date(), parseISO(data.reviewed_at));
    } catch {
        return null;
    }
}
