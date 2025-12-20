// Data Export Utility - Manual backup to JSON
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Alert, Clipboard, Platform } from 'react-native';

export interface ExportData {
    exportVersion: string;
    exportedAt: string;
    user: { id: string; email: string | undefined };
    subjects: any[];
    topics: any[];
    subTopics: any[];
    tasks: any[];
    todayTasks: any[];
    focusSessions: any[];
    dailyNotes: any[];
    dailyReflections: any[];
    examModes: any[];
}

/**
 * Fetch all user data for export
 */
export async function fetchExportData(): Promise<ExportData | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Not authenticated');
        }

        // Fetch all data in parallel
        const [
            { data: subjects },
            { data: topics },
            { data: subTopics },
            { data: tasks },
            { data: todayTasks },
            { data: focusSessions },
            { data: dailyNotes },
            { data: dailyReflections },
            { data: examModes },
        ] = await Promise.all([
            supabase.from('subjects').select('*').order('created_at'),
            supabase.from('topics').select('*').order('created_at'),
            supabase.from('sub_topics').select('*').order('created_at'),
            supabase.from('tasks').select('*').order('created_at'),
            supabase.from('today_tasks').select('*').order('added_at'),
            supabase.from('focus_sessions').select('*').order('started_at'),
            supabase.from('daily_notes').select('*').order('created_at'),
            supabase.from('daily_reflections').select('*').order('reflection_date'),
            supabase.from('exam_modes').select('*').order('exam_date'),
        ]);

        const exportData: ExportData = {
            exportVersion: '1.0',
            exportedAt: new Date().toISOString(),
            user: { id: user.id, email: user.email },
            subjects: subjects || [],
            topics: topics || [],
            subTopics: subTopics || [],
            tasks: tasks || [],
            todayTasks: todayTasks || [],
            focusSessions: focusSessions || [],
            dailyNotes: dailyNotes || [],
            dailyReflections: dailyReflections || [],
            examModes: examModes || [],
        };

        return exportData;

    } catch (error) {
        console.error('[DataExport] Error fetching data:', error);
        return null;
    }
}

/**
 * Generate export summary
 */
export function getExportSummary(data: ExportData): string {
    return `Study Data Export
─────────────────
Exported: ${format(new Date(data.exportedAt), 'PPpp')}

Contents:
• ${data.subjects.length} Subjects
• ${data.topics.length} Topics
• ${data.subTopics.length} Sub-Topics
• ${data.tasks.length} Tasks
• ${data.focusSessions.length} Focus Sessions
• ${data.dailyNotes.length} Notes
• ${data.dailyReflections.length} Reflections
• ${data.examModes.length} Exams`.trim();
}

/**
 * Export data and copy to clipboard
 */
export async function exportAndShare(): Promise<{ success: boolean; message: string }> {
    try {
        // Fetch all data
        const data = await fetchExportData();
        if (!data) {
            return { success: false, message: 'Failed to fetch data' };
        }

        // Generate JSON
        const jsonContent = JSON.stringify(data, null, 2);

        // Copy to clipboard
        if (Platform.OS === 'web') {
            await navigator.clipboard.writeText(jsonContent);
        } else {
            Clipboard.setString(jsonContent);
        }

        const summary = getExportSummary(data);

        // Show success alert
        Alert.alert(
            'Data Exported',
            `Your study data has been copied to clipboard.\n\n${summary}\n\nPaste it into a text file to save.`,
            [{ text: 'OK' }]
        );

        return {
            success: true,
            message: `Copied to clipboard!\n\n${summary}`
        };

    } catch (error: any) {
        console.error('[DataExport] Export error:', error);
        return {
            success: false,
            message: error.message || 'Export failed'
        };
    }
}

/**
 * Get data counts for preview
 */
export async function getDataCounts(): Promise<Record<string, number>> {
    try {
        const [
            { count: subjects },
            { count: topics },
            { count: subTopics },
            { count: tasks },
            { count: sessions },
            { count: notes },
        ] = await Promise.all([
            supabase.from('subjects').select('*', { count: 'exact', head: true }),
            supabase.from('topics').select('*', { count: 'exact', head: true }),
            supabase.from('sub_topics').select('*', { count: 'exact', head: true }),
            supabase.from('tasks').select('*', { count: 'exact', head: true }),
            supabase.from('focus_sessions').select('*', { count: 'exact', head: true }),
            supabase.from('daily_notes').select('*', { count: 'exact', head: true }),
        ]);

        return {
            subjects: subjects || 0,
            topics: topics || 0,
            subTopics: subTopics || 0,
            tasks: tasks || 0,
            sessions: sessions || 0,
            notes: notes || 0,
        };
    } catch (error) {
        console.error('[DataExport] Error getting counts:', error);
        return {};
    }
}
