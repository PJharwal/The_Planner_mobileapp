// Study Insights - Analytics generation for learning intelligence
// Detects patterns in focus sessions to provide soft, helpful insights

import { supabase } from '../lib/supabase';
import { StudyInsight, FocusSession } from '../types';
import { format, subDays, startOfWeek, endOfWeek, differenceInDays, parseISO } from 'date-fns';

interface HourlyBreakdown {
    hour: number;
    totalMinutes: number;
    sessionCount: number;
    avgQuality: number; // 0-1 scale
}

/**
 * Detect best study times from focus session patterns
 */
export async function detectBestStudyTime(userId: string): Promise<StudyInsight | null> {
    try {
        // Get sessions from last 30 days
        const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

        const { data: sessions } = await supabase
            .from('focus_sessions')
            .select('started_at, duration_seconds, quality_rating')
            .eq('user_id', userId)
            .gte('started_at', thirtyDaysAgo)
            .order('started_at', { ascending: false });

        if (!sessions || sessions.length < 5) return null;

        // Group sessions by hour of day
        const hourly: Record<number, { minutes: number; count: number; quality: number[] }> = {};

        sessions.forEach(session => {
            const hour = new Date(session.started_at).getHours();
            if (!hourly[hour]) {
                hourly[hour] = { minutes: 0, count: 0, quality: [] };
            }
            hourly[hour].minutes += Math.floor(session.duration_seconds / 60);
            hourly[hour].count += 1;
            if (session.quality_rating === 'focused') hourly[hour].quality.push(1);
            else if (session.quality_rating === 'okay') hourly[hour].quality.push(0.5);
            else if (session.quality_rating === 'distracted') hourly[hour].quality.push(0);
        });

        // Find the best time slot (most productive hours)
        const hourlyArray = Object.entries(hourly)
            .map(([hour, data]) => ({
                hour: parseInt(hour),
                avgMinutes: data.minutes / data.count,
                sessionCount: data.count,
                avgQuality: data.quality.length > 0
                    ? data.quality.reduce((a, b) => a + b, 0) / data.quality.length
                    : 0.5,
            }))
            .filter(h => h.sessionCount >= 2) // At least 2 sessions
            .sort((a, b) => {
                // Score = avg minutes * (1 + quality bonus)
                const scoreA = a.avgMinutes * (1 + a.avgQuality);
                const scoreB = b.avgMinutes * (1 + b.avgQuality);
                return scoreB - scoreA;
            });

        if (hourlyArray.length === 0) return null;

        const bestHour = hourlyArray[0];
        const timeLabel = formatTimeRange(bestHour.hour);

        return {
            type: 'best_time',
            title: `You focus best ${timeLabel}`,
            description: `Your sessions around this time tend to be ${Math.round(bestHour.avgMinutes)} minutes on average.`,
            data: { hour: bestHour.hour, avgMinutes: bestHour.avgMinutes },
            dismissible: true,
        };
    } catch (error) {
        console.error('Error detecting best study time:', error);
        return null;
    }
}

function formatTimeRange(hour: number): string {
    if (hour >= 5 && hour < 12) return 'in the morning';
    if (hour >= 12 && hour < 17) return 'in the afternoon';
    if (hour >= 17 && hour < 21) return 'in the evening';
    return 'late at night';
}

/**
 * Calculate study consistency (days studied this week)
 */
export async function calculateConsistency(userId: string): Promise<StudyInsight | null> {
    try {
        const startOfWeekDate = startOfWeek(new Date(), { weekStartsOn: 1 });
        const endOfWeekDate = endOfWeek(new Date(), { weekStartsOn: 1 });

        const { data: sessions } = await supabase
            .from('focus_sessions')
            .select('started_at')
            .eq('user_id', userId)
            .gte('started_at', startOfWeekDate.toISOString())
            .lte('started_at', endOfWeekDate.toISOString());

        if (!sessions) return null;

        // Count unique days
        const uniqueDays = new Set(
            sessions.map(s => format(new Date(s.started_at), 'yyyy-MM-dd'))
        );

        const daysStudied = uniqueDays.size;
        const dayOfWeek = new Date().getDay() || 7; // 1-7

        if (daysStudied === 0) return null;

        let description = '';
        if (daysStudied >= dayOfWeek) {
            description = 'Great consistency! You\'ve studied every day so far.';
        } else if (daysStudied >= dayOfWeek - 1) {
            description = 'Good consistency this week!';
        } else {
            description = `${daysStudied} out of ${dayOfWeek} days this week.`;
        }

        return {
            type: 'consistency',
            title: `${daysStudied} day${daysStudied !== 1 ? 's' : ''} of study this week`,
            description,
            data: { daysStudied, dayOfWeek },
            dismissible: true,
        };
    } catch (error) {
        console.error('Error calculating consistency:', error);
        return null;
    }
}

/**
 * Calculate study intensity (average session length)
 */
export async function calculateIntensity(userId: string): Promise<StudyInsight | null> {
    try {
        const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

        const { data: sessions } = await supabase
            .from('focus_sessions')
            .select('duration_seconds')
            .eq('user_id', userId)
            .gte('started_at', thirtyDaysAgo);

        if (!sessions || sessions.length < 3) return null;

        const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_seconds / 60, 0);
        const avgMinutes = Math.round(totalMinutes / sessions.length);

        let description = '';
        if (avgMinutes >= 45) {
            description = 'Your deep work sessions are impressive!';
        } else if (avgMinutes >= 25) {
            description = 'Solid focus sessions.';
        } else {
            description = 'Short but consistent sessions work too.';
        }

        return {
            type: 'intensity',
            title: `${avgMinutes} min average session`,
            description,
            data: { avgMinutes, sessionCount: sessions.length },
            dismissible: true,
        };
    } catch (error) {
        console.error('Error calculating intensity:', error);
        return null;
    }
}

/**
 * Get all insights for a user
 */
export async function getAllInsights(userId: string): Promise<StudyInsight[]> {
    const insights: StudyInsight[] = [];

    const [bestTime, consistency, intensity] = await Promise.all([
        detectBestStudyTime(userId),
        calculateConsistency(userId),
        calculateIntensity(userId),
    ]);

    if (bestTime) insights.push(bestTime);
    if (consistency) insights.push(consistency);
    if (intensity) insights.push(intensity);

    return insights;
}

/**
 * Generate weekly review summary
 */
export async function generateWeeklyReview(userId: string): Promise<{
    tasksCompleted: number;
    studyMinutes: number;
    daysActive: number;
    topSubject?: string;
} | null> {
    try {
        const startOfWeekDate = startOfWeek(new Date(), { weekStartsOn: 1 });

        // Tasks completed this week
        const { count: tasksCompleted } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_completed', true)
            .gte('completed_at', startOfWeekDate.toISOString());

        // Study time this week
        const { data: sessions } = await supabase
            .from('focus_sessions')
            .select('duration_seconds, subject_id, started_at')
            .eq('user_id', userId)
            .gte('started_at', startOfWeekDate.toISOString());

        const studyMinutes = sessions
            ? Math.round(sessions.reduce((sum, s) => sum + s.duration_seconds / 60, 0))
            : 0;

        // Days active
        const uniqueDays = sessions
            ? new Set(sessions.map(s => format(new Date(s.started_at), 'yyyy-MM-dd')))
            : new Set();

        return {
            tasksCompleted: tasksCompleted || 0,
            studyMinutes,
            daysActive: uniqueDays.size,
        };
    } catch (error) {
        console.error('Error generating weekly review:', error);
        return null;
    }
}
