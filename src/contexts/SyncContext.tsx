import React, { createContext, useContext, useEffect, useState } from 'react';
import { syncService, syncEvents } from '../services/syncService';
import { SyncStatus } from '../types';
import { useAuth } from './AuthContext';

interface SyncContextType {
  syncStatus: SyncStatus;
  connectedPeers: number;
  triggerSync: () => Promise<void>;
  lastSyncTime: number | null;
}

const SyncContext = createContext<SyncContextType>({
  syncStatus: 'offline',
  connectedPeers: 0,
  triggerSync: async () => {},
  lastSyncTime: null,
});

export const useSync = () => useContext(SyncContext);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    navigator.onLine ? 'synced' : 'offline'
  );
  const [connectedPeers, setConnectedPeers] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      syncService.init();
      
      const statusUnsubscribe = syncEvents.subscribe('status-change', (status: SyncStatus) => {
        setSyncStatus(status);
      });
      
      const peerConnectedUnsubscribe = syncEvents.subscribe('peer-connected', () => {
        setConnectedPeers(prev => prev + 1);
      });
      
      const peerDisconnectedUnsubscribe = syncEvents.subscribe('peer-disconnected', () => {
        setConnectedPeers(prev => Math.max(0, prev - 1));
      });
      
      const dataReceivedUnsubscribe = syncEvents.subscribe('data-received', () => {
        setLastSyncTime(Date.now());
      });
      
      return () => {
        statusUnsubscribe();
        peerConnectedUnsubscribe();
        peerDisconnectedUnsubscribe();
        dataReceivedUnsubscribe();
        syncService.destroy();
      };
    }
  }, [isAuthenticated]);

  const triggerSync = async () => {
    await syncService.syncNow();
    setLastSyncTime(Date.now());
  };

  return (
    <SyncContext.Provider
      value={{
        syncStatus,
        connectedPeers,
        triggerSync,
        lastSyncTime,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};
