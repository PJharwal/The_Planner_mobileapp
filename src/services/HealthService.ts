import AppleHealthKit, {
    HealthValue,
    HealthKitPermissions,
} from 'react-native-health';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface HealthMetrics {
    sleepHours: number;
    hrv: number;
    steps: number;
    standHours: number;
}

export interface HealthBaseline {
    avgSleep: number;
    avgHRV: number;
    daysCollected: number;
}

export interface ReadinessResult {
    readinessScore: number; // 0-100
    mentalLoad: 'low' | 'medium' | 'high';
    isCalibrating: boolean;
    notes: string[];
}

const PERMISSIONS: HealthKitPermissions = {
    permissions: {
        read: [
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.StepCount,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.HeartRateVariability,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.AppleStandTime,
        ],
        write: [],
    },
};

// Check if we're in a native build (not Expo Go)
const isNativeBuild = Constants.appOwnership !== 'expo';

// Check if native module is available
const isHealthKitAvailable = () => {
    if (Platform.OS !== 'ios') return false;
    if (!isNativeBuild) return false;
    try {
        return AppleHealthKit && typeof AppleHealthKit.initHealthKit === 'function';
    } catch {
        return false;
    }
};

export const HealthService = {
    isAvailable(): boolean {
        return isHealthKitAvailable();
    },

    async initHealthKit(): Promise<boolean> {
        if (!isHealthKitAvailable()) {
            console.log('[HealthKit] Not available (Expo Go or non-iOS)');
            return false;
        }

        return new Promise((resolve) => {
            AppleHealthKit.initHealthKit(PERMISSIONS, (error: string) => {
                if (error) {
                    console.log('[HealthKit] Cannot grant permissions!', error);
                    resolve(false);
                    return;
                }
                resolve(true);
            });
        });
    },

    async fetchDayMetrics(date: Date = new Date()): Promise<HealthMetrics> {
        if (!isHealthKitAvailable()) {
            return { sleepHours: 0, hrv: 0, steps: 0, standHours: 0 };
        }

        // Initialize return object
        const metrics: HealthMetrics = {
            sleepHours: 0,
            hrv: 0,
            steps: 0,
            standHours: 0,
        };

        const options = {
            startDate: new Date(date.setHours(0, 0, 0, 0)).toISOString(),
            endDate: new Date().toISOString(),
        };

        return new Promise((resolve) => {
            let completed = 0;
            const checkDone = () => {
                completed++;
                if (completed === 4) resolve(metrics);
            };

            // 1. Get Steps
            AppleHealthKit.getStepCount(options, (err, results) => {
                if (!err && results) {
                    metrics.steps = results.value;
                }
                checkDone();
            });

            // 2. Get Sleep (Need special handling for sleep duration - summing "ASLEEP" samples)
            // Usually sleep is looked at for the *previous night*.
            // So endDate should be today morning, startDate yesterday evening or use a 24h window?
            // AppleHealthKit's getSleepSamples returns raw samples.
            // For simplicity here, we assume we want sleep ending *today*.
            const sleepOptions = {
                startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24h
                endDate: new Date().toISOString(),
                limit: 10,
            };
            AppleHealthKit.getSleepSamples(sleepOptions, (err, samples) => {
                if (!err && samples) {
                    // Filter for ASLEEP values (ignoring INBED if overlapping)
                    // Value "ASLEEP" (1) usually.
                    // Note: AppleHealthKit types might be fuzzy, standardizing:
                    const asleepSamples = samples.filter((s: any) => s.value === 'ASLEEP' || s.value === 1);
                    const totalMinutes = asleepSamples.reduce((acc, curr) => {
                        const start = new Date(curr.startDate).getTime();
                        const end = new Date(curr.endDate).getTime();
                        return acc + (end - start) / 1000 / 60;
                    }, 0);
                    metrics.sleepHours = totalMinutes / 60;
                }
                checkDone();
            });

            // 3. Get HRV (SDNN)
            // HRV is tricky, usually take average of recent samples or nightly average.
            AppleHealthKit.getHeartRateVariabilitySamples(options, (err, samples) => {
                if (!err && samples && samples.length > 0) {
                    const sum = samples.reduce((acc, curr) => acc + curr.value, 0);
                    metrics.hrv = sum / samples.length;
                }
                checkDone();
            });

            // 4. Stand Hours (AppleStandTime)
            // This might not be directly available as a simple "getStandHours" in all libs.
            // We can use getAppleStandTime if available or fallback. 
            // Checking types... if not available, we skip.
            // react-native-health has getAppleStandTime.
            // @ts-ignore
            if (AppleHealthKit.getAppleStandTime) {
                // @ts-ignore
                AppleHealthKit.getAppleStandTime({ date: new Date().toISOString() }, (err, results) => {
                    if (!err && results) {
                        // results might be array or object depending on version/types
                        if (Array.isArray(results) && results.length > 0) {
                            metrics.standHours = results[0].value;
                        } else if (results && 'value' in results) {
                            // @ts-ignore
                            metrics.standHours = results.value;
                        }
                    }
                    checkDone();
                });
            } else {
                checkDone();
            }
        });
    },

    calculateReadiness(
        metrics: HealthMetrics,
        baseline: HealthBaseline
    ): ReadinessResult {
        const notes: string[] = [];
        let score = 100;

        // Calibration Check
        if (baseline.daysCollected < 3) {
            return {
                readinessScore: 85, // Friendly default
                mentalLoad: 'low', // Assume best case during learning
                isCalibrating: true,
                notes: ['Learning your rhythm — recommendations will improve over time.'],
            };
        }

        // 1. Sleep Penalty
        // If sleep < baseline - 20%
        const sleepThreshold = baseline.avgSleep * 0.8;
        if (metrics.sleepHours < sleepThreshold) {
            score -= 20;
            notes.push('Sleep was lower than your usual.');
        } else if (metrics.sleepHours < 6) {
            // Absolute minimum check
            score -= 10;
            notes.push('Short sleep detected.');
        }

        // 2. HRV Penalty
        // If HRV < baseline - 15%
        const hrvThreshold = baseline.avgHRV * 0.85;
        if (metrics.hrv < hrvThreshold && metrics.hrv > 0) {
            score -= 15;
            notes.push('Recovery (HRV) signals are lower today.');
        }

        // 3. Steps / Activity (Minor impact, only check if very low by mid-day?)
        // Implemented purely as a negative if super sedentary compared to baseline?
        // Let's keep it simple as per plan: "Steps < 1000 by noon -> -5"
        // We don't have "noon" check here easily without time context, 
        // so we'll skip time-of-day logic for now to keep function pure-ish.

        // Soft Bounds (Clamping)
        // Clamp between 40 and 95
        score = Math.max(40, Math.min(95, score));

        // Mental Load Classification
        let mentalLoad: 'low' | 'medium' | 'high' = 'low';
        if (score < 60) mentalLoad = 'high';
        else if (score < 80) mentalLoad = 'medium';

        return {
            readinessScore: score,
            mentalLoad,
            isCalibrating: false,
            notes,
        };
    },

    // Helper to categorize load just from score
    getMentalLoadFromScore(score: number): 'low' | 'medium' | 'high' {
        if (score < 60) return 'high';
        if (score < 80) return 'medium';
        return 'low';
    }
};
