import React, { type ReactNode } from 'react';
import { BipsContext, type BipsContextValue } from '../provider/BipsContext';
import type { BipsConfig, BipsItem, BipsPurchaseResult } from '@bips/core';

const defaultItem: BipsItem = {
  id: 'hint',
  name: 'Hint',
  description: 'Get a hint',
  price: '0.05',
  currency: 'USDC',
};

const defaultConfig: BipsConfig = {
  appId: 'test-app',
  appName: 'Test App',
  receiverAddress: '0x1234567890123456789012345678901234567890',
  network: 'base-sepolia',
  items: [defaultItem],
};

interface TestWrapperOptions {
  isConnected?: boolean;
  isReady?: boolean;
  walletAddress?: string | null;
  items?: BipsItem[];
  purchaseResult?: BipsPurchaseResult;
  setMockPurchaseResult?: (result: BipsPurchaseResult) => void;
}

export function createTestWrapper(options: TestWrapperOptions = {}) {
  const {
    isConnected = false,
    isReady = false,
    walletAddress = null,
    items = [defaultItem],
    purchaseResult = {
      success: false,
      error: 'Test error',
      code: 'PAYMENT_FAILED' as const,
    },
    setMockPurchaseResult,
  } = options;

  // Update the mock result if setter provided
  setMockPurchaseResult?.(purchaseResult);

  const config = { ...defaultConfig, items };

  const contextValue: BipsContextValue = {
    config,
    items,
    isReady,
    isConnected,
    userState: null,
    purchase: async (_itemId: string) => purchaseResult,
    getItem: (itemId: string) => items.find((i) => i.id === itemId),
    walletAddress,
  };

  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <BipsContext.Provider value={contextValue}>
        {children}
      </BipsContext.Provider>
    );
  };
}

export { defaultItem, defaultConfig };
