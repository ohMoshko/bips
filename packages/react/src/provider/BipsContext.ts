/**
 * Bips React Context
 *
 * This is like an Elixir Agent or GenServer - it holds state
 * and provides a way to interact with it from anywhere in the component tree.
 */

import { createContext, useContext } from 'react';
import type {
  BipsConfig,
  BipsItem,
  BipsPurchaseResult,
  BipsUserState,
} from '@bips/core';

/**
 * The shape of the Bips context value.
 * Everything a consumer needs to interact with Bips.
 */
export interface BipsContextValue {
  // Configuration
  config: BipsConfig;
  items: BipsItem[];

  // Connection state
  isReady: boolean;
  isConnected: boolean;

  // User state (purchases, spending, etc.)
  userState: BipsUserState | null;

  // Actions
  purchase: (itemId: string) => Promise<BipsPurchaseResult>;
  getItem: (itemId: string) => BipsItem | undefined;

  // Wallet info (from Dynamic)
  walletAddress: string | null;
}

/**
 * The context itself. null means we're outside a BipsProvider.
 * This pattern ensures we catch missing providers early.
 */
export const BipsContext = createContext<BipsContextValue | null>(null);

/**
 * Hook to access the Bips context.
 * Throws if used outside of BipsProvider - fail fast, like Elixir's bang functions.
 *
 * @throws Error if used outside BipsProvider
 */
export function useBipsContext(): BipsContextValue {
  const context = useContext(BipsContext);

  if (!context) {
    throw new Error(
      'useBipsContext must be used within a BipsProvider. ' +
        'Make sure your component is wrapped with <BipsProvider>.'
    );
  }

  return context;
}
