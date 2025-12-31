import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    duration?: number;
    action?: {
        label: string;
        onPress: () => void;
    };
}

interface NotificationStore {
    notifications: Notification[];
    show: (notification: Omit<Notification, 'id'>) => void;
    dismiss: (id: string) => void;
    clear: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
    notifications: [],

    show: (notification) => {
        const id = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const newNotification: Notification = { ...notification, id };

        set((state) => ({
            notifications: [...state.notifications, newNotification]
        }));

        // Auto-dismiss after duration (default 4 seconds)
        const duration = notification.duration ?? 4000;
        if (duration > 0) {
            setTimeout(() => {
                get().dismiss(id);
            }, duration);
        }
    },

    dismiss: (id) => {
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id)
        }));
    },

    clear: () => {
        set({ notifications: [] });
    }
}));
