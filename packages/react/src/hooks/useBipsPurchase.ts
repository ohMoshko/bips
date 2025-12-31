/**
 * useBipsPurchase - Hook for making x402 purchases with Dynamic wallet
 *
 * This hook integrates x402 payments with the Dynamic SDK wallet.
 * It wraps fetch to automatically handle 402 responses by signing
 * payment authorizations with the connected wallet.
 */

import { useState, useCallback, useRef } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useBipsContext } from '../provider/BipsContext';
import { wrapFetchWithPayment, x402Client } from '@x402/fetch';
import { ExactEvmScheme, type ClientEvmSigner } from '@x402/evm';
import { ExactEvmSchemeV1 } from '@x402/evm/v1';
import type { BipsPurchaseResult } from '@bips/core';

export interface UseBipsPurchaseOptions {
  /** Base URL for the purchase API (defaults to current origin) */
  baseUrl?: string;
  /** Custom fetch function (for testing) */
  fetch?: typeof globalThis.fetch;
}

export interface UseBipsPurchaseResult {
  /** Execute a purchase for the given item */
  purchase: (itemId: string) => Promise<BipsPurchaseResult>;
  /** Whether a purchase is in progress */
  isLoading: boolean;
  /** Last error message, if any */
  error: string | null;
}

/**
 * Hook for making purchases with x402 payment integration.
 *
 * Uses the Dynamic SDK wallet to sign EIP-712 payment authorizations,
 * and automatically handles 402 responses by retrying with payment headers.
 *
 * @example
 * const { purchase, isLoading, error } = useBipsPurchase();
 *
 * const handleBuyHint = async () => {
 *   const result = await purchase('hint');
 *   if (result.success) {
 *     console.log('Hint:', result.data);
 *   }
 * };
 */
export function useBipsPurchase(
  options: UseBipsPurchaseOptions = {}
): UseBipsPurchaseResult {
  const { baseUrl = '', fetch: customFetch } = options;
  const { getItem, config } = useBipsContext();
  const { primaryWallet } = useDynamicContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track if component is mounted
  const mountedRef = useRef(true);

  const purchase = useCallback(
    async (itemId: string): Promise<BipsPurchaseResult> => {
      // Validate item exists
      const item = getItem(itemId);
      if (!item) {
        return {
          success: false,
          error: `Item "${itemId}" not found`,
          code: 'ITEM_NOT_FOUND',
        };
      }

      setIsLoading(true);
      setError(null);

      try {
        // Ensure wallet is connected
        if (!primaryWallet) {
          setError('Wallet not connected');
          setIsLoading(false);
          return {
            success: false,
            error: 'Wallet not connected',
            code: 'WALLET_NOT_CONNECTED',
          };
        }

        // Ensure wallet is on the correct chain
        const requiredChainId = getChainId(config.network);
        const currentChainId = await primaryWallet.getNetwork();

        if (currentChainId !== requiredChainId) {
          try {
            await primaryWallet.switchNetwork(requiredChainId);
          } catch {
            setError(`Please switch to ${config.network} network`);
            setIsLoading(false);
            return {
              success: false,
              error: `Please switch to ${config.network} network`,
              code: 'NETWORK_ERROR',
            };
          }
        }

        // Create x402 client with Dynamic wallet signer
        const signer = await createDynamicSigner(primaryWallet);
        const client = new x402Client();

        // Register EVM schemes for both v1 and v2 protocols
        const networkId = getNetworkId(config.network);
        const v1NetworkName = config.network; // v1 uses simple names like 'base-sepolia'
        client.register(networkId, new ExactEvmScheme(signer)); // v2
        client.registerV1(v1NetworkName, new ExactEvmSchemeV1(signer)); // v1

        // Use injected fetch or global fetch
        const fetchFn = customFetch || globalThis.fetch;

        // Wrap fetch with x402 payment handling
        const fetchWithPayment = wrapFetchWithPayment(fetchFn, client);

        // Make the purchase request
        const url = `${baseUrl}/api/bips/purchase/${itemId}`;
        const response = await fetchWithPayment(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || 'Purchase failed';
          if (mountedRef.current) {
            setError(errorMessage);
            setIsLoading(false);
          }
          return {
            success: false,
            error: errorMessage,
            code: 'PAYMENT_FAILED',
          };
        }

        const data = await response.json();
        if (mountedRef.current) {
          setIsLoading(false);
        }
        // Return successful result with purchase record
        // The server returns the purchase data which we wrap as a BipsPurchase
        return {
          success: true,
          purchase: {
            id: crypto.randomUUID(),
            itemId,
            price: item.price,
            currency: item.currency,
            timestamp: Date.now(),
            status: 'completed' as const,
            ...data.data,
          },
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        if (mountedRef.current) {
          setError(message);
          setIsLoading(false);
        }
        return {
          success: false,
          error: message,
          code: 'PAYMENT_FAILED',
        };
      }
    },
    [getItem, config.network, primaryWallet, baseUrl, customFetch]
  );

  return { purchase, isLoading, error };
}

/**
 * Create a ClientEvmSigner from a Dynamic wallet.
 *
 * The ClientEvmSigner interface requires:
 * - address: The wallet address
 * - signTypedData: Function to sign EIP-712 typed data
 *
 * Dynamic SDK provides getWalletClient() which returns a viem-compatible client.
 */
async function createDynamicSigner(primaryWallet: any): Promise<ClientEvmSigner> {
  if (!primaryWallet) {
    throw new Error('Wallet not connected');
  }

  // Get the viem wallet client from Dynamic
  const walletClient = await primaryWallet.getWalletClient();

  return {
    address: primaryWallet.address as `0x${string}`,
    signTypedData: async (message) => {
      // Use viem's signTypedData via Dynamic's wallet client
      const signature = await walletClient.signTypedData({
        account: primaryWallet.address as `0x${string}`,
        domain: message.domain as any,
        types: message.types as any,
        primaryType: message.primaryType,
        message: message.message as any,
      });
      return signature as `0x${string}`;
    },
  };
}

/**
 * Convert Bips network name to x402 network ID.
 *
 * x402 uses CAIP-2 chain IDs like "eip155:84532" for Base Sepolia.
 */
function getNetworkId(network: string): `${string}:${string}` {
  const networkMap: Record<string, `${string}:${string}`> = {
    'base-sepolia': 'eip155:84532',
    base: 'eip155:8453',
    'ethereum-sepolia': 'eip155:11155111',
    ethereum: 'eip155:1',
  };

  const id = networkMap[network];
  if (!id) {
    throw new Error(`Unknown network: ${network}`);
  }

  return id;
}

/**
 * Convert Bips network name to chain ID number.
 */
function getChainId(network: string): number {
  const chainIdMap: Record<string, number> = {
    'base-sepolia': 84532,
    base: 8453,
    'ethereum-sepolia': 11155111,
    ethereum: 1,
  };

  const chainId = chainIdMap[network];
  if (!chainId) {
    throw new Error(`Unknown network: ${network}`);
  }

  return chainId;
}
