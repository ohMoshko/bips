/**
 * BipsProvider - The root component for Bips integration
 *
 * Wraps your app and provides Bips context to all children.
 * Must be nested inside DynamicContextProvider.
 *
 * @example
 * <DynamicContextProvider settings={...}>
 *   <BipsProvider config={bipsConfig}>
 *     <App />
 *   </BipsProvider>
 * </DynamicContextProvider>
 */

import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { BipsContext, type BipsContextValue } from './BipsContext';
import type {
  BipsConfig,
  BipsItem,
  BipsPurchaseResult,
  BipsUserState,
} from '@bips/core';
import { findItem } from '@bips/core';

interface BipsProviderProps {
  config: BipsConfig;
  children: ReactNode;
}

/**
 * Provider component that makes Bips functionality available to the app.
 *
 * This is a "smart" component - it manages state and effects.
 * Think of it like a LiveView that holds state and handles events.
 */
export function BipsProvider({ config, children }: BipsProviderProps) {
  // For now, we'll implement a minimal version.
  // Full Dynamic integration will come in Phase 3.

  // User state - will be loaded from Dynamic metadata
  // _setUserState will be used when we implement Dynamic integration
  const [userState, _setUserState] = useState<BipsUserState | null>(null);

  // TODO: Get these from Dynamic SDK
  const isConnected = false;
  const walletAddress: string | null = null;

  // Ready when we have a wallet connected
  const isReady = isConnected && walletAddress !== null;

  // Get an item by ID
  const getItem = useCallback(
    (itemId: string): BipsItem | undefined => {
      return findItem(config, itemId);
    },
    [config]
  );

  // Execute a purchase
  const purchase = useCallback(
    async (itemId: string): Promise<BipsPurchaseResult> => {
      // Validate state
      if (!isConnected) {
        return {
          success: false,
          error: 'Wallet not connected',
          code: 'WALLET_NOT_CONNECTED',
        };
      }

      const item = getItem(itemId);
      if (!item) {
        return {
          success: false,
          error: `Item "${itemId}" not found`,
          code: 'ITEM_NOT_FOUND',
        };
      }

      // TODO: Implement actual x402 payment flow
      // For now, return a placeholder error
      return {
        success: false,
        error: 'Payment flow not yet implemented',
        code: 'PAYMENT_FAILED',
      };
    },
    [isConnected, getItem]
  );

  // Memoize the context value to prevent unnecessary re-renders
  // This is like storing computed values in Elixir to avoid recalculation
  const contextValue = useMemo<BipsContextValue>(
    () => ({
      config,
      items: config.items,
      isReady,
      isConnected,
      userState,
      purchase,
      getItem,
      walletAddress,
    }),
    [config, isReady, isConnected, userState, purchase, getItem, walletAddress]
  );

  return (
    <BipsContext.Provider value={contextValue}>{children}</BipsContext.Provider>
  );
}
