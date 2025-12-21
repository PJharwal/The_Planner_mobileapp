import { create } from 'zustand';
import { Task, TaskNote, CreateTaskInput, TaskWithNotes } from '../types';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface TaskStore {
    tasks: Task[];
    todayTasks: Task[];
    currentTask: TaskWithNotes | null;
    isLoading: boolean;
    error: string | null;

    fetchTasksByTopic: (topicId: string) => Promise<void>;
    fetchTodayTasks: () => Promise<void>;
    fetchTaskWithNotes: (id: string) => Promise<void>;
    createTask: (input: CreateTaskInput) => Promise<Task>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    toggleTaskComplete: (id: string) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    addTaskNote: (taskId: string, content: string) => Promise<TaskNote>;
    deleteTaskNote: (noteId: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
    tasks: [],
    todayTasks: [],
    currentTask: null,
    isLoading: false,
    error: null,

    fetchTasksByTopic: async (topicId: string) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('topic_id', topicId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            set({ tasks: data || [], isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchTodayTasks: async () => {
        set({ isLoading: true, error: null });
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('due_date', today)
                .order('priority', { ascending: false });

            if (error) throw error;
            set({ todayTasks: data || [], isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchTaskWithNotes: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const { data: task, error: taskError } = await supabase
                .from('tasks')
                .select('*')
                .eq('id', id)
                .single();

            if (taskError) throw taskError;

            const { data: notes, error: notesError } = await supabase
                .from('task_notes')
                .select('*')
                .eq('task_id', id)
                .order('created_at', { ascending: false });

            if (notesError) throw notesError;

            set({
                currentTask: { ...task, notes: notes || [] },
                isLoading: false
            });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    createTask: async (input: CreateTaskInput) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Validate required fields
        if (!input.sub_topic_id) {
            throw new Error('Sub-topic ID is required. Please create a subject and topic first.');
        }
        if (!input.title?.trim()) {
            throw new Error('Task title is required.');
        }

        // Default due_date to today if not provided
        const due_date = input.due_date || format(new Date(), 'yyyy-MM-dd');

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                ...input,
                user_id: user.id,
                priority: input.priority || 'medium',
                due_date: due_date,
            })
            .select()
            .single();

        if (error) throw error;

        set({ tasks: [data, ...get().tasks] });
        return data;
    },

    updateTask: async (id: string, updates: Partial<Task>) => {
        const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        set({
            tasks: get().tasks.map(t =>
                t.id === id ? { ...t, ...updates } : t
            ),
            todayTasks: get().todayTasks.map(t =>
                t.id === id ? { ...t, ...updates } : t
            ),
        });
    },

    toggleTaskComplete: async (id: string) => {
        const task = get().tasks.find(t => t.id === id) ||
            get().todayTasks.find(t => t.id === id);
        if (!task) return;

        const updates = {
            is_completed: !task.is_completed,
            completed_at: !task.is_completed ? new Date().toISOString() : undefined,
        };

        const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        set({
            tasks: get().tasks.map(t =>
                t.id === id ? { ...t, ...updates } : t
            ),
            todayTasks: get().todayTasks.map(t =>
                t.id === id ? { ...t, ...updates } : t
            ),
        });
    },

    deleteTask: async (id: string) => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;

        set({
            tasks: get().tasks.filter(t => t.id !== id),
            todayTasks: get().todayTasks.filter(t => t.id !== id),
        });
    },

    addTaskNote: async (taskId: string, content: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('task_notes')
            .insert({
                task_id: taskId,
                user_id: user.id,
                content,
            })
            .select()
            .single();

        if (error) throw error;

        const current = get().currentTask;
        if (current && current.id === taskId) {
            set({
                currentTask: {
                    ...current,
                    notes: [data, ...current.notes],
                },
            });
        }

        return data;
    },

    deleteTaskNote: async (noteId: string) => {
        const { error } = await supabase
            .from('task_notes')
            .delete()
            .eq('id', noteId);

        if (error) throw error;

        const current = get().currentTask;
        if (current) {
            set({
                currentTask: {
                    ...current,
                    notes: current.notes.filter(n => n.id !== noteId),
                },
            });
        }
    },
}));
