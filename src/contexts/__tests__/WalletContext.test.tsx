import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WalletProvider, useWallet, FREIGHTER_NOT_INSTALLED, USER_REJECTED } from '../WalletContext';
import { ToastProvider } from '@/components/toast/toast-provider';
import { PreferencesProvider } from '@/lib/preferences';
import { resetCache } from '@/lib/safeStorage';

// Remove the global mock for this test file
jest.unmock('@/contexts/WalletContext');

// Mock Freighter API
jest.mock('@stellar/freighter-api', () => ({
  requestAccess: jest.fn(),
}));

import { requestAccess } from '@stellar/freighter-api';

const STORAGE_KEY = 'talenttrust-wallet-address';
const MOCK_STELLAR_ADDRESS = 'GDZES2J2CZOZ5WJX5WJX5WJX5WJX5WJX5WJX5WJX5WJX5WJX5WJX5WJX';

const mockRequestAccess = requestAccess as jest.Mock;

// Test consumer component
function WalletConsumer() {
  const { address, isConnecting, error, connect, disconnect } = useWallet();

  return (
    <div>
      <div data-testid="address">{address || 'No address'}</div>
      <div data-testid="is-connecting">{isConnecting ? 'Connecting' : 'Not connecting'}</div>
      <div data-testid="error">{error || 'No error'}</div>
      <button data-testid="connect-btn" onClick={connect}>Connect Wallet</button>
      <button data-testid="disconnect-btn" onClick={disconnect}>Disconnect Wallet</button>
    </div>
  );
}

const renderWithProviders = (ui: React.ReactElement, idleTimeout?: number) => {
  return render(
    <PreferencesProvider>
      <ToastProvider>
        <WalletProvider idleTimeout={idleTimeout}>
          {ui}
        </WalletProvider>
      </ToastProvider>
    </PreferencesProvider>
  );
};

