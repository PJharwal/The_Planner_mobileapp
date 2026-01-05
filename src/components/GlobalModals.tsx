import React from 'react';
import { StartSessionModal, SessionConfig } from './session/StartSessionModal';
import { useModalStore } from '../store/modalStore';
import { useProfileStore } from '../store/profileStore';
import { ADAPTIVE_PLANS } from '../utils/adaptivePlans';
import { useRouter } from 'expo-router';

/**
 * GlobalModals - Centralized modal management
 * 
 * All modals are rendered here at app root level to escape
 * tab navigation and screen layout constraints.
 */
export function GlobalModals() {
    const router = useRouter();
    const { profile } = useProfileStore();
    const { startSessionModalOpen, closeStartSession, sessionHandler } = useModalStore();

    const handleStartSession = (config: SessionConfig) => {
        // Use custom handler if set, otherwise default navigation
        if (sessionHandler) {
            sessionHandler(config);
        } else {
            router.push({
                pathname: '/focus',
                params: {
                    duration: config.duration.toString(),
                    subjectId: config.subjectId,
                    topicId: config.topicId || '',
                    subTopicId: config.subTopicId || '',
                    note: config.note || '',
                    autoStart: 'true',
                },
            });
        }
        closeStartSession();
    };

    const getDefaultDuration = React.useMemo(() => {
        if (!profile?.selected_plan_id) return 25;
        const selectedPlan = ADAPTIVE_PLANS.find(p => p.id === profile.selected_plan_id);
        return selectedPlan ? selectedPlan.default_session_length : 25;
    }, [profile?.selected_plan_id]);

    const handleDismiss = React.useCallback(() => {
        closeStartSession();
    }, [closeStartSession]);

    return (
        <>
            {/* Start Session Modal */}
            <StartSessionModal
                visible={startSessionModalOpen}
                onDismiss={handleDismiss}
                onStart={handleStartSession}
                defaultDuration={getDefaultDuration}
            />

            {/* Add other global modals here */}
        </>
    );
}
