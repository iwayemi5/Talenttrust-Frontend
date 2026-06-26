'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/components/toast/toast-provider';
import { safeStorage } from '@/lib/safeStorage';

export type WalletContextType = {
  address: string | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

/**
 * WalletProvider provides the global wallet connection state.
 *
 * It includes an optional inactivity timeout that automatically disconnects
 * the wallet after a period of user inactivity.
 *
 * @param idleTimeout - Inactivity duration in milliseconds before auto-disconnect.
 *                      Set to 0 or undefined to disable.
 */
export function WalletProvider({
  children,
  idleTimeout = 0,
}: {
  children: ReactNode;
  idleTimeout?: number;
}) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Safely obtain toast functions; fallback to no-op if provider missing
  const useSafeToast = () => {
    try {
      return useToast();
    } catch {
      return { showSuccess: () => {} };
    }
  };
  const { showSuccess } = useSafeToast();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const STORAGE_KEY = 'wallet_connected_address';

  const disconnect = useCallback(() => {
    setAddress(null);
    safeStorage.removeItem(STORAGE_KEY);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Reset the inactivity timer */
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (address && idleTimeout > 0) {
      timerRef.current = setTimeout(() => {
        disconnect();
        showSuccess({
          title: 'Session expired',
          description: 'You have been disconnected due to inactivity.',
        });
      }, idleTimeout);
    }
  }, [address, idleTimeout, disconnect, showSuccess]);

  // Rehydrate address from storage on mount (client only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = safeStorage.getItem(STORAGE_KEY);
    if (stored) {
      setAddress(stored);
    }
  }, []);

  // Idle auto‑disconnect handling
  useEffect(() => {
    if (typeof window === 'undefined' || !address || idleTimeout <= 0) {
      return;
    }
    const events = ['pointermove', 'keydown', 'visibilitychange', 'mousedown', 'touchstart'];
    const handleActivity = () => resetTimer();
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [address, idleTimeout, resetTimer]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // Mocking wallet connection delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Mocked address
      setAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
    } catch (_err) {
      setError('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  return (
    <WalletContext.Provider value={{ address, isConnecting, error, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
