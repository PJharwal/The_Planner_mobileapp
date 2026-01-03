import { supabase } from '../lib/supabase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export interface CapacityAdherenceDay {
    date: string;
    tasksCreated: number;
    maxTasks: number;
    focusMinutes: number;
    maxFocus: number;
    isOverTaskLimit: boolean;
    isOverFocusLimit: boolean;
    adherenceScore: number; // 0-100
}

export interface CapacityInsights {
    weeklyAdherence: CapacityAdherenceDay[];
    averageAdherence: number;
    overcapacityDays: number;
    sessionsCompleted: number;
    sessionsRecommended: number;
    sessionCompletionRate: number;
}

/**
 * Get capacity insights for the last 7 days
 */
export async function getCapacityInsights(userId: string): Promise<CapacityInsights | null> {
    try {
        // Get user capacity
        const { data: capacity } = await supabase
            .from('user_capacity')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!capacity) return null;

        const weeklyAdherence: CapacityAdherenceDay[] = [];
        let totalAdherence = 0;
        let overcapacityDays = 0;

        // Calculate adherence for last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = format(subDays(new Date(), i), 'yyyy-MM-dd');

            // Get tasks created on this day
            const { count: tasksCreated } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('created_at::date', date);

            // Get focus minutes on this day
            const { data: sessions } = await supabase
                .from('focus_sessions')
                .select('duration_seconds')
                .eq('user_id', userId)
                .gte('started_at', `${date}T00:00:00`)
                .lt('started_at', `${date}T23:59:59`);

            const focusMinutes = Math.floor(
                (sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0) / 60
            );

            const isOverTaskLimit = (tasksCreated || 0) > capacity.max_tasks_per_day;
            const isOverFocusLimit = focusMinutes > capacity.max_daily_focus_minutes;

            // Calculate adherence score (0-100)
            const taskRatio = Math.min(1, (tasksCreated || 0) / capacity.max_tasks_per_day);
            const focusRatio = Math.min(1, focusMinutes / capacity.max_daily_focus_minutes);
            const adherenceScore = Math.round(((taskRatio + focusRatio) / 2) * 100);

            if (isOverTaskLimit || isOverFocusLimit) {
                overcapacityDays++;
            }

            weeklyAdherence.push({
                date,
                tasksCreated: tasksCreated || 0,
                maxTasks: capacity.max_tasks_per_day,
                focusMinutes,
                maxFocus: capacity.max_daily_focus_minutes,
                isOverTaskLimit,
                isOverFocusLimit,
                adherenceScore,
            });

            totalAdherence += adherenceScore;
        }

        // Get total sessions completed in last 7 days
        const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
        const { count: sessionsCompleted } = await supabase
            .from('focus_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('started_at', `${sevenDaysAgo}T00:00:00`);

        const sessionsRecommended = capacity.recommended_sessions_per_day * 7;
        const sessionCompletionRate = sessionsRecommended > 0
            ? Math.round(((sessionsCompleted || 0) / sessionsRecommended) * 100)
            : 0;

        return {
            weeklyAdherence,
            averageAdherence: Math.round(totalAdherence / 7),
            overcapacityDays,
            sessionsCompleted: sessionsCompleted || 0,
            sessionsRecommended,
            sessionCompletionRate,
        };
    } catch (error) {
        console.error('Error fetching capacity insights:', error);
        return null;
    }
}

/**
 * Get human-readable feedback based on adherence
 */
export function getAdherenceFeedback(averageAdherence: number, overcapacityDays: number): string {
    if (averageAdherence >= 80 && overcapacityDays === 0) {
        return "Great balance! You're working within your capacity.";
    } else if (averageAdherence >= 60 && overcapacityDays <= 1) {
        return "Good rhythm! Consider spreading tasks more evenly.";
    } else if (overcapacityDays >= 3) {
        return "You might be overloading. Try reducing daily tasks.";
    } else if (averageAdherence < 40) {
        return "Room to grow! You have capacity for more focused work.";
    } else {
        return "You're finding your balance. Keep adjusting as needed.";
    }
}

import { glassAccent } from '../constants/glassTheme';

/**
 * Get color for adherence score (Glass Theme: Blue, Mint, Warm)
 */
export function getAdherenceColor(score: number): string {
    if (score >= 80) return glassAccent.blue; // Optimal
    if (score >= 60) return glassAccent.mint; // Healthy
    if (score >= 40) return glassAccent.warm; // Caution
    return glassAccent.warm; // Gentle reminder (no red)
}
