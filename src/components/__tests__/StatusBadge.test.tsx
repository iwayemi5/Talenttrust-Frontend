import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge, { StatusType } from '../StatusBadge';

describe('StatusBadge', () => {
  describe('rendering', () => {
    it('renders the status text', () => {
      render(<StatusBadge status="Completed" />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('renders all status types correctly', () => {
      const statuses: StatusType[] = ['Active', 'Completed', 'Disputed', 'Pending', 'Paid'];

      statuses.forEach((status) => {
        const { unmount } = render(<StatusBadge status={status} />);
        expect(screen.getByText(status)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('styling', () => {
    it('applies correct Tailwind classes for Active status', () => {
      const { container } = render(<StatusBadge status="Active" />);
      const span = container.querySelector('span');
      expect(span?.className).toContain('bg-emerald-100');
      expect(span?.className).toContain('text-emerald-800');
    });

    it('applies correct Tailwind classes for Completed status', () => {
      const { container } = render(<StatusBadge status="Completed" />);
      const span = container.querySelector('span');
      expect(span?.className).toContain('bg-sky-100');
      expect(span?.className).toContain('text-sky-800');
    });

    it('applies correct Tailwind classes for Disputed status', () => {
      const { container } = render(<StatusBadge status="Disputed" />);
      const span = container.querySelector('span');
      expect(span?.className).toContain('bg-rose-100');
      expect(span?.className).toContain('text-rose-800');
    });

    it('applies correct Tailwind classes for Pending status', () => {
      const { container } = render(<StatusBadge status="Pending" />);
      const span = container.querySelector('span');
      expect(span?.className).toContain('bg-amber-100');
      expect(span?.className).toContain('text-amber-800');
    });

    it('applies correct Tailwind classes for Paid status', () => {
      const { container } = render(<StatusBadge status="Paid" />);
      const span = container.querySelector('span');
      expect(span?.className).toContain('bg-emerald-100');
      expect(span?.className).toContain('text-emerald-800');
    });

    it('applies base badge styles consistently', () => {
      const { container } = render(<StatusBadge status="Active" />);
      const span = container.querySelector('span');
      expect(span?.className).toContain('inline-flex');
      expect(span?.className).toContain('items-center');
      expect(span?.className).toContain('rounded-full');
      expect(span?.className).toContain('px-3');
      expect(span?.className).toContain('py-1');
      expect(span?.className).toContain('text-sm');
      expect(span?.className).toContain('font-semibold');
    });
  });

  describe('additional className prop', () => {
    it('applies additional className when provided', () => {
      const { container } = render(<StatusBadge status="Completed" className="ml-2 custom-class" />);
      const span = container.querySelector('span');
      expect(span?.className).toContain('ml-2');
      expect(span?.className).toContain('custom-class');
    });

    it('works with empty className prop', () => {
      const { container } = render(<StatusBadge status="Completed" className="" />);
      const span = container.querySelector('span');
      expect(span?.className).toContain('bg-sky-100');
    });

    it('defaults to empty string when className is not provided', () => {
      const { container } = render(<StatusBadge status="Completed" />);
      const span = container.querySelector('span');
      expect(span?.className).toContain('bg-sky-100');
    });
  });

  describe('accessibility', () => {
    it('has role="status" for screen readers', () => {
      render(<StatusBadge status="Completed" />);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
    });

    it('has appropriate aria-label for each status', () => {
      const statuses: StatusType[] = ['Active', 'Completed', 'Disputed', 'Pending', 'Paid'];

      statuses.forEach((status) => {
        const { unmount } = render(<StatusBadge status={status} />);
        expect(screen.getByLabelText(`Status: ${status}`)).toBeInTheDocument();
        unmount();
      });
    });

    it('is semantically correct with role and label', () => {
      render(<StatusBadge status="Active" />);
      const badge = screen.getByRole('status', { name: 'Status: Active' });
      expect(badge).toHaveTextContent('Active');
    });
  });

  describe('snapshot tests', () => {
    it('matches snapshot for Active status', () => {
      const { container } = render(<StatusBadge status="Active" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for Completed status', () => {
      const { container } = render(<StatusBadge status="Completed" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for Disputed status', () => {
      const { container } = render(<StatusBadge status="Disputed" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for Pending status', () => {
      const { container } = render(<StatusBadge status="Pending" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for Paid status', () => {
      const { container } = render(<StatusBadge status="Paid" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with additional className', () => {
      const { container } = render(<StatusBadge status="Active" className="ml-2" />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
