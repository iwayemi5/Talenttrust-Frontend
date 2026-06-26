import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MilestonesPage from '../page';

/**
 * @file page.test.tsx
 * @description Comprehensive unit and integration tests for the Milestones page.
 *
 * This test suite covers:
 * 1. Default load state: Rendering all sample milestones when the page is first loaded.
 * 2. Empty state: Displaying the "No milestones tracked" EmptyState when the milestone list is empty.
 * 3. Status filtering: Filtering milestones by each of the available statuses:
 *    - All (shows all milestones)
 *    - Pending (shows only pending milestones)
 *    - Completed (shows only completed milestones)
 *    - Paid (shows only paid milestones)
 *    - Disputed (shows only disputed milestones)
 * 4. Empty-filter state: Displaying the "No milestones match this filter" EmptyState when a filter yields zero results.
 * 5. Accessibility (a11y): Ensuring the live region updates with the correct text announcement for screen readers.
 * 6. Interaction: Ensuring that the "Add Milestone" action buttons correctly trigger the callback function.
 */

describe('MilestonesPage', () => {
  // -------------------------------------------------------------------------
  // Empty State Scenarios
  // -------------------------------------------------------------------------

  /**
   * Scenario: Render the Milestones page with an empty list of milestones.
   * This asserts that the page displays the "No milestones tracked" empty state,
   * showing proper illustration, title, and description.
   */
  it('renders EmptyState when milestones array is empty', () => {
    render(<MilestonesPage milestones={[]} />);

    expect(screen.getByRole('heading', { level: 2, name: 'No milestones tracked' })).toBeInTheDocument();
    expect(
      screen.getByText(
        /track your progress by adding milestones to your contracts/i
      )
    ).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Default Load Scenarios
  // -------------------------------------------------------------------------

  /**
   * Scenario: Render the Milestones page with default sample data.
   * This asserts that all five default sample milestones are successfully rendered
   * in the DOM under the default "All" filter.
   */
  it('renders all sample milestones on load with "All" filter selected', () => {
    render(<MilestonesPage />);

    expect(screen.getByText('Project Kickoff & Discovery')).toBeInTheDocument();
    expect(screen.getByText('UI/UX Design Handoff')).toBeInTheDocument();
    expect(screen.getByText('Frontend Development – Sprint 1')).toBeInTheDocument();
    expect(screen.getByText('API Integration & Testing')).toBeInTheDocument();
    expect(screen.getByText('Payment Gateway Integration')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Filter Control Accessibility Scenarios
  // -------------------------------------------------------------------------

  /**
   * Scenario: Inspect the status filter control options.
   * This asserts that the status filter is presented as an accessible radiogroup
   * containing all expected options, with the "All" option selected by default.
   */
  it('renders an accessible radiogroup for status filtering', () => {
    render(<MilestonesPage />);

    const group = screen.getByRole('radiogroup', { name: /filter milestones by status/i });
    expect(group).toBeInTheDocument();

    // All five radio buttons present
    expect(screen.getByRole('radio', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Pending' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Completed' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Paid' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Disputed' })).toBeInTheDocument();

    // "All" is checked by default
    expect(screen.getByRole('radio', { name: 'All' })).toBeChecked();
  });

  // -------------------------------------------------------------------------
  // Status Filtering Scenarios
  // -------------------------------------------------------------------------

  /**
   * Scenario: Select the "Pending" status filter.
   * This asserts that only the milestones with "Pending" status are visible,
   * while all other milestones are removed from the DOM.
   */
  it('shows only Pending milestones when "Pending" filter is selected', async () => {
    const user = userEvent.setup();
    render(<MilestonesPage />);

    await user.click(screen.getByRole('radio', { name: 'Pending' }));

    // Pending items must be visible
    expect(screen.getByText('Frontend Development – Sprint 1')).toBeInTheDocument();
    expect(screen.getByText('API Integration & Testing')).toBeInTheDocument();

    // Non-pending items must be absent
    expect(screen.queryByText('Project Kickoff & Discovery')).not.toBeInTheDocument();
    expect(screen.queryByText('UI/UX Design Handoff')).not.toBeInTheDocument();
    expect(screen.queryByText('Payment Gateway Integration')).not.toBeInTheDocument();
  });

  /**
   * Scenario: Select the "Completed" status filter.
   * This asserts that only the milestones with "Completed" status are visible,
   * while all other milestones are removed from the DOM.
   */
  it('shows only the Completed milestone when "Completed" filter is selected', async () => {
    const user = userEvent.setup();
    render(<MilestonesPage />);

    await user.click(screen.getByRole('radio', { name: 'Completed' }));

    expect(screen.getByText('Project Kickoff & Discovery')).toBeInTheDocument();

    expect(screen.queryByText('UI/UX Design Handoff')).not.toBeInTheDocument();
    expect(screen.queryByText('Frontend Development – Sprint 1')).not.toBeInTheDocument();
    expect(screen.queryByText('API Integration & Testing')).not.toBeInTheDocument();
    expect(screen.queryByText('Payment Gateway Integration')).not.toBeInTheDocument();
  });

  /**
   * Scenario: Select the "Paid" status filter.
   * This asserts that only the milestones with "Paid" status are visible,
   * while all other milestones are removed from the DOM.
   */
  it('shows only the Paid milestone when "Paid" filter is selected', async () => {
    const user = userEvent.setup();
    render(<MilestonesPage />);

    await user.click(screen.getByRole('radio', { name: 'Paid' }));

    expect(screen.getByText('UI/UX Design Handoff')).toBeInTheDocument();

    expect(screen.queryByText('Project Kickoff & Discovery')).not.toBeInTheDocument();
    expect(screen.queryByText('Frontend Development – Sprint 1')).not.toBeInTheDocument();
    expect(screen.queryByText('API Integration & Testing')).not.toBeInTheDocument();
    expect(screen.queryByText('Payment Gateway Integration')).not.toBeInTheDocument();
  });

  /**
   * Scenario: Select the "Disputed" status filter.
   * This asserts that only the milestones with "Disputed" status are visible,
   * while all other milestones are removed from the DOM.
   */
  it('shows only the Disputed milestone when "Disputed" filter is selected', async () => {
    const user = userEvent.setup();
    render(<MilestonesPage />);

    await user.click(screen.getByRole('radio', { name: 'Disputed' }));

    expect(screen.getByText('Payment Gateway Integration')).toBeInTheDocument();

    expect(screen.queryByText('Project Kickoff & Discovery')).not.toBeInTheDocument();
    expect(screen.queryByText('UI/UX Design Handoff')).not.toBeInTheDocument();
    expect(screen.queryByText('Frontend Development – Sprint 1')).not.toBeInTheDocument();
    expect(screen.queryByText('API Integration & Testing')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Filter Reset Scenarios
  // -------------------------------------------------------------------------

  /**
   * Scenario: Apply a filter and then switch back to the "All" filter.
   * This asserts that switching back to "All" successfully restores all milestones to the view.
   */
  it('restores all milestones when switching back to "All" after a filter', async () => {
    const user = userEvent.setup();
    render(<MilestonesPage />);

    // Apply a filter first
    await user.click(screen.getByRole('radio', { name: 'Disputed' }));
    expect(screen.queryByText('Project Kickoff & Discovery')).not.toBeInTheDocument();

    // Reset to All
    await user.click(screen.getByRole('radio', { name: 'All' }));

    expect(screen.getByText('Project Kickoff & Discovery')).toBeInTheDocument();
    expect(screen.getByText('UI/UX Design Handoff')).toBeInTheDocument();
    expect(screen.getByText('Frontend Development – Sprint 1')).toBeInTheDocument();
    expect(screen.getByText('API Integration & Testing')).toBeInTheDocument();
    expect(screen.getByText('Payment Gateway Integration')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Empty-Filter (No Match) Scenarios
  // -------------------------------------------------------------------------

  /**
   * Scenario: Filter milestones when the list has no items matching the status.
   * This asserts that the page displays the "No milestones match this filter"
   * EmptyState and includes the name of the selected filter in the description.
   */
  it('renders the no-match EmptyState when a filter yields zero milestones', async () => {
    const user = userEvent.setup();

    render(
      <MilestonesPage
        milestones={[
          {
            id: '1',
            title: 'Project Briefing',
            status: 'Completed',
            payout: 1200,
            currency: 'USD',
            dueDate: '2026-02-01',
          },
          {
            id: '2',
            title: 'Development Planning',
            status: 'Pending',
            payout: 1800,
            currency: 'USD',
            dueDate: '2026-02-15',
          },
        ]}
      />,
    );

    // Filter by 'Paid' which yields zero matches from the custom list
    await user.click(screen.getByRole('radio', { name: 'Paid' }));

    expect(screen.getByRole('heading', { level: 2, name: 'No milestones match this filter' })).toBeInTheDocument();
    expect(screen.getByText(/there are no paid milestones at the moment/i)).toBeInTheDocument();
    expect(screen.queryByText('Project Briefing')).not.toBeInTheDocument();
    expect(screen.queryByText('Development Planning')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Interaction Scenarios
  // -------------------------------------------------------------------------

  /**
   * Scenario: Click the "Add Milestone" action button inside the EmptyState.
   * This asserts that clicking the button successfully invokes the callback handler,
   * logging the expected message to the console.
   */
  it('calls handleAddMilestone when clicking "Add Milestone" action button', async () => {
    const user = userEvent.setup();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Render with an empty list to show the initial EmptyState
    render(<MilestonesPage milestones={[]} />);

    // Find and click the "Add Milestone" action button
    const addButton = screen.getByRole('button', { name: /Add Milestone/i });
    await user.click(addButton);

    expect(logSpy).toHaveBeenCalledWith('Add milestone');
    logSpy.mockRestore();
  });

  // -------------------------------------------------------------------------
  // Accessibility Live Region Scenarios
  // -------------------------------------------------------------------------

  /**
   * Scenario: Check live region announcement updates when filtering.
   * This asserts that an aria-live region is present and correctly updates
   * its announcement text to assist screen reader users as different filters are selected.
   */
  it('renders an aria-live region with the correct result announcement', async () => {
    const user = userEvent.setup();
    render(<MilestonesPage />);

    // Default: "All" filter → 5 milestones
    expect(screen.getByText(/showing all 5 milestones/i)).toBeInTheDocument();

    // Switch to Pending → 2 milestones
    await user.click(screen.getByRole('radio', { name: 'Pending' }));
    expect(screen.getByText(/showing 2 pending milestones/i)).toBeInTheDocument();

    // Switch to Completed → 1 milestone
    await user.click(screen.getByRole('radio', { name: 'Completed' }));
    expect(screen.getByText(/showing 1 completed milestone/i)).toBeInTheDocument();
  });
});