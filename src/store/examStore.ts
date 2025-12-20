import { create } from 'zustand';
import { ExamMode, ExamTask, CreateExamModeInput } from '../types';
import { supabase } from '../lib/supabase';

interface ExamStore {
    exams: ExamMode[];
    activeExam: ExamMode | null;
    examTasks: ExamTask[];
    isLoading: boolean;
    error: string | null;

    fetchExams: () => Promise<void>;
    fetchActiveExam: () => Promise<void>;
    createExam: (input: CreateExamModeInput) => Promise<ExamMode>;
    updateExam: (id: string, updates: Partial<ExamMode>) => Promise<void>;
    deleteExam: (id: string) => Promise<void>;
    addTaskToExam: (examId: string, taskId: string) => Promise<void>;
    removeTaskFromExam: (examTaskId: string) => Promise<void>;
    toggleExamTaskComplete: (examTaskId: string) => Promise<void>;
}

export const useExamStore = create<ExamStore>((set, get) => ({
    exams: [],
    activeExam: null,
    examTasks: [],
    isLoading: false,
    error: null,

    fetchExams: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('exam_modes')
                .select('*')
                .order('exam_date', { ascending: true });

            if (error) throw error;
            set({ exams: data || [], isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchActiveExam: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data: exam, error: examError } = await supabase
                .from('exam_modes')
                .select('*')
                .eq('is_active', true)
                .single();

            if (examError && examError.code !== 'PGRST116') throw examError;

            if (exam) {
                const { data: tasks, error: tasksError } = await supabase
                    .from('exam_tasks')
                    .select('*')
                    .eq('exam_id', exam.id);

                if (tasksError) throw tasksError;

                set({ activeExam: exam, examTasks: tasks || [], isLoading: false });
            } else {
                set({ activeExam: null, examTasks: [], isLoading: false });
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    createExam: async (input: CreateExamModeInput) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Deactivate other exams first
        await supabase
            .from('exam_modes')
            .update({ is_active: false })
            .eq('user_id', user.id);

        const { data, error } = await supabase
            .from('exam_modes')
            .insert({
                ...input,
                user_id: user.id,
                is_active: true,
            })
            .select()
            .single();

        if (error) throw error;

        set({
            exams: [...get().exams, data],
            activeExam: data,
        });
        return data;
    },

    updateExam: async (id: string, updates: Partial<ExamMode>) => {
        const { error } = await supabase
            .from('exam_modes')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        set({
            exams: get().exams.map(e =>
                e.id === id ? { ...e, ...updates } : e
            ),
            activeExam: get().activeExam?.id === id
                ? { ...get().activeExam!, ...updates }
                : get().activeExam,
        });
    },

    deleteExam: async (id: string) => {
        const { error } = await supabase
            .from('exam_modes')
            .delete()
            .eq('id', id);

        if (error) throw error;

        set({
            exams: get().exams.filter(e => e.id !== id),
            activeExam: get().activeExam?.id === id ? null : get().activeExam,
        });
    },

    addTaskToExam: async (examId: string, taskId: string) => {
        const { data, error } = await supabase
            .from('exam_tasks')
            .insert({ exam_id: examId, task_id: taskId })
            .select()
            .single();

        if (error) throw error;

        set({ examTasks: [...get().examTasks, data] });
    },

    removeTaskFromExam: async (examTaskId: string) => {
        const { error } = await supabase
            .from('exam_tasks')
            .delete()
            .eq('id', examTaskId);

        if (error) throw error;

        set({ examTasks: get().examTasks.filter(t => t.id !== examTaskId) });
    },

    toggleExamTaskComplete: async (examTaskId: string) => {
        const task = get().examTasks.find(t => t.id === examTaskId);
        if (!task) return;

        const { error } = await supabase
            .from('exam_tasks')
            .update({ is_completed: !task.is_completed })
            .eq('id', examTaskId);

        if (error) throw error;

        set({
            examTasks: get().examTasks.map(t =>
                t.id === examTaskId ? { ...t, is_completed: !t.is_completed } : t
            ),
        });
    },
}));
