import { describe, it, expect } from 'vitest';
import { render, screen } from '../helpers';

// Simple component for testing
function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

describe('DashboardCard', () => {
  it('renders title and value', () => {
    render(<DashboardCard title="Active Participants" value="5" />);
    expect(screen.getByText('Active Participants')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders with different data', () => {
    render(<DashboardCard title="Shifts Today" value="4" />);
    expect(screen.getByText('Shifts Today')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
