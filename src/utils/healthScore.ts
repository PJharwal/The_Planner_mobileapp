// Subject Health Score Calculator
// Calculates health score based on completion, consistency, time, and missed tasks

import { supabase } from '../lib/supabase';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export type HealthLevel = 'strong' | 'good' | 'needs_attention' | 'critical';

export interface SubjectHealth {
    subjectId: string;
    subjectName: string;
    subjectColor: string;
    score: number; // 0-100
    level: HealthLevel;
    completionRate: number;
    consistency: number;
    studyMinutes: number;
    missedCount: number;
}

/**
 * Calculate health score for a subject
 * Formula:
 * - Completion rate: 40%
 * - Consistency: 25%
 * - Time spent: 25%
 * - Missed frequency: 10%
 */
export async function calculateSubjectHealth(subjectId: string): Promise<SubjectHealth | null> {
    try {
        // Get subject info
        const { data: subject } = await supabase
            .from('subjects')
            .select('id, name, color')
            .eq('id', subjectId)
            .single();

        if (!subject) return null;

        // Get all topics for this subject
        const { data: topics } = await supabase
            .from('topics')
            .select('id')
            .eq('subject_id', subjectId);

        const topicIds = topics?.map(t => t.id) || [];

        if (topicIds.length === 0) {
            return {
                subjectId,
                subjectName: subject.name,
                subjectColor: subject.color,
                score: 50, // Neutral for no tasks
                level: 'good',
                completionRate: 0,
                consistency: 0,
                studyMinutes: 0,
                missedCount: 0,
            };
        }

        // Get all tasks for these topics
        const { data: tasks } = await supabase
            .from('tasks')
            .select('id, is_completed, due_date, completed_at')
            .in('topic_id', topicIds);

        if (!tasks || tasks.length === 0) {
            return {
                subjectId,
                subjectName: subject.name,
                subjectColor: subject.color,
                score: 50,
                level: 'good',
                completionRate: 0,
                consistency: 0,
                studyMinutes: 0,
                missedCount: 0,
            };
        }

        // 1. Calculate completion rate (40%)
        const completedTasks = tasks.filter(t => t.is_completed).length;
        const completionRate = completedTasks / tasks.length;

        // 2. Calculate consistency (25%) - days with activity in last 14 days
        const last14Days = eachDayOfInterval({
            start: subDays(new Date(), 13),
            end: new Date(),
        });

        let activeDays = 0;
        for (const day of last14Days) {
            const dateStr = format(day, 'yyyy-MM-dd');
            const hasActivity = tasks.some(t =>
                t.completed_at && t.completed_at.startsWith(dateStr)
            );
            if (hasActivity) activeDays++;
        }
        const consistency = activeDays / 14;

        // 3. Get study time (25%) - from study_sessions
        const taskIds = tasks.map(t => t.id);
        const { data: sessions } = await supabase
            .from('study_sessions')
            .select('duration_seconds')
            .in('task_id', taskIds);

        const totalSeconds = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0;
        const studyMinutes = Math.round(totalSeconds / 60);

        // Normalize study time (cap at 600 minutes = 10 hours for max score)
        const studyScore = Math.min(studyMinutes / 600, 1);

        // 4. Calculate missed frequency (10%)
        const today = format(new Date(), 'yyyy-MM-dd');
        const missedTasks = tasks.filter(t =>
            !t.is_completed && t.due_date && t.due_date < today
        ).length;
        const missedFrequency = tasks.length > 0 ? missedTasks / tasks.length : 0;

        // Calculate final score
        const score = Math.round(
            (completionRate * 0.4 +
                consistency * 0.25 +
                studyScore * 0.25 +
                (1 - missedFrequency) * 0.1) * 100
        );

        // Determine level
        let level: HealthLevel;
        if (score >= 75) level = 'strong';
        else if (score >= 55) level = 'good';
        else if (score >= 35) level = 'needs_attention';
        else level = 'critical';

        return {
            subjectId,
            subjectName: subject.name,
            subjectColor: subject.color,
            score,
            level,
            completionRate: Math.round(completionRate * 100),
            consistency: Math.round(consistency * 100),
            studyMinutes,
            missedCount: missedTasks,
        };

    } catch (error) {
        console.error('Health score error:', error);
        return null;
    }
}

/**
 * Get health scores for all subjects
 */
export async function getAllSubjectHealthScores(): Promise<SubjectHealth[]> {
    try {
        const { data: subjects } = await supabase
            .from('subjects')
            .select('id');

        if (!subjects) return [];

        const healthScores = await Promise.all(
            subjects.map(s => calculateSubjectHealth(s.id))
        );

        return healthScores.filter((h): h is SubjectHealth => h !== null);

    } catch (error) {
        console.error('Get all health scores error:', error);
        return [];
    }
}

/**
 * Get the health level color
 */
export function getHealthColor(level: HealthLevel): string {
    switch (level) {
        case 'strong': return '#22C55E';
        case 'good': return '#38BDF8';
        case 'needs_attention': return '#FACC15';
        case 'critical': return '#EF4444';
    }
}

/**
 * Get the health level label
 */
export function getHealthLabel(level: HealthLevel): string {
    switch (level) {
        case 'strong': return 'Strong';
        case 'good': return 'Good';
        case 'needs_attention': return 'Needs Attention';
        case 'critical': return 'Critical';
    }
}
