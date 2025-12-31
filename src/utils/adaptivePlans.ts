import { StudyPersona } from '../types/profile';

export type AdaptivePlanId =
    | 'ultra_light_consistency'
    | 'attention_friendly'
    | 'balanced_daily'
    | 'deep_focus'
    | 'exam_countdown'
    | 'burnout_recovery'
    | 'night_owl'
    | 'survival_mode';

export interface AdaptivePlan {
    id: AdaptivePlanId;
    name: string;
    emoji: string;
    description: string;
    category: string;

    // Session configuration
    session_length_min: number; // Minimum session length in minutes
    session_length_max: number; // Maximum session length in minutes (for range-based plans)
    default_session_length: number; // Default session length
    break_duration: number; // Break duration in minutes

    // Daily limits
    max_sessions_per_day: number;
    daily_task_limit: number;

    // Task guidance
    task_size_guidance: 'very_small' | 'small' | 'medium' | 'large';

    // Behavior rules
    smart_warnings: string[];
    analytics_tone: 'encouraging' | 'neutral' | 'data_driven' | 'hidden';
    auto_reschedule_missed: boolean;
    require_session_quality: boolean;

    // Additional features
    break_frequency: number; // Minutes between break reminders
    auto_pause_on_background: boolean;
    hide_analytics: boolean;
    suppress_morning_reminders: boolean;
}

/**
 * 8 ADAPTIVE STUDY & FOCUS PLANS
 * Session-first philosophy: Focus sessions drive everything
 */
export const ADAPTIVE_PLANS: AdaptivePlan[] = [
    {
        id: 'ultra_light_consistency',
        name: 'Ultra-Light Consistency',
        emoji: '🌱',
        description: 'Build habits slowly without pressure',
        category: 'Low consistency + overwhelmed',

        session_length_min: 15,
        session_length_max: 15,
        default_session_length: 15,
        break_duration: 5,

        max_sessions_per_day: 2,
        daily_task_limit: 3,
        task_size_guidance: 'very_small',

        smart_warnings: [
            "Don't add more than 3 tasks today",
            "Consistency matters more than finishing everything"
        ],
        analytics_tone: 'encouraging',
        auto_reschedule_missed: true,
        require_session_quality: false,

        break_frequency: 60,
        auto_pause_on_background: false,
        hide_analytics: false,
        suppress_morning_reminders: false,
    },

    {
        id: 'attention_friendly',
        name: 'Attention-Friendly',
        emoji: '⚡',
        description: 'ADHD-safe short sessions with strong support',
        category: 'High distraction / ADHD',

        session_length_min: 20,
        session_length_max: 20,
        default_session_length: 20,
        break_duration: 7,

        max_sessions_per_day: 3,
        daily_task_limit: 4,
        task_size_guidance: 'small',

        smart_warnings: [
            "Short sessions work better for you",
            "Stop when focus drops — don't push"
        ],
        analytics_tone: 'encouraging',
        auto_reschedule_missed: true,
        require_session_quality: false,

        break_frequency: 45,
        auto_pause_on_background: true,
        hide_analytics: false,
        suppress_morning_reminders: false,
    },

    {
        id: 'balanced_daily',
        name: 'Balanced Daily',
        emoji: '⚖️',
        description: 'Standard approach for consistent learners',
        category: 'Average focus + moderate consistency',

        session_length_min: 25,
        session_length_max: 25,
        default_session_length: 25,
        break_duration: 5,

        max_sessions_per_day: 4,
        daily_task_limit: 6,
        task_size_guidance: 'medium',

        smart_warnings: [
            "If tasks spill over twice, reduce tomorrow's load"
        ],
        analytics_tone: 'neutral',
        auto_reschedule_missed: false,
        require_session_quality: false,

        break_frequency: 60,
        auto_pause_on_background: false,
        hide_analytics: false,
        suppress_morning_reminders: false,
    },

    {
        id: 'deep_focus',
        name: 'Deep Focus',
        emoji: '🎯',
        description: 'Long intensive sessions for strong concentration',
        category: 'Strong focus + deep work',

        session_length_min: 50,
        session_length_max: 50,
        default_session_length: 50,
        break_duration: 10,

        max_sessions_per_day: 3,
        daily_task_limit: 5,
        task_size_guidance: 'large',

        smart_warnings: [
            "Watch for burnout",
            "Take breaks seriously"
        ],
        analytics_tone: 'data_driven',
        auto_reschedule_missed: false,
        require_session_quality: true,

        break_frequency: 90,
        auto_pause_on_background: false,
        hide_analytics: false,
        suppress_morning_reminders: false,
    },

    {
        id: 'exam_countdown',
        name: 'Exam Countdown',
        emoji: '📚',
        description: 'Intensive prep for upcoming exams',
        category: 'Exam within 1-3 months',

        session_length_min: 30,
        session_length_max: 40,
        default_session_length: 35,
        break_duration: 7,

        max_sessions_per_day: 5,
        daily_task_limit: 7,
        task_size_guidance: 'medium',

        smart_warnings: [
            "Focus on exam-linked tasks only",
            "Avoid adding new topics unnecessarily"
        ],
        analytics_tone: 'data_driven',
        auto_reschedule_missed: false,
        require_session_quality: true,

        break_frequency: 60,
        auto_pause_on_background: false,
        hide_analytics: false,
        suppress_morning_reminders: false,
    },

    {
        id: 'burnout_recovery',
        name: 'Burnout Recovery',
        emoji: '💚',
        description: 'Gentle rebuild after stress or burnout',
        category: 'Stress / anxiety / avoidance',

        session_length_min: 15,
        session_length_max: 20,
        default_session_length: 17,
        break_duration: 10,

        max_sessions_per_day: 2,
        daily_task_limit: 3,
        task_size_guidance: 'very_small',

        smart_warnings: [
            "It's okay to do less today",
            "Recovery is progress"
        ],
        analytics_tone: 'encouraging',
        auto_reschedule_missed: true,
        require_session_quality: false,

        break_frequency: 45,
        auto_pause_on_background: false,
        hide_analytics: false,
        suppress_morning_reminders: false,
    },

    {
        id: 'night_owl',
        name: 'Night-Owl',
        emoji: '🌙',
        description: 'Optimized for evening/night productivity',
        category: 'Peak energy at night',

        session_length_min: 25,
        session_length_max: 40,
        default_session_length: 30,
        break_duration: 7,

        max_sessions_per_day: 4,
        daily_task_limit: 6,
        task_size_guidance: 'medium',

        smart_warnings: [
            "Avoid starting new heavy tasks after 11 PM",
            "Wind down before sleep"
        ],
        analytics_tone: 'neutral',
        auto_reschedule_missed: false,
        require_session_quality: false,

        break_frequency: 60,
        auto_pause_on_background: false,
        hide_analytics: false,
        suppress_morning_reminders: true,
    },

    {
        id: 'survival_mode',
        name: 'Survival Mode',
        emoji: '🆘',
        description: 'For extremely tough weeks - just show up',
        category: 'Extreme inconsistency / crisis',

        session_length_min: 10,
        session_length_max: 10,
        default_session_length: 10,
        break_duration: 5,

        max_sessions_per_day: 2,
        daily_task_limit: 2,
        task_size_guidance: 'very_small',

        smart_warnings: [
            "One task is enough today",
            "Show up — that's the win"
        ],
        analytics_tone: 'hidden',
        auto_reschedule_missed: true,
        require_session_quality: false,

        break_frequency: 30,
        auto_pause_on_background: true,
        hide_analytics: true,
        suppress_morning_reminders: false,
    },
];

