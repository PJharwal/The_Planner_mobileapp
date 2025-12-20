// Network Status Hook - Monitor connectivity and auto-sync
import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { processQueue, getQueueCount } from '../utils/offlineQueue';

interface NetworkStatus {
    isConnected: boolean;
    isInternetReachable: boolean | null;
    type: string;
    queueCount: number;
    isSyncing: boolean;
    syncQueue: () => Promise<void>;
}

export function useNetworkStatus(): NetworkStatus {
    const [isConnected, setIsConnected] = useState(true);
    const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
    const [type, setType] = useState('unknown');
    const [queueCount, setQueueCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    const updateQueueCount = useCallback(async () => {
        const count = await getQueueCount();
        setQueueCount(count);
    }, []);

    const syncQueue = useCallback(async () => {
        if (isSyncing) return;

        setIsSyncing(true);
        try {
            await processQueue();
            await updateQueueCount();
        } catch (error) {
            console.error('[NetworkStatus] Sync error:', error);
        }
        setIsSyncing(false);
    }, [isSyncing, updateQueueCount]);

    useEffect(() => {
        // Initial check
        NetInfo.fetch().then((state: NetInfoState) => {
            setIsConnected(state.isConnected ?? false);
            setIsInternetReachable(state.isInternetReachable);
            setType(state.type);
        });

        // Subscribe to network changes
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            const wasDisconnected = !isConnected;
            const nowConnected = state.isConnected ?? false;

            setIsConnected(nowConnected);
            setIsInternetReachable(state.isInternetReachable);
            setType(state.type);

            // Auto-sync when reconnecting
            if (wasDisconnected && nowConnected && state.isInternetReachable) {
                console.log('[NetworkStatus] Reconnected - syncing queue...');
                syncQueue();
            }
        });

        // Initial queue count
        updateQueueCount();

        // Poll queue count every 10 seconds
        const interval = setInterval(updateQueueCount, 10000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [isConnected, syncQueue, updateQueueCount]);

    return {
        isConnected,
        isInternetReachable,
        type,
        queueCount,
        isSyncing,
        syncQueue,
    };
}

// Context for global network status
interface NetworkContextValue extends NetworkStatus { }

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
    const networkStatus = useNetworkStatus();

    return (
        <NetworkContext.Provider value={networkStatus}>
            {children}
        </NetworkContext.Provider>
    );
}

export function useNetwork(): NetworkContextValue {
    const context = useContext(NetworkContext);
    if (!context) {
        // Return default values if not in provider
        return {
            isConnected: true,
            isInternetReachable: true,
            type: 'unknown',
            queueCount: 0,
            isSyncing: false,
            syncQueue: async () => { },
        };
    }
    return context;
}
