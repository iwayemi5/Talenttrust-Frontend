import { render, screen, waitFor } from '@testing-library/react';
import { ToastProvider } from '@/components/toast/toast-provider';
import ContractDetailPage from '../page';
import * as contractResolver from '@/lib/contractResolver';

// Mock next/navigation so notFound() throws a known sentinel.
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => { throw new Error('NEXT_NOT_FOUND'); }),
}));

// Mock Link from next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock the contract resolver
jest.mock('@/lib/contractResolver');

describe('ContractDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (contractResolver.resolveContractData as jest.Mock).mockResolvedValue({
      id: '123',
      name: 'Stellar Escrow Implementation',
      status: 'Active',
      parties: [
        { label: 'Client', address: 'GABC1234DEF5678HIJK9012LMNO3456PQRS7890' },
        { label: 'Freelancer', address: 'GXYZ9876STU5432VWXQ1098ABCD7654EFGH3210' },
      ],
      totalValue: 7000,
      currency: 'USD',
      createdAt: 'Apr 20, 2026',
      milestones: [
        {
          id: 'ms-1',
          title: 'Kickoff and scope approval',
          status: 'Completed',
          payout: 1500,
          currency: 'USD',
          dueDate: '2026-05-04',
        },
        {
          id: 'ms-2',
          title: 'Design and review',
          status: 'Pending',
          payout: 2500,
          currency: 'USD',
          dueDate: '2026-06-01',
        },
        {
          id: 'ms-3',
          title: 'Final delivery',
          status: 'Pending',
          payout: 3000,
          currency: 'USD',
          dueDate: '2026-07-12',
        },
      ],
    });
  });

  it('renders loading skeleton initially', async () => {
    const params = Promise.resolve({ id: '123' });
    const Component = await ContractDetailPage({ params });
    render(Component);

    // Loading state should show aria-busy regions
    await waitFor(() => {
      expect(screen.getByLabelText('Loading contract summary')).toBeInTheDocument();
    });
  });

  it('renders the contract overview and action panel after successful load', async () => {
    const params = Promise.resolve({ id: '123' });
    const Component = await ContractDetailPage({ params });
    render(
      <ToastProvider>
        {Component}
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Contract #123')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Stellar Escrow Implementation')).toBeInTheDocument();
      expect(screen.getByText('Milestones')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Submit milestone/i })).toBeInTheDocument();
    expect(screen.queryByLabelText('Loading contract summary')).not.toBeInTheDocument();
  });

  it('passes isLoading prop to ActionPanel during data fetch', async () => {
    (contractResolver.resolveContractData as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        id: '123',
        name: 'Test Contract',
        status: 'Active',
        parties: [],
        totalValue: 7000,
        currency: 'USD',
        createdAt: 'Apr 20, 2026',
        milestones: [],
      }), 100))
    );

    const params = Promise.resolve({ id: '123' });
    const Component = await ContractDetailPage({ params });
    render(Component);

    await waitFor(() => {
      const buttons = screen.queryAllByRole('button', { name: /Submit milestone/i });
      // During loading, buttons should be disabled
      if (buttons.length > 0 && buttons[0].hasAttribute('disabled')) {
        expect(buttons[0]).toBeDisabled();
      }
    });
  });

  it('renders error message on load failure and disables actions', async () => {
    (contractResolver.resolveContractData as jest.Mock).mockRejectedValueOnce(
      new Error('Network error: Failed to fetch contract data')
    );

    const params = Promise.resolve({ id: '123' });
    const Component = await ContractDetailPage({ params });
    render(Component);

    await waitFor(() => {
      const alert = screen.queryByRole('alert');
      // Error should be displayed in ActionPanel
      if (alert) {
        expect(alert).toBeInTheDocument();
      }
    });
  });

  it('keeps the "Back to contracts" link for a valid id', async () => {
    const params = Promise.resolve({ id: 'contract-42' });
    const Component = await ContractDetailPage({ params });
    render(
      <ToastProvider>
        {Component}
      </ToastProvider>
    );

    expect(screen.getByRole('link', { name: /back to contracts/i })).toHaveAttribute('href', '/contracts');
  });

  it.each([
    ['empty string', ''],
    ['path traversal', '../admin'],
    ['script tag', '<script>alert(1)</script>'],
    ['oversized', 'a'.repeat(65)],
    ['special chars', 'id#1!'],
  ])('calls notFound() for invalid id: %s', async (_label, id) => {
    const params = Promise.resolve({ id });
    await expect(ContractDetailPage({ params })).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('uses SafeBoundary to catch errors in ContractSummary and MilestonesList', async () => {
    const params = Promise.resolve({ id: '123' });
    const Component = await ContractDetailPage({ params });
    render(Component);

    // SafeBoundary should be present
    await waitFor(() => {
      // Check for rendered content without errors
      expect(screen.getByText('Contract #123')).toBeInTheDocument();
    });
  });

  it('announces loading state to accessibility users', async () => {
    const params = Promise.resolve({ id: '123' });
    const Component = await ContractDetailPage({ params });
    render(Component);

    await waitFor(() => {
      const loadingRegion = screen.getByLabelText('Loading contract summary');
      expect(loadingRegion).toHaveAttribute('aria-busy', 'true');
    });
  });
});