/**
 * Get plan by ID
 */
export function getPlanById(planId: AdaptivePlanId): AdaptivePlan | undefined {
    return ADAPTIVE_PLANS.find(p => p.id === planId);
}

/**
 * Select best plan based on user's study persona
 */
export function selectBestPlan(persona: StudyPersona): AdaptivePlan {
    const planMap: Record<StudyPersona, AdaptivePlanId> = {
        'low_focus_short_session': 'attention_friendly',
        'exam_driven_high_pressure': 'exam_countdown',
        'consistent_overloaded': 'balanced_daily',
        'burnout_recovery': 'burnout_recovery',
        'balanced_learner': 'balanced_daily',
    };

    const planId = planMap[persona];
    return getPlanById(planId) || ADAPTIVE_PLANS[2]; // Default to Balanced Daily
}

/**
 * Get top 3 recommended plans based on profile
 */
export function getRecommendedPlans(
    persona: StudyPersona,
    focusDifficulty?: string,
    consistencySpan?: string,
    peakEnergy?: string
): AdaptivePlan[] {
    const primary = selectBestPlan(persona);
    const alternatives: AdaptivePlan[] = [];

    // Add alternatives based on secondary signals
    if (focusDifficulty === 'very_hard' && primary.id !== 'attention_friendly') {
        alternatives.push(getPlanById('attention_friendly')!);
    }

    if (consistencySpan === '1_2_days' && primary.id !== 'ultra_light_consistency') {
        alternatives.push(getPlanById('ultra_light_consistency')!);
    }

    if (peakEnergy === 'night' && primary.id !== 'night_owl') {
        alternatives.push(getPlanById('night_owl')!);
    }

    // Fill remaining slots with sensible defaults
    if (alternatives.length < 2) {
        if (primary.id !== 'balanced_daily') {
            alternatives.push(getPlanById('balanced_daily')!);
        }
        if (alternatives.length < 2 && primary.id !== 'burnout_recovery') {
            alternatives.push(getPlanById('burnout_recovery')!);
        }
    }

    return [primary, ...alternatives.slice(0, 2)];
}
