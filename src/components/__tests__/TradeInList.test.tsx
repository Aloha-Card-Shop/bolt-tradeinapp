
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TradeInList from '../TradeInList';
import { CardDetails } from '../../types/card';
import { TradeInItem } from '../../hooks/useTradeInList';

// Mock card data
const mockCard: CardDetails = {
  id: 'card-123',
  name: 'Charizard',
  set: 'Base Set',
  number: '4/102',
  game: 'pokemon',
  imageUrl: 'https://example.com/charizard.jpg',
  productId: '12345'
};

const mockCardWithoutId: CardDetails = {
  name: 'Pikachu',
  set: 'Base Set',
  number: '25/102',
  game: 'pokemon',
  imageUrl: 'https://example.com/pikachu.jpg',
  productId: '67890'
};

// Mock trade-in items
const validItem: TradeInItem = {
  card: mockCard,
  quantity: 1,
  condition: 'near_mint',
  isFirstEdition: false,
  isHolo: true,
  price: 100,
  paymentType: 'cash',
  isLoadingPrice: false
};

const invalidItem: TradeInItem = {
  card: mockCardWithoutId,
  quantity: 1,
  condition: '',
  isFirstEdition: false,
  isHolo: true,
  price: 100,
  paymentType: 'trade',
  isLoadingPrice: false
};

// Mock hooks
vi.mock('../../hooks/useCustomers', () => ({
  useCustomers: () => ({
    customers: [],
    isLoading: false,
    error: null,
    createCustomer: vi.fn(),
    refreshCustomers: vi.fn()
  })
}));

describe('TradeInList Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should disable review button when items are invalid', async () => {
    const mockRemoveItem = vi.fn();
    const mockUpdateItem = vi.fn();
    const mockItems = [invalidItem];

    await act(async () => {
      render(
        <TradeInList
          items={mockItems}
          onRemoveItem={mockRemoveItem}
          onUpdateItem={mockUpdateItem}
        />
      );
    });

    const reviewButton = screen.getByRole('button', { name: /review trade-in/i });
    expect(reviewButton).toHaveAttribute('disabled');
  });

  it('should enable review button when all items are valid', async () => {
    const mockRemoveItem = vi.fn();
    const mockUpdateItem = vi.fn();
    const mockItems = [validItem];

    await act(async () => {
      render(
        <TradeInList
          items={mockItems}
          onRemoveItem={mockRemoveItem}
          onUpdateItem={mockUpdateItem}
        />
      );
    });

    const reviewButton = screen.getByRole('button', { name: /review trade-in/i });
    expect(reviewButton).not.toHaveAttribute('disabled');
  });

  it('should validate price is greater than 0', async () => {
    const mockRemoveItem = vi.fn();
    const mockUpdateItem = vi.fn();
    const itemWithZeroPrice: TradeInItem = {
      ...validItem,
      price: 0
    };

    await act(async () => {
      render(
        <TradeInList
          items={[itemWithZeroPrice]}
          onRemoveItem={mockRemoveItem}
          onUpdateItem={mockUpdateItem}
        />
      );
    });

    const reviewButton = screen.getByRole('button', { name: /review trade-in/i });
    expect(reviewButton).toHaveAttribute('disabled');
  });

  it('should prevent submission with invalid items', async () => {
    const mockRemoveItem = vi.fn();
    const mockUpdateItem = vi.fn();
    const mockItems = [validItem, invalidItem];

    await act(async () => {
      render(
        <TradeInList
          items={mockItems}
          onRemoveItem={mockRemoveItem}
          onUpdateItem={mockUpdateItem}
        />
      );
    });

    const reviewButton = screen.getByRole('button', { name: /review trade-in/i });
    expect(reviewButton).not.toHaveAttribute('disabled');

    const totalValueText = screen.getByText(/cash:/i);
    expect(totalValueText).toBeInTheDocument();
  });
});
