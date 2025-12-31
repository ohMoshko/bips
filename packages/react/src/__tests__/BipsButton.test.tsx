import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BipsButton } from '../components/BipsButton';
import { createTestWrapper, defaultItem } from './testUtils';
import type { BipsPurchaseResult } from '@bips/core';

// Store mock result - tests update this via createTestWrapper
let mockPurchaseResult: BipsPurchaseResult = {
  success: false,
  error: 'Test error',
  code: 'PAYMENT_FAILED' as const,
};

// Mock useBipsPurchase for BipsButton tests
vi.mock('../hooks/useBipsPurchase', () => ({
  useBipsPurchase: () => ({
    purchase: async () => mockPurchaseResult,
    isLoading: false,
    error: null,
  }),
}));

// Export setter for testUtils
export function setMockPurchaseResult(result: BipsPurchaseResult) {
  mockPurchaseResult = result;
}

describe('BipsButton', () => {
  describe('rendering', () => {
    test('renders with default content showing item name and price', () => {
      render(<BipsButton itemId="hint" />, {
        wrapper: createTestWrapper({ items: [defaultItem], setMockPurchaseResult }),
      });

      expect(screen.getByRole('button')).toHaveTextContent('Hint ($0.05)');
    });

    test('renders with custom children', () => {
      render(<BipsButton itemId="hint">Get a Hint!</BipsButton>, {
        wrapper: createTestWrapper({ items: [defaultItem], setMockPurchaseResult }),
      });

      expect(screen.getByRole('button')).toHaveTextContent('Get a Hint!');
    });

    test('renders nothing when item does not exist', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { container } = render(<BipsButton itemId="non-existent" />, {
        wrapper: createTestWrapper({ items: [defaultItem], setMockPurchaseResult }),
      });

      expect(container.firstChild).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('non-existent')
      );

      consoleSpy.mockRestore();
    });

    test('applies className prop', () => {
      render(<BipsButton itemId="hint" className="custom-class" />, {
        wrapper: createTestWrapper({ items: [defaultItem], setMockPurchaseResult }),
      });

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('disabled state', () => {
    test('is disabled when disabled prop is true', () => {
      render(<BipsButton itemId="hint" disabled />, {
        wrapper: createTestWrapper({ items: [defaultItem], setMockPurchaseResult }),
      });

      expect(screen.getByRole('button')).toBeDisabled();
    });

    test('is enabled when not disabled', () => {
      render(<BipsButton itemId="hint" />, {
        wrapper: createTestWrapper({ items: [defaultItem], setMockPurchaseResult }),
      });

      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  describe('purchase flow', () => {
    test('calls onSuccess when purchase succeeds', async () => {
      const onSuccess = vi.fn();
      const successPurchase = {
        id: 'purchase-1',
        itemId: 'hint',
        price: '0.05',
        currency: 'USDC' as const,
        timestamp: Date.now(),
        status: 'completed' as const,
      };

      render(<BipsButton itemId="hint" onSuccess={onSuccess} />, {
        wrapper: createTestWrapper({
          items: [defaultItem],
          purchaseResult: { success: true, purchase: successPurchase },
          setMockPurchaseResult,
        }),
      });

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(successPurchase);
      });
    });

    test('calls onError when purchase fails', async () => {
      const onError = vi.fn();

      render(<BipsButton itemId="hint" onError={onError} />, {
        wrapper: createTestWrapper({
          items: [defaultItem],
          purchaseResult: {
            success: false,
            error: 'Insufficient funds',
            code: 'INSUFFICIENT_BALANCE',
          },
          setMockPurchaseResult,
        }),
      });

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Insufficient funds');
      });
    });
  });
});
