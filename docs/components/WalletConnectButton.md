# WalletConnectButton

The `WalletConnectButton` component provides a unified control for users to connect and manage their crypto wallet session within the TalentTrust application.

## Location
`src/components/WalletConnectButton.tsx`

## Usage

```tsx
import { WalletConnectButton } from '@/components/WalletConnectButton';

export function Header() {
  return (
    <header>
      <WalletConnectButton />
    </header>
  );
}
```

## Features

- **Global State Integration:** Uses `useWallet` context to ensure the connection state is shared across the app, such as gating actions in `ActionPanel`.
- **States:**
  - **Disconnected:** Displays a prominent "Connect Wallet" button.
  - **Connecting:** Displays a loading spinner and "Connecting..." text. Disables the button.
  - **Error:** Displays a "Connection Error" message with a "Retry" link.
  - **Connected:** Displays the truncated wallet address along with options to copy to clipboard or disconnect.
- **Clipboard Copy (hardened):** See details in the section below.
- **Accessibility:** Fully accessible with ARIA labels, semantic HTML, and proper focus states. All interactive elements are keyboard operable.
- **Responsiveness:** Works across mobile and desktop viewpoints.

## Clipboard Copy Behaviour

The copy button uses the [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard) (`navigator.clipboard.writeText`). The implementation is hardened against the following failure modes:

| Scenario | Behaviour |
|---|---|
| Successful write | Checkmark icon is shown; reverts to copy icon after 2 s. |
| `navigator.clipboard` is `undefined` (insecure context, old browser) | Error toast: "Copy not supported" — no checkmark shown. |
| `navigator.clipboard.writeText` is absent | Error toast: "Copy not supported" — no checkmark shown. |
| `writeText` promise rejects (e.g. permission denied) | Error toast: "Copy failed" — no checkmark shown. |

**Security note:** The wallet address is never written to `console.error`, `console.warn`, or any other log on failure. It is treated as sensitive user data.

Error notifications use the application's `showError` method from `useToast`. They appear as dismissible toasts in the top-right corner and are announced by a `role="alert"` live region for screen reader users.

## Dependencies

- `@/contexts/WalletContext` — provides `address`, `connect`, `disconnect`, `isConnecting`, `error`.
- `@/components/toast/toast-provider` — provides `useToast` / `showError` for clipboard failure notifications.
- `@/lib/truncateAddress` — shortens the address for display.
- Inline SVGs for icons (no external icon library dependency).

## Testing

Tested with Jest and React Testing Library in `src/components/__tests__/WalletConnectButton.test.tsx`.

Coverage targets ≥ 95% for this module and includes the following scenarios:

- **Disconnected state:** renders connect button, handles click, shows connecting/disabled state.
- **Error state:** renders retry UI, calls `connect` on retry click.
- **Connected state:** renders truncated address, copy and disconnect buttons with correct ARIA attributes.
- **Copy — success path:** `writeText` called with full address; checkmark icon shown; no error toast fired; icon resets after 2 s.
- **Copy — missing clipboard:** `navigator.clipboard` is `undefined`; `writeText` property is absent; error toast shown; checkmark not shown.
- **Copy — rejected promise:** `writeText` rejects; error toast shown; checkmark not shown; address not leaked to console.
- **Copy — rapid repeated clicks:** multiple fast clicks each invoke `writeText`; no spurious error toasts; icon resets correctly after 2 s.
- **Copy — no-op with no address:** copy button is not rendered when disconnected.
