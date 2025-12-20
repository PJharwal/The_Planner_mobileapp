import { create } from 'zustand';
import { User, AuthState } from '../types';
import { signIn, signUp, signOut, getCurrentUser, onAuthStateChange } from '../lib/auth';

interface AuthStore extends AuthState {
    initialize: () => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName?: string) => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,

    initialize: async () => {
        set({ isLoading: true });
        try {
            const user = await getCurrentUser();
            set({
                user,
                isAuthenticated: !!user,
                isLoading: false
            });

            // Listen for auth changes
            onAuthStateChange((user) => {
                set({
                    user,
                    isAuthenticated: !!user
                });
            });
        } catch (error) {
            set({ isLoading: false });
        }
    },

    login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
            const data = await signIn(email, password);
            const user = await getCurrentUser();
            set({
                user,
                session: data.session,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    register: async (email: string, password: string, fullName?: string) => {
        set({ isLoading: true });
        try {
            await signUp(email, password, fullName);
            set({ isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        await signOut();
        set({
            user: null,
            session: null,
            isAuthenticated: false
        });
    },

    setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
    },
}));
