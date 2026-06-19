/**
 * StatusBadge Component
 *
 * A reusable badge component that displays contract and milestone statuses
 * with consistent styling and color mapping.
 */

export type StatusType = 'Active' | 'Completed' | 'Disputed' | 'Pending' | 'Paid';

export interface StatusBadgeProps {
  /** The status value to display */
  status: StatusType;
  /** Additional CSS classes to apply to the badge */
  className?: string;
}

/**
 * Unified color and style map for all status types.
 * Ensures consistent visual representation across the application.
 */
const statusColorMap: Record<StatusType, string> = {
  Active: 'bg-emerald-100 text-emerald-800',
  Completed: 'bg-sky-100 text-sky-800',
  Disputed: 'bg-rose-100 text-rose-800',
  Pending: 'bg-amber-100 text-amber-800',
  Paid: 'bg-emerald-100 text-emerald-800',
};

/**
 * StatusBadge component renders a styled badge pill for contract and milestone statuses.
 *
 * @param status - The status value to display (Active, Completed, Disputed, Pending, or Paid)
 * @param className - Optional additional CSS classes
 * @returns A styled badge element with appropriate color based on status
 *
 * @example
 * ```tsx
 * <StatusBadge status="Completed" />
 * <StatusBadge status="Pending" className="ml-2" />
 * ```
 */
const StatusBadge = ({ status, className = '' }: StatusBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${statusColorMap[status]} ${className}`}
      role="status"
      aria-label={`Status: ${status}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
