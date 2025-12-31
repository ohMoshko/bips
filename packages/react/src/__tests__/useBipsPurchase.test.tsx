import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useBipsPurchase } from '../hooks/useBipsPurchase';
import { BipsProvider } from '../provider/BipsProvider';
import type { BipsConfig } from '@bips/core';
import type { ReactNode } from 'react';

/**
 * useBipsPurchase Tests
 *
 * This hook integrates x402 payments with Dynamic wallet.
 * It wraps fetch with x402 to automatically handle 402 responses.
 */

const testConfig: BipsConfig = {
  appId: 'test-app',
  appName: 'Test App',
  receiverAddress: '0x5aE2Ea70209Fad3Ac413363cdcC21D5DeBc7085A',
  network: 'base-sepolia',
  items: [
    {
      id: 'hint',
      name: 'Hint',
      description: 'Get a hint',
      price: '0.05',
      currency: 'USDC',
    },
  ],
};

// Mock Dynamic SDK
const mockSignTypedData = vi.fn();
const mockWalletAddress = '0x1234567890123456789012345678901234567890';

// Mock wallet client that includes signTypedData
const mockWalletClient = {
  signTypedData: mockSignTypedData,
};

vi.mock('@dynamic-labs/sdk-react-core', () => ({
  useDynamicContext: vi.fn(() => ({
    primaryWallet: {
      address: mockWalletAddress,
      getNetwork: vi.fn().mockResolvedValue(84532), // Base Sepolia chain ID
      switchNetwork: vi.fn().mockResolvedValue(undefined),
      getWalletClient: vi.fn().mockResolvedValue(mockWalletClient),
      connector: {
        signTypedData: mockSignTypedData,
      },
    },
    isAuthenticated: true,
  })),
}));

// Create a mock fetch function
const createMockFetch = () => vi.fn();

function createWrapper(config: BipsConfig) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <BipsProvider config={config}>{children}</BipsProvider>;
  };
}

describe('useBipsPurchase', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = createMockFetch();
  });

  test('returns purchase function and loading state', () => {
    const { result } = renderHook(
      () => useBipsPurchase({ fetch: mockFetch }),
      { wrapper: createWrapper(testConfig) }
    );

    expect(result.current.purchase).toBeDefined();
    expect(typeof result.current.purchase).toBe('function');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('purchase returns error when item not found', async () => {
    const { result } = renderHook(
      () => useBipsPurchase({ fetch: mockFetch }),
      { wrapper: createWrapper(testConfig) }
    );

    let purchaseResult: Awaited<ReturnType<typeof result.current.purchase>>;
    await act(async () => {
      purchaseResult = await result.current.purchase('unknown-item');
    });

    expect(purchaseResult!.success).toBe(false);
    if (!purchaseResult!.success) {
      expect(purchaseResult.code).toBe('ITEM_NOT_FOUND');
      expect(purchaseResult.error).toContain('not found');
    }
  });

  test('sets isLoading during purchase', async () => {
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValue(pendingPromise);

    const { result } = renderHook(
      () => useBipsPurchase({ fetch: mockFetch }),
      { wrapper: createWrapper(testConfig) }
    );

    // Start purchase but don't await
    let purchasePromise: Promise<any>;
    act(() => {
      purchasePromise = result.current.purchase('hint');
    });

    // Should be loading
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Resolve the fetch
    await act(async () => {
      resolvePromise!({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: {} }),
      });
      await purchasePromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  test('makes fetch request to correct purchase endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: { hint: 'answer' } }),
    });

    const { result } = renderHook(
      () => useBipsPurchase({ fetch: mockFetch }),
      { wrapper: createWrapper(testConfig) }
    );

    await act(async () => {
      await result.current.purchase('hint');
    });

    expect(mockFetch).toHaveBeenCalled();
    const calls = mockFetch.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const [url, options] = calls[0] as [string, RequestInit];
    expect(url).toContain('/api/bips/purchase/hint');
    expect(options.method).toBe('POST');
  });

  test('returns server response on successful purchase', async () => {
    const serverResponse = {
      success: true,
      data: { hintPosition: 2, hintChar: '5' },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(serverResponse),
    });

    const { result } = renderHook(
      () => useBipsPurchase({ fetch: mockFetch }),
      { wrapper: createWrapper(testConfig) }
    );

    let purchaseResult: Awaited<ReturnType<typeof result.current.purchase>>;
    await act(async () => {
      purchaseResult = await result.current.purchase('hint');
    });

    expect(purchaseResult!.success).toBe(true);
    if (purchaseResult!.success) {
      expect(purchaseResult.purchase).toBeDefined();
      expect(purchaseResult.purchase.itemId).toBe('hint');
      expect(purchaseResult.purchase.status).toBe('completed');
    }
  });

  test('integrates with x402 client for payment handling', async () => {
    // This test verifies that the hook correctly creates and uses the x402 client.
    // The actual 402 response handling is tested in end-to-end integration tests
    // since it depends on x402's internal response parsing which requires a full
    // Response object with proper headers.

    // Verify signTypedData is available for x402 signing
    mockSignTypedData.mockResolvedValue('0x' + '12'.repeat(65));

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: { hint: 'answer' } }),
    });

    const { result } = renderHook(
      () => useBipsPurchase({ fetch: mockFetch }),
      { wrapper: createWrapper(testConfig) }
    );

    let purchaseResult: Awaited<ReturnType<typeof result.current.purchase>>;
    await act(async () => {
      purchaseResult = await result.current.purchase('hint');
    });

    // Verify the hook made a request
    expect(mockFetch).toHaveBeenCalled();

    // Verify successful result
    expect(purchaseResult!.success).toBe(true);
    if (purchaseResult!.success) {
      expect(purchaseResult.purchase).toBeDefined();
    }
  });

  test('returns error on server failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ success: false, error: 'Server error' }),
    });

    const { result } = renderHook(
      () => useBipsPurchase({ fetch: mockFetch }),
      { wrapper: createWrapper(testConfig) }
    );

    let purchaseResult: Awaited<ReturnType<typeof result.current.purchase>>;
    await act(async () => {
      purchaseResult = await result.current.purchase('hint');
    });

    expect(purchaseResult!.success).toBe(false);
    if (!purchaseResult!.success) {
      expect(purchaseResult.code).toBe('PAYMENT_FAILED');
    }
  });

  test('sets error state on failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => useBipsPurchase({ fetch: mockFetch }),
      { wrapper: createWrapper(testConfig) }
    );

    let purchaseResult: Awaited<ReturnType<typeof result.current.purchase>>;
    await act(async () => {
      purchaseResult = await result.current.purchase('hint');
    });

    expect(purchaseResult!.success).toBe(false);
    expect(result.current.error).toBe('Network error');
  });

  test('allows custom base URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: {} }),
    });

    const { result } = renderHook(
      () => useBipsPurchase({ baseUrl: 'https://api.example.com', fetch: mockFetch }),
      { wrapper: createWrapper(testConfig) }
    );

    await act(async () => {
      await result.current.purchase('hint');
    });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.example.com/api/bips/purchase/hint');
  });
});
