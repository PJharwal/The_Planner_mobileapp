// Profile and Onboarding Types

export type AgeRange = 'under_16' | '16_18' | '19_25' | '26_plus';
export type Role = 'school' | 'college' | 'professional' | 'exam_prep';
export type PrimaryGoal = 'consistency' | 'exams' | 'overload' | 'habits';
export type FocusDifficulty = 'easy' | 'sometimes' | 'often' | 'very_hard';
export type AttentionDiagnosis = 'no' | 'yes_adhd' | 'suspected' | 'no_say';
export type PeakEnergyTime = 'early_morning' | 'late_morning' | 'afternoon' | 'night';
export type DailyFocusCapacity = 'less_1h' | '1_2h' | '2_4h' | 'more_4h';
export type MainDrain = 'mental' | 'phone' | 'stress' | 'too_many_tasks';
export type ConsistencySpan = '1_2_days' | '3_5_days' | '1_2_weeks' | 'more_2_weeks';
export type MissDayResponse = 'resume' | 'guilty_delay' | 'abandon' | 'depends_mood';
export type OverloadResponse = 'reschedule' | 'rush_stress' | 'avoid' | 'pause';
export type PlanningStyle = 'daily' | 'weekly' | 'advance' | 'guide_me';
export type GuidanceLevel = 'minimal' | 'balanced' | 'strong' | 'decide_all';
export type ExamProximity = 'within_1m' | 'within_3_6m' | 'later' | 'no';

export type StudyPersona =
    | 'low_focus_short_session'
    | 'exam_driven_high_pressure'
    | 'consistent_overloaded'
    | 'burnout_recovery'
    | 'balanced_learner';

export interface UserProfileInsights {
    user_id: string;
    age_range: AgeRange | null;
    role: Role | null;
    primary_goal: PrimaryGoal | null;
    focus_difficulty: FocusDifficulty | null;
    attention_diagnosis: AttentionDiagnosis | null;
    peak_energy_time: PeakEnergyTime | null;
    daily_focus_capacity: DailyFocusCapacity | null;
    main_drain: MainDrain | null;
    consistency_span: ConsistencySpan | null;
    miss_day_response: MissDayResponse | null;
    overload_response: OverloadResponse | null;
    planning_style: PlanningStyle | null;
    guidance_level: GuidanceLevel | null;
    exam_proximity: ExamProximity | null;
    biggest_struggle: string | null;
    personal_notes: string | null;
    study_persona: StudyPersona | null;
    selected_plan_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface AdaptivePlan {
    id: string;
    name: string;
    description: string;
    emoji: string;
    recommended_for: StudyPersona[];
    daily_task_limit: number;
    default_session_length: number; // minutes
    resurfacing_frequency: 'low' | 'medium' | 'high';
    reminder_intensity: 'minimal' | 'moderate' | 'frequent';
    break_frequency: number; // minutes between breaks
}

export interface OnboardingQuestion {
    id: string;
    section: string;
    question: string;
    helper?: string;
    type: 'multiple_choice' | 'text_input';
    layout?: 'card' | 'scale';
    options?: { value: string; label: string; description?: string }[];
    field: keyof UserProfileInsights;
    maxLength?: number;
}
