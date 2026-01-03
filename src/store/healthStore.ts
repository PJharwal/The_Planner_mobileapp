import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HealthState {
    hasPermissions: boolean;
    healthInfluenceMode: 'adaptive' | 'insights_only' | 'disabled';
    lastSyncTimestamp: string | null;
    baseline: {
        avgSleep: number;
        avgHRV: number;
        daysCollected: number;
    };
    derivedData: {
        readinessScore: number;
        mentalLoad: 'low' | 'medium' | 'high';
        isCalibrating: boolean;
        notes: string[];
    };
    setPermissions: (status: boolean) => void;
    setInfluenceMode: (mode: 'adaptive' | 'insights_only' | 'disabled') => void;
    updateHealthData: (data: { baseline: HealthState['baseline'], derived: HealthState['derivedData'], timestamp: string }) => void;
}

export const useHealthStore = create<HealthState>()(
    persist(
        (set) => ({
            hasPermissions: false,
            healthInfluenceMode: 'adaptive',
            lastSyncTimestamp: null,
            baseline: {
                avgSleep: 7, // Default assumption
                avgHRV: 50,
                daysCollected: 0,
            },
            derivedData: {
                readinessScore: 100,
                mentalLoad: 'low',
                isCalibrating: true, // Default to calibrating until sync
                notes: [],
            },
            setPermissions: (status) => set({ hasPermissions: status }),
            setInfluenceMode: (mode) => set({ healthInfluenceMode: mode }),
            updateHealthData: ({ baseline, derived, timestamp }) => set({
                baseline,
                derivedData: derived,
                lastSyncTimestamp: timestamp,
            }),
        }),
        {
            name: 'health-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
