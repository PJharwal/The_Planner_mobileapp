import { create } from 'zustand';
import { Subject, Topic, CreateSubjectInput, CreateTopicInput, SubjectWithTopics } from '../types';
import { supabase } from '../lib/supabase';

interface SubjectStore {
    subjects: Subject[];
    currentSubject: SubjectWithTopics | null;
    isLoading: boolean;
    error: string | null;

    fetchSubjects: () => Promise<void>;
    fetchSubjectWithTopics: (id: string) => Promise<void>;
    createSubject: (input: CreateSubjectInput) => Promise<Subject>;
    updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
    deleteSubject: (id: string) => Promise<void>;
    createTopic: (input: CreateTopicInput) => Promise<Topic>;
    deleteTopic: (id: string) => Promise<void>;
}

export const useSubjectStore = create<SubjectStore>((set, get) => ({
    subjects: [],
    currentSubject: null,
    isLoading: false,
    error: null,

    fetchSubjects: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            set({ subjects: data || [], isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchSubjectWithTopics: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const { data: subject, error: subjectError } = await supabase
                .from('subjects')
                .select('*')
                .eq('id', id)
                .single();

            if (subjectError) throw subjectError;

            const { data: topics, error: topicsError } = await supabase
                .from('topics')
                .select('*')
                .eq('subject_id', id)
                .order('order_index', { ascending: true });

            if (topicsError) throw topicsError;

            set({
                currentSubject: { ...subject, topics: topics || [] },
                isLoading: false
            });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    createSubject: async (input: CreateSubjectInput) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('subjects')
            .insert({
                ...input,
                user_id: user.id,
                color: input.color || '#6366f1',
                icon: input.icon || 'book',
            })
            .select()
            .single();

        if (error) throw error;

        set({ subjects: [data, ...get().subjects] });
        return data;
    },

    updateSubject: async (id: string, updates: Partial<Subject>) => {
        const { error } = await supabase
            .from('subjects')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        set({
            subjects: get().subjects.map(s =>
                s.id === id ? { ...s, ...updates } : s
            ),
        });
    },

    deleteSubject: async (id: string) => {
        const { error } = await supabase
            .from('subjects')
            .delete()
            .eq('id', id);

        if (error) throw error;

        set({ subjects: get().subjects.filter(s => s.id !== id) });
    },

    createTopic: async (input: CreateTopicInput) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('topics')
            .insert({
                ...input,
                user_id: user.id,
            })
            .select()
            .single();

        if (error) throw error;

        const current = get().currentSubject;
        if (current && current.id === input.subject_id) {
            set({
                currentSubject: {
                    ...current,
                    topics: [...current.topics, data],
                },
            });
        }

        return data;
    },

    deleteTopic: async (id: string) => {
        const { error } = await supabase
            .from('topics')
            .delete()
            .eq('id', id);

        if (error) throw error;

        const current = get().currentSubject;
        if (current) {
            set({
                currentSubject: {
                    ...current,
                    topics: current.topics.filter(t => t.id !== id),
                },
            });
        }
    },
}));
