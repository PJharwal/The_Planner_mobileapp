import { UserProfileInsights, StudyPersona } from '../types/profile';

/**
 * Derive study persona from user profile
 * This algorithm analyzes user characteristics to assign an appropriate persona
 */
export function deriveStudyPersona(profile: Partial<UserProfileInsights>): StudyPersona {
    // Priority 1: Attention and Focus Challenges
    if (
        profile.focus_difficulty === 'very_hard' ||
        profile.attention_diagnosis === 'yes_adhd' ||
        (profile.focus_difficulty === 'often' && profile.attention_diagnosis === 'suspected')
    ) {
        return 'low_focus_short_session';
    }

    // Priority 2: Exam Pressure
    if (
        profile.exam_proximity === 'within_1m' &&
        (profile.guidance_level === 'strong' || profile.guidance_level === 'decide_all')
    ) {
        return 'exam_driven_high_pressure';
    }

    // Priority 3: Burnout and Consistency Issues
    if (
        profile.miss_day_response === 'abandon' ||
        profile.consistency_span === '1_2_days' ||
        (profile.overload_response === 'pause' && profile.main_drain === 'stress')
    ) {
        return 'burnout_recovery';
    }

    // Priority 4: Overload Patterns
    if (
        profile.main_drain === 'too_many_tasks' &&
        (profile.overload_response === 'rush_stress' || profile.overload_response === 'avoid')
    ) {
        return 'consistent_overloaded';
    }

    // Default: Balanced Learner
    return 'balanced_learner';
}

/**
 * Get persona-specific recommendations for daily task limit
 */
export function getPersonaDailyTaskLimit(persona: StudyPersona): number {
    const limits: Record<StudyPersona, number> = {
        low_focus_short_session: 4,
        exam_driven_high_pressure: 8,
        consistent_overloaded: 4,
        burnout_recovery: 2,
        balanced_learner: 5,
    };

    return limits[persona];
}

/**
 * Get recommended session length based on persona (used for display)
 * Actual session length comes from the selected plan
 */
export function getRecommendedSessionLength(persona: StudyPersona): number {
    const lengths: Record<StudyPersona, number> = {
        'low_focus_short_session': 20,
        'exam_driven_high_pressure': 35,
        'consistent_overloaded': 25,
        'burnout_recovery': 17,
        'balanced_learner': 25,
    };

    return lengths[persona] || 25;
}

/**
 * Get human-readable description of a study persona
 */
export function getPersonaDescription(persona: StudyPersona): string {
    const descriptions: Record<StudyPersona, string> = {
        low_focus_short_session: 'You work best with short, focused bursts of activity.',
        exam_driven_high_pressure: 'You thrive under structure when preparing for important deadlines.',
        consistent_overloaded: 'You\'re managing a lot - pacing and prioritization are key.',
        burnout_recovery: 'Taking it slow to rebuild your study habits sustainably.',
        balanced_learner: 'You have a steady, balanced approach to learning.',
    };

    return descriptions[persona];
}
