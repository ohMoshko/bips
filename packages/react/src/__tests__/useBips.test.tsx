import { describe, test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBips } from '../hooks/useBips';
import { createTestWrapper, defaultItem } from './testUtils';

describe('useBips', () => {
  describe('connection state', () => {
    test('returns isReady: false when wallet not connected', () => {
      const { result } = renderHook(() => useBips(), {
        wrapper: createTestWrapper({ isConnected: false, isReady: false }),
      });

      expect(result.current.isReady).toBe(false);
      expect(result.current.isConnected).toBe(false);
    });

    test('returns isReady: true when fully connected', () => {
      const { result } = renderHook(() => useBips(), {
        wrapper: createTestWrapper({
          isConnected: true,
          isReady: true,
          walletAddress: '0x123',
        }),
      });

      expect(result.current.isReady).toBe(true);
      expect(result.current.isConnected).toBe(true);
    });

    test('returns wallet address when connected', () => {
      const address = '0xabcdef1234567890';
      const { result } = renderHook(() => useBips(), {
        wrapper: createTestWrapper({
          isConnected: true,
          walletAddress: address,
        }),
      });

      expect(result.current.walletAddress).toBe(address);
    });
  });

  describe('items', () => {
    test('returns items from config', () => {
      const { result } = renderHook(() => useBips(), {
        wrapper: createTestWrapper({ items: [defaultItem] }),
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toEqual(defaultItem);
    });

    test('getItem returns item by id', () => {
      const { result } = renderHook(() => useBips(), {
        wrapper: createTestWrapper({ items: [defaultItem] }),
      });

      const item = result.current.getItem('hint');
      expect(item).toEqual(defaultItem);
    });

    test('getItem returns undefined for non-existent id', () => {
      const { result } = renderHook(() => useBips(), {
        wrapper: createTestWrapper({ items: [defaultItem] }),
      });

      const item = result.current.getItem('non-existent');
      expect(item).toBeUndefined();
    });
  });

  describe('purchase history', () => {
    test('returns empty purchases by default', () => {
      const { result } = renderHook(() => useBips(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.purchases).toEqual([]);
    });

    test('returns "0" for totalSpent by default', () => {
      const { result } = renderHook(() => useBips(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.totalSpent).toBe('0');
    });
  });

  describe('purchase function', () => {
    test('returns success result when purchase succeeds', async () => {
      const successResult = {
        success: true as const,
        purchase: {
          id: 'purchase-1',
          itemId: 'hint',
          price: '0.05',
          currency: 'USDC' as const,
          timestamp: Date.now(),
          status: 'completed' as const,
        },
      };

      const { result } = renderHook(() => useBips(), {
        wrapper: createTestWrapper({ purchaseResult: successResult }),
      });

      const purchaseResult = await result.current.purchase('hint');
      expect(purchaseResult.success).toBe(true);
      if (purchaseResult.success) {
        expect(purchaseResult.purchase.itemId).toBe('hint');
      }
    });

    test('returns error result when purchase fails', async () => {
      const failResult = {
        success: false as const,
        error: 'Insufficient balance',
        code: 'INSUFFICIENT_BALANCE' as const,
      };

      const { result } = renderHook(() => useBips(), {
        wrapper: createTestWrapper({ purchaseResult: failResult }),
      });

      const purchaseResult = await result.current.purchase('hint');
      expect(purchaseResult.success).toBe(false);
      if (!purchaseResult.success) {
        expect(purchaseResult.error).toBe('Insufficient balance');
        expect(purchaseResult.code).toBe('INSUFFICIENT_BALANCE');
      }
    });
  });
});

describe('useBips - error handling', () => {
  test('throws when used outside BipsProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useBips());
    }).toThrow('useBipsContext must be used within a BipsProvider');

    consoleSpy.mockRestore();
  });
});
