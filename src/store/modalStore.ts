import { create } from 'zustand';
import { SessionConfig } from '../components/session/StartSessionModal';

interface ModalStore {
    // Start Session Modal
    startSessionModalOpen: boolean;
    startSessionConfig: SessionConfig | null;
    openStartSession: () => void;
    closeStartSession: () => void;

    // Session handler
    sessionHandler: ((config: SessionConfig) => void) | null;
    setSessionHandler: (handler: (config: SessionConfig) => void) => void;

    // Paywall Modal
    paywallOpen: boolean;
    paywallTriggerFeature: string | null;
    lastPaywallShownAt: number | null;
    openPaywall: (triggerFeature?: string) => void;
    closePaywall: () => void;
}

export const useModalStore = create<ModalStore>((set, get) => ({
    // Start Session Modal
    startSessionModalOpen: false,
    startSessionConfig: null,
    openStartSession: () => set({ startSessionModalOpen: true }),
    closeStartSession: () => set({ startSessionModalOpen: false, startSessionConfig: null }),

    // Session handler
    sessionHandler: null,
    setSessionHandler: (handler) => set({ sessionHandler: handler }),

    // Paywall Modal
    paywallOpen: false,
    paywallTriggerFeature: null,
    lastPaywallShownAt: null,
    openPaywall: (triggerFeature?: string) => set({
        paywallOpen: true,
        paywallTriggerFeature: triggerFeature || null,
        lastPaywallShownAt: Date.now(),
    }),
    closePaywall: () => set({
        paywallOpen: false,
        paywallTriggerFeature: null
    }),
}));
