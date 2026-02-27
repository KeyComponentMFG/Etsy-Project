import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LowStockAlerts from './LowStockAlerts';

const mockFilaments = {
  member1: [
    { color: 'Red PLA', amount: 100, reorderAt: 250, backupRolls: [] },
    { color: 'Blue PLA', amount: 500, reorderAt: 250, backupRolls: [] },
  ],
};

const mockExternalParts = {
  member1: [
    { name: 'LED Strip', quantity: 2, reorderAt: 5 },
    { name: 'Screws', quantity: 100, reorderAt: 20 },
  ],
};

const mockTeamMembers = [{ id: 'member1', name: 'Partner 1' }];

const mockModels = [
  { name: 'Lamp Base', variantName: 'Large', stockCount: 2 },
  { name: 'Phone Stand', stockCount: 10 },
];

describe('LowStockAlerts', () => {
  it('renders alerts for low stock items', () => {
    render(
      <LowStockAlerts
        filaments={mockFilaments}
        externalParts={mockExternalParts}
        teamMembers={mockTeamMembers}
        models={mockModels}
        setActiveTab={() => {}}
      />
    );
    expect(screen.getByText(/Low Stock Alert/)).toBeInTheDocument();
    expect(screen.getByText(/Red PLA/)).toBeInTheDocument();
    expect(screen.getByText(/LED Strip/)).toBeInTheDocument();
    expect(screen.getByText(/Lamp Base \(Large\)/)).toBeInTheDocument();
  });

  it('does not render when no items are low', () => {
    const { container } = render(
      <LowStockAlerts
        filaments={{ member1: [{ color: 'Green', amount: 500, reorderAt: 250, backupRolls: [] }] }}
        externalParts={{ member1: [] }}
        teamMembers={mockTeamMembers}
        models={[{ name: 'Test', stockCount: 10 }]}
        setActiveTab={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('can be dismissed', () => {
    const { container } = render(
      <LowStockAlerts
        filaments={mockFilaments}
        externalParts={mockExternalParts}
        teamMembers={mockTeamMembers}
        models={mockModels}
        setActiveTab={() => {}}
      />
    );

    expect(screen.getByText(/Low Stock Alert/)).toBeInTheDocument();

    // Click the dismiss X button
    const buttons = container.querySelectorAll('button');
    const dismissButton = Array.from(buttons).find(b => !b.textContent.includes('Restock'));
    fireEvent.click(dismissButton);

    expect(screen.queryByText(/Low Stock Alert/)).not.toBeInTheDocument();
  });

  it('calls setActiveTab when View Restock List is clicked', () => {
    const mockSetActiveTab = vi.fn();
    render(
      <LowStockAlerts
        filaments={mockFilaments}
        externalParts={mockExternalParts}
        teamMembers={mockTeamMembers}
        models={mockModels}
        setActiveTab={mockSetActiveTab}
      />
    );

    fireEvent.click(screen.getByText('View Restock List'));
    expect(mockSetActiveTab).toHaveBeenCalledWith('restock');
  });

  it('shows +N more when more than 5 low stock items', () => {
    const manyFilaments = {
      member1: Array.from({ length: 8 }, (_, i) => ({
        color: `Color ${i}`,
        amount: 50,
        reorderAt: 250,
        backupRolls: [],
      })),
    };

    render(
      <LowStockAlerts
        filaments={manyFilaments}
        externalParts={{ member1: [] }}
        teamMembers={mockTeamMembers}
        models={[]}
        setActiveTab={() => {}}
      />
    );

    expect(screen.getByText(/\+\d+ more/)).toBeInTheDocument();
  });
});
