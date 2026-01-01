import { UserProfileInsights, StudyPersona } from '../types/profile';
import { UserCapacity } from '../types/database';

/**
 * Derive user capacity from profile characteristics
 * Converts 8 user dimensions into actionable daily limits
 */
export function deriveUserCapacity(profile: Partial<UserProfileInsights>): Omit<UserCapacity, 'user_id' | 'created_at' | 'updated_at'> {
    // Get base values from persona
    const persona = profile.study_persona || 'balanced_learner';
    let maxTasksPerDay = getBaseTaskLimit(persona);
    let defaultFocusMinutes = getBaseFocusMinutes(persona);
    let defaultBreakMinutes = getBaseBreakMinutes(persona);
    let maxDailyFocusMinutes = getBaseMaxDailyFocus(persona);
    let recommendedSessionsPerDay = getBaseSessionsPerDay(persona);

    // Adjust for attention and focus challenges
    if (profile.attention_diagnosis === 'yes_adhd' || profile.focus_difficulty === 'very_hard') {
        maxTasksPerDay = Math.max(2, maxTasksPerDay - 2);
        defaultFocusMinutes = Math.min(20, defaultFocusMinutes);
        defaultBreakMinutes = Math.max(7, defaultBreakMinutes);
        recommendedSessionsPerDay = Math.max(2, recommendedSessionsPerDay - 1);
    } else if (profile.attention_diagnosis === 'suspected' || profile.focus_difficulty === 'often') {
        maxTasksPerDay = Math.max(3, maxTasksPerDay - 1);
        defaultFocusMinutes = Math.min(25, defaultFocusMinutes);
    }

    // Adjust for daily focus capacity
    if (profile.daily_focus_capacity === 'less_1h') {
        maxDailyFocusMinutes = 60;
        recommendedSessionsPerDay = Math.min(3, recommendedSessionsPerDay);
    } else if (profile.daily_focus_capacity === '1_2h') {
        maxDailyFocusMinutes = 120;
    } else if (profile.daily_focus_capacity === '2_4h') {
        maxDailyFocusMinutes = 180;
    } else if (profile.daily_focus_capacity === 'more_4h') {
        maxDailyFocusMinutes = 240;
    }

    // Adjust for consistency challenges
    if (profile.consistency_span === '1_2_days' || profile.miss_day_response === 'abandon') {
        maxTasksPerDay = Math.max(2, maxTasksPerDay - 1);
        defaultFocusMinutes = Math.max(15, defaultFocusMinutes - 5);
    }

    // Adjust for overload patterns
    if (profile.main_drain === 'too_many_tasks' || profile.overload_response === 'avoid') {
        maxTasksPerDay = Math.max(3, maxTasksPerDay - 1);
    }

    // Boost for exam proximity (but cap to prevent burnout)
    if (profile.exam_proximity === 'within_1m') {
        maxTasksPerDay = Math.min(8, maxTasksPerDay + 2);
        recommendedSessionsPerDay = Math.min(6, recommendedSessionsPerDay + 1);
        // Don't increase daily focus time to prevent burnout
    }

    // Ensure values are within valid ranges
    return {
        max_tasks_per_day: clamp(maxTasksPerDay, 1, 10),
        default_focus_minutes: clamp(defaultFocusMinutes, 10, 90),
        default_break_minutes: clamp(defaultBreakMinutes, 5, 20),
        max_daily_focus_minutes: clamp(maxDailyFocusMinutes, 60, 480),
        recommended_sessions_per_day: clamp(recommendedSessionsPerDay, 1, 8),
    };
}

/**
 * Get base task limit per persona
 */
function getBaseTaskLimit(persona: StudyPersona): number {
    const limits: Record<StudyPersona, number> = {
        low_focus_short_session: 4,
        exam_driven_high_pressure: 7,
        consistent_overloaded: 4,
        burnout_recovery: 3,
        balanced_learner: 6,
    };
    return limits[persona] || 5;
}

/**
 * Get base focus duration per persona
 */
function getBaseFocusMinutes(persona: StudyPersona): number {
    const durations: Record<StudyPersona, number> = {
        low_focus_short_session: 20,
        exam_driven_high_pressure: 35,
        consistent_overloaded: 25,
        burnout_recovery: 17,
        balanced_learner: 25,
    };
    return durations[persona] || 25;
}

/**
 * Get base break duration per persona
 */
function getBaseBreakMinutes(persona: StudyPersona): number {
    const breaks: Record<StudyPersona, number> = {
        low_focus_short_session: 7,
        exam_driven_high_pressure: 7,
        consistent_overloaded: 7,
        burnout_recovery: 10,
        balanced_learner: 5,
    };
    return breaks[persona] || 5;
}

/**
 * Get base max daily focus per persona
 */
function getBaseMaxDailyFocus(persona: StudyPersona): number {
    const maxDaily: Record<StudyPersona, number> = {
        low_focus_short_session: 90,
        exam_driven_high_pressure: 180,
        consistent_overloaded: 120,
        burnout_recovery: 60,
        balanced_learner: 150,
    };
    return maxDaily[persona] || 120;
}

/**
 * Get base sessions per day per persona
 */
function getBaseSessionsPerDay(persona: StudyPersona): number {
    const sessions: Record<StudyPersona, number> = {
        low_focus_short_session: 3,
        exam_driven_high_pressure: 5,
        consistent_overloaded: 4,
        burnout_recovery: 2,
        balanced_learner: 4,
    };
    return sessions[persona] || 4;
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Get human-readable explanation of capacity recommendations
 */
export function getCapacityExplanation(capacity: Omit<UserCapacity, 'user_id' | 'created_at' | 'updated_at'>): string {
    const focusHours = Math.floor(capacity.max_daily_focus_minutes / 60);
    const focusMinutes = capacity.max_daily_focus_minutes % 60;
    const focusTimeStr = focusMinutes > 0 ? `${focusHours}h ${focusMinutes}m` : `${focusHours}h`;

    return `Based on your profile, you work best with **${capacity.max_tasks_per_day} tasks per day** using **${capacity.default_focus_minutes}-minute** focus sessions. We recommend keeping total daily focus time under **${focusTimeStr}** to prevent burnout.`;
}
