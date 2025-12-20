// Weekly Review Generator
import { supabase } from '../lib/supabase';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export interface WeeklyReview {
    weekStart: string;
    tasksCompleted: number;
    tasksMissed: number;
    totalStudyMinutes: number;
    bestDay: string | null;
    weakSubject: { id: string; name: string } | null;
    improvement: number; // percentage change from last week
    completionRate: number;
    dailyBreakdown: { day: string; count: number }[];
}

/**
 * Generate weekly review for the current week
 */
export async function generateWeeklyReview(): Promise<WeeklyReview | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

        // Get completed tasks this week
        const { count: tasksCompleted } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('is_completed', true)
            .gte('completed_at', weekStartStr)
            .lte('completed_at', weekEndStr);

        // Get missed tasks (overdue and not completed)
        const today = format(new Date(), 'yyyy-MM-dd');
        const { count: tasksMissed } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('is_completed', false)
            .lt('due_date', today)
            .gte('due_date', weekStartStr);

        // Get study time this week
        const { data: sessions } = await supabase
            .from('study_sessions')
            .select('duration_seconds, started_at')
            .gte('started_at', weekStartStr)
            .lte('started_at', weekEndStr);

        const totalSeconds = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0;
        const totalStudyMinutes = Math.floor(totalSeconds / 60);

        // Calculate daily breakdown and find best day
        const dailyBreakdown: { day: string; count: number }[] = [];
        let bestDay: string | null = null;
        let bestDayCount = 0;

        for (const day of days) {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayName = format(day, 'EEEE');

            const { count } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('is_completed', true)
                .gte('completed_at', `${dateStr}T00:00:00`)
                .lt('completed_at', `${dateStr}T23:59:59`);

            const dayCount = count || 0;
            dailyBreakdown.push({ day: dayName.substring(0, 3), count: dayCount });

            if (dayCount > bestDayCount) {
                bestDayCount = dayCount;
                bestDay = dayName;
            }
        }

        // Find weak subject (lowest completion rate)
        const { data: subjects } = await supabase
            .from('subjects')
            .select('id, name');

        let weakSubject: { id: string; name: string } | null = null;
        let lowestRate = Infinity;

        for (const subject of subjects || []) {
            const { data: topics } = await supabase
                .from('topics')
                .select('id')
                .eq('subject_id', subject.id);

            if (!topics || topics.length === 0) continue;

            const topicIds = topics.map(t => t.id);

            const { count: total } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .in('topic_id', topicIds);

            const { count: completed } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .in('topic_id', topicIds)
                .eq('is_completed', true);

            if (total && total > 0) {
                const rate = (completed || 0) / total;
                if (rate < lowestRate) {
                    lowestRate = rate;
                    weakSubject = { id: subject.id, name: subject.name };
                }
            }
        }

        // Calculate improvement from last week
        const lastWeekStart = format(subDays(weekStart, 7), 'yyyy-MM-dd');
        const lastWeekEnd = format(subDays(weekStart, 1), 'yyyy-MM-dd');

        const { count: lastWeekCompleted } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('is_completed', true)
            .gte('completed_at', lastWeekStart)
            .lte('completed_at', lastWeekEnd);

        let improvement = 0;
        if (lastWeekCompleted && lastWeekCompleted > 0) {
            improvement = Math.round((((tasksCompleted || 0) - lastWeekCompleted) / lastWeekCompleted) * 100);
        }

        // Calculate completion rate
        const totalTasks = (tasksCompleted || 0) + (tasksMissed || 0);
        const completionRate = totalTasks > 0 ? Math.round(((tasksCompleted || 0) / totalTasks) * 100) : 0;

        return {
            weekStart: weekStartStr,
            tasksCompleted: tasksCompleted || 0,
            tasksMissed: tasksMissed || 0,
            totalStudyMinutes,
            bestDay,
            weakSubject,
            improvement,
            completionRate,
            dailyBreakdown,
        };

    } catch (error) {
        console.error('Error generating weekly review:', error);
        return null;
    }
}
