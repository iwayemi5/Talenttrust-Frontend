# ActionPanel Component

`ActionPanel` renders the contract actions available from the escrow detail page. The component is intentionally built from native `button` controls so actions remain reachable and operable by keyboard without custom key handling.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `status` | `'Active' \| 'Completed' \| 'Disputed' \| 'Pending'` | Yes | Determines which actions are shown and their tab order. |
| `onSubmitMilestone` | `() => void` | No | Callback for submitting milestone work for approval. |
| `onDispute` | `() => void` | No | Callback for opening the dispute flow. |
| `onReleaseFunds` | `() => void` | No | Callback for releasing escrow funds. |
| `onViewSummary` | `() => void` | No | Callback for viewing the completed contract summary. |
| `disabledReasons` | `Partial<Record<ActionKey, string>>` | No | Disables a specific visible action and exposes the reason through `aria-describedby`. |
| `errorMessage` | `string` | No | Announces transient API or network errors with `role="alert"`. |
| `isLoading` | `boolean` | No | Disables all visible actions while contract or wallet state is loading. |

## Accessibility

- Buttons use browser-native keyboard support for `Tab`, `Enter`, and `Space`.
- Visible focus rings use high-contrast Tailwind `focus-visible:outline` utilities and are not removed in any state.
- Actions are rendered in contract workflow order: submit milestone, release funds, dispute, then summary when applicable.
- Submit Milestone opens the shared confirmation dialog before invoking the callback, then shows a success toast once the action is confirmed.
- Unavailable actions stay visible as disabled buttons with an accessible reason. Use `disabledReasons` for states such as no wallet, missing permissions, pending API responses, or unmet milestone conditions.
- Loading states disable all visible actions and describe that contract data is still loading.
- Error states are announced through `role="alert"` without moving focus or changing the action order.

## Status Mapping

| Status | Visible actions |
|--------|-----------------|
| `Active` | Submit Milestone, Release Funds, Dispute |
| `Pending` | Release Funds, Dispute |
| `Disputed` | Dispute |
| `Completed` | View Summary |

## Testing Notes

The component tests cover:

- Action rendering and callback behavior for active and completed contracts.
- Confirmable Submit Milestone, including success toast feedback and cancel/disconnected-wallet cases.
- Logical button order for keyboard navigation.
- Visible focus ring classes on every enabled action.
- Disabled action semantics and screen-reader descriptions.
- Loading, slow-network error, and missing-handler edge cases.
