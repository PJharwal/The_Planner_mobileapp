// Confidence Store - Track confidence levels for sub-topics
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { ConfidenceLevel, ConfidenceTracking } from '../types';

interface ConfidenceStore {
    // State
    confidenceMap: Record<string, ConfidenceLevel>; // subTopicId -> level
    isLoading: boolean;

    // Actions
    fetchConfidence: (subTopicId: string) => Promise<ConfidenceLevel>;
    fetchAllConfidences: () => Promise<void>;
    setConfidence: (subTopicId: string, level: ConfidenceLevel) => Promise<boolean>;
    getLowConfidenceTopics: () => string[];
    getConfidenceLevel: (subTopicId: string) => ConfidenceLevel;
}

export const useConfidenceStore = create<ConfidenceStore>((set, get) => ({
    confidenceMap: {},
    isLoading: false,

    /**
     * Fetch confidence level for a specific sub-topic
     */
    fetchConfidence: async (subTopicId: string): Promise<ConfidenceLevel> => {
        try {
            const { data, error } = await supabase
                .from('confidence_tracking')
                .select('level')
                .eq('sub_topic_id', subTopicId)
                .single();

            if (error || !data) {
                return 'medium'; // Default
            }

            set(state => ({
                confidenceMap: {
                    ...state.confidenceMap,
                    [subTopicId]: data.level as ConfidenceLevel
                }
            }));

            return data.level as ConfidenceLevel;
        } catch {
            return 'medium';
        }
    },

    /**
     * Fetch all confidence levels for the current user
     */
    fetchAllConfidences: async () => {
        set({ isLoading: true });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('confidence_tracking')
                .select('sub_topic_id, level')
                .eq('user_id', user.id);

            if (data && !error) {
                const map: Record<string, ConfidenceLevel> = {};
                data.forEach(item => {
                    map[item.sub_topic_id] = item.level as ConfidenceLevel;
                });
                set({ confidenceMap: map });
            }
        } catch (error) {
            console.error('Error fetching confidences:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    /**
     * Set confidence level for a sub-topic
     * Upserts the record
     */
    setConfidence: async (subTopicId: string, level: ConfidenceLevel): Promise<boolean> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { error } = await supabase
                .from('confidence_tracking')
                .upsert({
                    user_id: user.id,
                    sub_topic_id: subTopicId,
                    level,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id,sub_topic_id'
                });

            if (error) {
                console.error('Error setting confidence:', error);
                return false;
            }

            // Update local state
            set(state => ({
                confidenceMap: {
                    ...state.confidenceMap,
                    [subTopicId]: level
                }
            }));

            // Also record as a revision (they just reviewed it)
            await supabase.from('revision_history').insert({
                user_id: user.id,
                sub_topic_id: subTopicId,
            });

            return true;
        } catch (error) {
            console.error('Error setting confidence:', error);
            return false;
        }
    },

    /**
     * Get all sub-topic IDs with low confidence
     */
    getLowConfidenceTopics: (): string[] => {
        const { confidenceMap } = get();
        return Object.entries(confidenceMap)
            .filter(([_, level]) => level === 'low')
            .map(([id, _]) => id);
    },

    /**
     * Get confidence level for a sub-topic (from cache)
     */
    getConfidenceLevel: (subTopicId: string): ConfidenceLevel => {
        return get().confidenceMap[subTopicId] || 'medium';
    },
}));

// ============================================
// CONFIDENCE UI HELPERS
// ============================================

export const CONFIDENCE_CONFIG = {
    low: {
        label: 'Low',
        color: '#E8A0A0', // Muted coral
        bgColor: 'rgba(232, 160, 160, 0.15)',
        icon: 'alert-circle-outline',
        description: 'Need more practice'
    },
    medium: {
        label: 'Medium',
        color: '#E8C9A0', // Warm pastel orange
        bgColor: 'rgba(232, 201, 160, 0.15)',
        icon: 'remove-circle-outline',
        description: 'Getting there'
    },
    high: {
        label: 'High',
        color: '#8DD7D8', // Soft mint
        bgColor: 'rgba(141, 215, 216, 0.15)',
        icon: 'checkmark-circle-outline',
        description: 'Feeling confident'
    }
};

export function getConfidenceConfig(level: ConfidenceLevel) {
    return CONFIDENCE_CONFIG[level];
}
