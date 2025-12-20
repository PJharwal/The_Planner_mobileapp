// Global Search Utility with Add to Today actions
import { supabase } from '../lib/supabase';

export type SearchResultType = 'subject' | 'topic' | 'sub_topic' | 'task' | 'note';

export interface SearchResult {
    type: SearchResultType;
    id: string;
    title: string;
    subtitle?: string;
    color?: string;
    route: string;
    // For Add to Today action
    subjectId?: string;
    topicId?: string;
    subTopicId?: string;
}

/**
 * Search across all content types with hierarchy info for Add to Today
 */
export async function globalSearch(query: string): Promise<SearchResult[]> {
    if (!query.trim() || query.length < 2) return [];

    const results: SearchResult[] = [];
    const searchTerm = `%${query.toLowerCase()}%`;

    try {
        // Search subjects
        const { data: subjects } = await supabase
            .from('subjects')
            .select('id, name, color')
            .ilike('name', searchTerm)
            .limit(5);

        subjects?.forEach(s => {
            results.push({
                type: 'subject',
                id: s.id,
                title: s.name,
                subtitle: 'Subject',
                color: s.color,
                route: `/subject/${s.id}`,
                subjectId: s.id,
            });
        });

        // Search topics
        const { data: topics } = await supabase
            .from('topics')
            .select('id, name, subject_id, subjects(name, color)')
            .ilike('name', searchTerm)
            .limit(5);

        topics?.forEach(t => {
            results.push({
                type: 'topic',
                id: t.id,
                title: t.name,
                subtitle: (t as any).subjects?.name || 'Topic',
                color: (t as any).subjects?.color,
                route: `/topic/${t.id}`,
                subjectId: t.subject_id,
                topicId: t.id,
            });
        });

        // Search sub-topics
        const { data: subTopics } = await supabase
            .from('sub_topics')
            .select(`
                id, name, topic_id,
                topics (id, name, subject_id, subjects(name, color))
            `)
            .ilike('name', searchTerm)
            .limit(5);

        subTopics?.forEach(st => {
            const topic = (st as any).topics;
            results.push({
                type: 'sub_topic',
                id: st.id,
                title: st.name,
                subtitle: topic?.name || 'Sub-Topic',
                color: topic?.subjects?.color,
                route: `/subtopic/${st.id}`,
                subjectId: topic?.subject_id,
                topicId: st.topic_id,
                subTopicId: st.id,
            });
        });

        // Search tasks
        const { data: tasks } = await supabase
            .from('tasks')
            .select(`
                id, title, sub_topic_id,
                sub_topics (
                    id, name, topic_id,
                    topics (id, name, subject_id, subjects(name, color))
                )
            `)
            .ilike('title', searchTerm)
            .limit(5);

        tasks?.forEach(t => {
            const subTopic = (t as any).sub_topics;
            const topic = subTopic?.topics;
            results.push({
                type: 'task',
                id: t.id,
                title: t.title,
                subtitle: subTopic?.name || 'Task',
                color: topic?.subjects?.color,
                route: `/subtopic/${t.sub_topic_id}`,
                subjectId: topic?.subject_id,
                topicId: topic?.id,
                subTopicId: t.sub_topic_id,
            });
        });

        // Search notes
        const { data: notes } = await supabase
            .from('daily_notes')
            .select('id, title, date')
            .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
            .limit(5);

        notes?.forEach(n => {
            results.push({
                type: 'note',
                id: n.id,
                title: n.title || 'Note',
                subtitle: n.date,
                route: '/(tabs)/notes',
            });
        });

        return results;

    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}

/**
 * Get icon for search result type
 */
export function getSearchIcon(type: SearchResultType): string {
    switch (type) {
        case 'subject': return 'book';
        case 'topic': return 'layers';
        case 'sub_topic': return 'git-branch';
        case 'task': return 'checkbox';
        case 'note': return 'document-text';
        default: return 'search';
    }
}

/**
 * Get type label for search result
 */
export function getSearchTypeLabel(type: SearchResultType): string {
    switch (type) {
        case 'subject': return 'Subject';
        case 'topic': return 'Topic';
        case 'sub_topic': return 'Sub-Topic';
        case 'task': return 'Task';
        case 'note': return 'Note';
        default: return '';
    }
}