describe('WalletContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetCache();
    localStorage.clear();
    mockRequestAccess.mockReset();
    Object.defineProperty(window, 'freighter', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('connect()', () => {
    it('connects successfully with Freighter', async () => {
      mockRequestAccess.mockResolvedValue({ address: MOCK_STELLAR_ADDRESS });

      renderWithProviders(<WalletConsumer />);

      expect(screen.getByTestId('address')).toHaveTextContent('No address');
      expect(screen.getByTestId('is-connecting')).toHaveTextContent('Not connecting');

      await act(async () => {
        screen.getByTestId('connect-btn').click();
      });

      expect(screen.getByTestId('address')).toHaveTextContent(MOCK_STELLAR_ADDRESS);
      expect(screen.getByTestId('is-connecting')).toHaveTextContent('Not connecting');
      expect(screen.getByTestId('error')).toHaveTextContent('No error');
      expect(localStorage.getItem(STORAGE_KEY)).toBe(MOCK_STELLAR_ADDRESS);
    });

    it('sets isConnecting during the connect process', async () => {
      let resolvePromise: (value: { address: string }) => void;
      const connectPromise = new Promise<{ address: string }>((resolve) => {
        resolvePromise = resolve;
      });
      mockRequestAccess.mockReturnValue(connectPromise);

      renderWithProviders(<WalletConsumer />);

      await act(async () => {
        screen.getByTestId('connect-btn').click();
      });

      expect(screen.getByTestId('is-connecting')).toHaveTextContent('Connecting');

      await act(async () => {
        resolvePromise!({ address: MOCK_STELLAR_ADDRESS });
      });

      expect(screen.getByTestId('is-connecting')).toHaveTextContent('Not connecting');
      expect(screen.getByTestId('address')).toHaveTextContent(MOCK_STELLAR_ADDRESS);
    });

    it('shows error when Freighter is not installed', async () => {
      Object.defineProperty(window, 'freighter', { value: false });

      renderWithProviders(<WalletConsumer />);

      await act(async () => {
        screen.getByTestId('connect-btn').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent(FREIGHTER_NOT_INSTALLED);
      expect(screen.getByTestId('address')).toHaveTextContent('No address');
      expect(screen.getByTestId('is-connecting')).toHaveTextContent('Not connecting');
      expect(mockRequestAccess).not.toHaveBeenCalled();
    });

    it('shows error when window.freighter is undefined', async () => {
      Object.defineProperty(window, 'freighter', { value: undefined });

      renderWithProviders(<WalletConsumer />);

      await act(async () => {
        screen.getByTestId('connect-btn').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent(FREIGHTER_NOT_INSTALLED);
      expect(mockRequestAccess).not.toHaveBeenCalled();
    });

    it('shows error when user rejects connection', async () => {
      mockRequestAccess.mockResolvedValue({ address: '', error: { code: -1, message: 'User rejected' } });

      renderWithProviders(<WalletConsumer />);

      await act(async () => {
        screen.getByTestId('connect-btn').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent(USER_REJECTED);
      expect(screen.getByTestId('address')).toHaveTextContent('No address');
      expect(screen.getByTestId('is-connecting')).toHaveTextContent('Not connecting');
    });

    it('shows error when requestAccess returns empty address without error', async () => {
      mockRequestAccess.mockResolvedValue({ address: '' });

      renderWithProviders(<WalletConsumer />);

      await act(async () => {
        screen.getByTestId('connect-btn').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent(USER_REJECTED);
    });

    it('resets error on a new connect() call', async () => {
      mockRequestAccess
        .mockRejectedValueOnce(new Error('Some error'))
        .mockResolvedValue({ address: MOCK_STELLAR_ADDRESS });

      renderWithProviders(<WalletConsumer />);

      // Failed attempt
      await act(async () => {
        screen.getByTestId('connect-btn').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Some error');

      // Successful re-attempt - error should be cleared
      await act(async () => {
        screen.getByTestId('connect-btn').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('No error');
      expect(screen.getByTestId('address')).toHaveTextContent(MOCK_STELLAR_ADDRESS);
    });

    it('handles unexpected errors gracefully', async () => {
      mockRequestAccess.mockRejectedValue(new Error('Network failure'));

      renderWithProviders(<WalletConsumer />);

      await act(async () => {
        screen.getByTestId('connect-btn').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Network failure');
    });
  });

  describe('disconnect()', () => {
    it('clears the address and localStorage', async () => {
      mockRequestAccess.mockResolvedValue({ address: MOCK_STELLAR_ADDRESS });

      renderWithProviders(<WalletConsumer />);

      // Connect first
      await act(async () => {
        screen.getByTestId('connect-btn').click();
      });

      expect(screen.getByTestId('address')).toHaveTextContent(MOCK_STELLAR_ADDRESS);
      expect(localStorage.getItem(STORAGE_KEY)).toBe(MOCK_STELLAR_ADDRESS);

      // Disconnect
      await act(async () => {
        screen.getByTestId('disconnect-btn').click();
      });

      expect(screen.getByTestId('address')).toHaveTextContent('No address');
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('can be called when not connected without error', async () => {
      renderWithProviders(<WalletConsumer />);

      await act(async () => {
        screen.getByTestId('disconnect-btn').click();
      });

      expect(screen.getByTestId('address')).toHaveTextContent('No address');
    });
  });

  describe('localStorage rehydration', () => {
    beforeEach(() => {
      // Don't use fake timers for rehydration tests to avoid timing issues
      jest.useRealTimers();
    });

    it('rehydrates address from localStorage on mount', () => {
      localStorage.setItem(STORAGE_KEY, MOCK_STELLAR_ADDRESS);

      renderWithProviders(<WalletConsumer />);

      expect(screen.getByTestId('address')).toHaveTextContent(MOCK_STELLAR_ADDRESS);
    });

    it('shows no address when localStorage is empty', () => {
      renderWithProviders(<WalletConsumer />);

      expect(screen.getByTestId('address')).toHaveTextContent('No address');
    });

    it('does not show an error during rehydration', () => {
      localStorage.setItem(STORAGE_KEY, MOCK_STELLAR_ADDRESS);

      renderWithProviders(<WalletConsumer />);

      expect(screen.getByTestId('error')).toHaveTextContent('No error');
    });
  });

  /**
   * WalletProvider Idle Auto-Disconnect Test Scenarios
   * 
   * 1. Expiry: The wallet should automatically disconnect and trigger a "Session expired"
   *    toast status announcement after the specified idleTimeout duration is exceeded without activity.
   * 2. Reset on Activity: Triggering user activity events (pointermove, keydown, visibilitychange,
   *    mousedown, touchstart) should reset the inactivity timer and prevent disconnection.
   * 3. Disabled Timeout (idleTimeout = 0): If idleTimeout is set to 0 or less, the auto-disconnect
   *    timer and activity listeners are disabled.
   * 4. Cleanup on Unmount: All registered window event listeners and the active setTimeout timer
   *    must be cleaned up when the WalletProvider is unmounted.
   * 5. Cleanup on idleTimeout Transition: When idleTimeout dynamically changes to 0 or less,
   *    all registered window event listeners must be removed and active timers cleared.
   */
  describe('Idle auto-disconnect', () => {
    const IDLE_TIMEOUT = 5000;

    /**
     * Scenario 1: Expiry
     * Verifies that the wallet automatically disconnects after the idle timeout
     * period and triggers a "Session expired" toast with proper a11y announcements.
     */
    it('automatically disconnects after idle period and triggers an accessible toast', async () => {
      renderWithProviders(<WalletConsumer />, IDLE_TIMEOUT);

      // Connect
      await act(async () => {
        screen.getByTestId('connect-btn').click();
      });
      expect(screen.getByTestId('address')).toHaveTextContent(MOCK_STELLAR_ADDRESS);

      // Advance time by IDLE_TIMEOUT
      await act(async () => {
        jest.advanceTimersByTime(IDLE_TIMEOUT);
      });

      expect(screen.getByTestId('address')).toHaveTextContent('No address');

      // Assert the visible toast (using role status/alert)
      expect(screen.getByRole('status')).toHaveTextContent('Session expired');

      // Validate a11y: Assert the screen-reader-only polite toast announcement region
      const politeAnnouncer = document.querySelector('[aria-live="polite"]');
      expect(politeAnnouncer).toBeInTheDocument();
      expect(politeAnnouncer).toHaveTextContent('Session expired. You have been disconnected due to inactivity.');
    });

    /**
     * Scenario 2: Reset on user activity
     * Asserts that simulated activity on any of the registered events resets the timer
     * and prevents automatic disconnection.
     */
    const activityEvents = [
      { name: 'pointermove', fire: () => fireEvent.pointerMove(window) },
      { name: 'keydown', fire: () => fireEvent.keyDown(window) },
      { name: 'visibilitychange', fire: () => fireEvent(window, new Event('visibilitychange')) },
      { name: 'mousedown', fire: () => fireEvent.mouseDown(window) },
      { name: 'touchstart', fire: () => fireEvent.touchStart(window) }
    ];

    activityEvents.forEach(({ name, fire }) => {
      it(`resets the timer and prevents disconnect on ${name} activity`, async () => {
        renderWithProviders(<WalletConsumer />, IDLE_TIMEOUT);

        // Connect first
        await act(async () => {
          screen.getByTestId('connect-btn').click();
        });
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });

        // Advance time by half of IDLE_TIMEOUT
        await act(async () => {
          jest.advanceTimersByTime(IDLE_TIMEOUT / 2);
        });

        // Simulate activity for the event
        await act(async () => {
          fire();
        });

        // Advance time by another half of IDLE_TIMEOUT (if no reset, it would expire now)
        await act(async () => {
          jest.advanceTimersByTime(IDLE_TIMEOUT / 2);
        });

        // Should still be connected because timer was reset
        expect(screen.getByTestId('address')).toHaveTextContent('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');

        // Advance time by full IDLE_TIMEOUT from activity to verify it eventually disconnects
        await act(async () => {
          jest.advanceTimersByTime(IDLE_TIMEOUT / 2);
        });

        // Now it should be disconnected
        expect(screen.getByTestId('address')).toHaveTextContent('No address');
      });
    });

    /**
     * Scenario 3: Disabled timeout (idleTimeout is 0)
     * Asserts that the wallet does not disconnect and no activity event listeners are
     * registered if idleTimeout is set to 0.
     */
    it('does not disconnect and does not register listeners if idleTimeout is 0', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      renderWithProviders(<WalletConsumer />, 0);

      // Connect
      await act(async () => {
        screen.getByTestId('connect-btn').click();
      });

      // No activity listeners should have been added for the window
      const events = ['pointermove', 'keydown', 'visibilitychange', 'mousedown', 'touchstart'];
      events.forEach(event => {
        expect(addEventListenerSpy).not.toHaveBeenCalledWith(event, expect.any(Function), expect.any(Object));
      });

      // Advance time by a long period
      await act(async () => {
        jest.advanceTimersByTime(100000);
      });

      // Should still be connected
      expect(screen.getByTestId('address')).toHaveTextContent('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
      
      addEventListenerSpy.mockRestore();
    });

    /**
     * Scenario 4: Cleanup on unmount
     * Verifies that all 5 registered activity event listeners are removed on unmount.
     */
    it('cleans up all 5 event listeners on unmount', async () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const { unmount } = renderWithProviders(<WalletConsumer />, IDLE_TIMEOUT);

      // Connect first to trigger the effect that adds listeners
      await act(async () => {
        screen.getByTestId('connect-btn').click();
      });

      unmount();
      
      const events = ['pointermove', 'keydown', 'visibilitychange', 'mousedown', 'touchstart'];
      events.forEach(event => {
        expect(removeEventListenerSpy).toHaveBeenCalledWith(event, expect.any(Function));
      });
      
      removeEventListenerSpy.mockRestore();
    });

    /**
     * Scenario 5: Cleanup on idleTimeout transition
     * Verifies that dynamically setting idleTimeout to 0 cleans up listeners and timers.
     */
    it('cleans up listeners and timer when idleTimeout transitions to 0', async () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      const { rerender } = render(
        <PreferencesProvider>
          <ToastProvider>
            <WalletProvider idleTimeout={IDLE_TIMEOUT}>
              <WalletConsumer />
            </WalletProvider>
          </ToastProvider>
        </PreferencesProvider>
      );

      // Connect first to add listeners
      await act(async () => {
        screen.getByTestId('connect-btn').click();
      });
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Clear addEventListenerSpy calls so we can count new calls
      addEventListenerSpy.mockClear();

      // Now rerender with idleTimeout = 0
      await act(async () => {
        rerender(
          <PreferencesProvider>
            <ToastProvider>
              <WalletProvider idleTimeout={0}>
                <WalletConsumer />
              </WalletProvider>
            </ToastProvider>
          </PreferencesProvider>
        );
      });

      // Check that all 5 listeners were removed
      const events = ['pointermove', 'keydown', 'visibilitychange', 'mousedown', 'touchstart'];
      events.forEach(event => {
        expect(removeEventListenerSpy).toHaveBeenCalledWith(event, expect.any(Function));
      });

      // And no new listeners were added
      events.forEach(event => {
        expect(addEventListenerSpy).not.toHaveBeenCalledWith(event, expect.any(Function), expect.any(Object));
      });

      // Advance time by a long period to verify it does not disconnect
      await act(async () => {
        jest.advanceTimersByTime(100000);
      });
      expect(screen.getByTestId('address')).toHaveTextContent('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');

      removeEventListenerSpy.mockRestore();
      addEventListenerSpy.mockRestore();
    });
  });

  describe('useWallet() outside provider', () => {
    it('throws error when called outside WalletProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      function ComponentWithoutProvider() {
        const successContent = <div>Should not render</div>;
        let content: React.ReactNode;
        try {
          useWallet();
          content = successContent;
        } catch (err) {
          content = <div data-testid="error-message">{(err as Error).message}</div>;
        }
        return <>{content}</>;
      }

      render(<ComponentWithoutProvider />);
      expect(screen.getByTestId('error-message')).toHaveTextContent('useWallet must be used within a WalletProvider');

      consoleError.mockRestore();
    });
  });
});
