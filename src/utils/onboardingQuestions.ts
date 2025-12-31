import { OnboardingQuestion } from '../types/profile';

/**
 * Onboarding Questions
 * Organized into 7 sections covering all aspects of user profiling
 */
export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
    // Section A: Basic Context
    {
        id: 'age_range',
        section: 'About You',
        question: 'What\'s your age range?',
        type: 'multiple_choice',
        field: 'age_range',
        options: [
            { value: 'under_16', label: 'Under 16' },
            { value: '16_18', label: '16-18' },
            { value: '19_25', label: '19-25' },
            { value: '26_plus', label: '26+' },
        ],
    },
    {
        id: 'role',
        section: 'About You',
        question: 'Your current role?',
        type: 'multiple_choice',
        field: 'role',
        options: [
            { value: 'school', label: 'School student' },
            { value: 'college', label: 'College / university student' },
            { value: 'professional', label: 'Working professional' },
            { value: 'exam_prep', label: 'Preparing for competitive exams' },
        ],
    },
    {
        id: 'primary_goal',
        section: 'About You',
        question: 'Main reason for using this app?',
        type: 'multiple_choice',
        field: 'primary_goal',
        options: [
            { value: 'consistency', label: 'Build daily consistency', description: 'Form study habits' },
            { value: 'exams', label: 'Prepare for exams', description: 'Ace upcoming tests' },
            { value: 'overload', label: 'Manage overload', description: 'Too much to do' },
            { value: 'habits', label: 'Build better study habits', description: 'Improve effectiveness' },
        ],
    },

    // Section B: Attention & Focus
    {
        id: 'focus_difficulty',
        section: 'Focus & Attention',
        question: 'How hard is it for you to stay focused?',
        helper: 'Be honest - this helps us adjust session lengths and task volumes.',
        type: 'multiple_choice',
        field: 'focus_difficulty',
        options: [
            { value: 'easy', label: 'I focus easily' },
            { value: 'sometimes', label: 'Sometimes distracted' },
            { value: 'often', label: 'Often distracted' },
            { value: 'very_hard', label: 'Very hard to stay focused' },
        ],
    },
    {
        id: 'attention_diagnosis',
        section: 'Focus & Attention',
        question: 'Have you ever been diagnosed with an attention-related condition?',
        helper: 'This is not medical data. We use it only to adjust session length and task volume.',
        type: 'multiple_choice',
        field: 'attention_diagnosis',
        options: [
            { value: 'no', label: 'No' },
            { value: 'yes_adhd', label: 'Yes (ADHD / ADD)' },
            { value: 'suspected', label: 'Suspected but not diagnosed' },
            { value: 'no_say', label: 'Prefer not to say' },
        ],
    },

    // Section C: Energy & Time Reality
    {
        id: 'peak_energy_time',
        section: 'Energy & Time',
        question: 'When do you feel most mentally active?',
        type: 'multiple_choice',
        field: 'peak_energy_time',
        options: [
            { value: 'early_morning', label: 'Early morning', description: '5am - 9am' },
            { value: 'late_morning', label: 'Late morning', description: '9am - 12pm' },
            { value: 'afternoon', label: 'Afternoon', description: '12pm - 6pm' },
            { value: 'night', label: 'Night', description: '6pm - 12am' },
        ],
    },
    {
        id: 'daily_focus_capacity',
        section: 'Energy & Time',
        question: 'How much focused work can you realistically do per day?',
        helper: 'Think about your actual capacity, not ideal goals.',
        type: 'multiple_choice',
        field: 'daily_focus_capacity',
        options: [
            { value: 'less_1h', label: 'Less than 1 hour' },
            { value: '1_2h', label: '1-2 hours' },
            { value: '2_4h', label: '2-4 hours' },
            { value: 'more_4h', label: 'More than 4 hours' },
        ],
    },
    {
        id: 'main_drain',
        section: 'Energy & Time',
        question: 'What drains your energy the most?',
        type: 'multiple_choice',
        field: 'main_drain',
        options: [
            { value: 'mental', label: 'Mental fatigue', description: 'Brain feels tired' },
            { value: 'phone', label: 'Phone / social media', description: 'Digital distractions' },
            { value: 'stress', label: 'Stress or anxiety', description: 'Emotional pressure' },
            { value: 'too_many_tasks', label: 'Too many tasks', description: 'Overwhelmed by volume' },
        ],
    },

    // Section D: Consistency & Failure Patterns
    {
        id: 'consistency_span',
        section: 'Your Patterns',
        question: 'How long do you usually follow a plan before breaking it?',
        helper: 'No judgment - we all struggle with consistency.',
        type: 'multiple_choice',
        field: 'consistency_span',
        options: [
            { value: '1_2_days', label: '1-2 days' },
            { value: '3_5_days', label: '3-5 days' },
            { value: '1_2_weeks', label: '1-2 weeks' },
            { value: 'more_2_weeks', label: 'More than 2 weeks' },
        ],
    },
    {
        id: 'miss_day_response',
        section: 'Your Patterns',
        question: 'When you miss a planned day, what usually happens next?',
        type: 'multiple_choice',
        field: 'miss_day_response',
        options: [
            { value: 'resume', label: 'I resume the next day', description: 'Keep going' },
            { value: 'guilty_delay', label: 'I feel guilty and delay', description: 'Guilt spiral' },
            { value: 'abandon', label: 'I abandon the plan', description: 'Start over later' },
            { value: 'depends_mood', label: 'It depends on my mood', description: 'Unpredictable' },
        ],
    },
    {
        id: 'overload_response',
        section: 'Your Patterns',
        question: 'When tasks pile up, what do you usually do?',
        type: 'multiple_choice',
        field: 'overload_response',
        options: [
            { value: 'reschedule', label: 'Calmly reschedule', description: 'Adjust priorities' },
            { value: 'rush_stress', label: 'Rush and feel stressed', description: 'Power through' },
            { value: 'avoid', label: 'Avoid them', description: 'Procrastinate' },
            { value: 'pause', label: 'Pause completely for a while', description: 'Take a break' },
        ],
    },

    // Section E: Planning Style & Guidance
    {
        id: 'planning_style',
        section: 'How You Plan',
        question: 'How do you prefer to plan your work?',
        type: 'multiple_choice',
        field: 'planning_style',
        options: [
            { value: 'daily', label: 'Decide daily', description: 'Day by day' },
            { value: 'weekly', label: 'Plan weekly', description: 'Week ahead' },
            { value: 'advance', label: 'Plan everything in advance', description: 'Long-term' },
            { value: 'guide_me', label: 'I want the app to guide me', description: 'Auto-plan' },
        ],
    },
    {
        id: 'guidance_level',
        section: 'How You Plan',
        question: 'How much guidance do you want from the app?',
        type: 'multiple_choice',
        field: 'guidance_level',
        options: [
            { value: 'minimal', label: 'Minimal', description: 'I lead, app supports' },
            { value: 'balanced', label: 'Balanced', description: 'Collaborate with app' },
            { value: 'strong', label: 'Strong guidance', description: 'App leads more' },
            { value: 'decide_all', label: 'Decide everything for me', description: 'Full auto-pilot' },
        ],
    },

    // Section F: Exams & Pressure
    {
        id: 'exam_proximity',
        section: 'Exams & Deadlines',
        question: 'Are you preparing for a major exam or deadline?',
        type: 'multiple_choice',
        field: 'exam_proximity',
        options: [
            { value: 'within_1m', label: 'Yes, within 1 month' },
            { value: 'within_3_6m', label: 'Yes, within 3-6 months' },
            { value: 'later', label: 'Yes, but later' },
            { value: 'no', label: 'No' },
        ],
    },

    // Section G: Open Text
    {
        id: 'biggest_struggle',
        section: 'Tell Us More',
        question: 'What is your biggest struggle with studying or work right now?',
        helper: 'Optional - helps us understand you better.',
        type: 'text_input',
        field: 'biggest_struggle',
        maxLength: 200,
    },
    {
        id: 'personal_notes',
        section: 'Tell Us More',
        question: 'Anything important you want this app to know about you?',
        helper: 'Completely optional.',
        type: 'text_input',
        field: 'personal_notes',
        maxLength: 200,
    },
];

/**
 * Get questions grouped by section
 */
export function getQuestionsBySection() {
    const sections: Record<string, OnboardingQuestion[]> = {};

    ONBOARDING_QUESTIONS.forEach(question => {
        if (!sections[question.section]) {
            sections[question.section] = [];
        }
        sections[question.section].push(question);
    });

    return sections;
}

/**
 * Get section names in order
 */
export function getSectionNames(): string[] {
    const sections = getQuestionsBySection();
    return Object.keys(sections);
}
