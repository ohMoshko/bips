/**
 * Configuration utilities for Bips Protocol
 */

import type { BipsConfig, BipsItem } from './types';

/**
 * Network configuration mapping.
 * Maps our friendly network names to chain IDs used by x402.
 */
export const NETWORK_CONFIG = {
  'base-sepolia': {
    chainId: 84532,
    name: 'Base Sepolia',
    // EIP-3770 format used by x402
    eip155: 'eip155:84532',
    isTestnet: true,
  },
  base: {
    chainId: 8453,
    name: 'Base',
    eip155: 'eip155:8453',
    isTestnet: false,
  },
} as const;

export type NetworkName = keyof typeof NETWORK_CONFIG;

/**
 * Get the chain ID for a network name.
 * Like a simple lookup function in Elixir.
 */
export function getChainId(network: NetworkName): number {
  return NETWORK_CONFIG[network].chainId;
}

/**
 * Get the EIP-155 identifier for x402 protocol.
 */
export function getEip155(network: NetworkName): string {
  return NETWORK_CONFIG[network].eip155;
}

/**
 * Validate a BipsConfig object.
 * Returns array of error messages (empty if valid).
 *
 * In Elixir, you'd use Ecto.Changeset for this.
 * We'll add Zod validation later for runtime safety.
 */
export function validateConfig(config: BipsConfig): string[] {
  const errors: string[] = [];

  if (!config.appId || config.appId.trim() === '') {
    errors.push('appId is required');
  }

  if (!config.appName || config.appName.trim() === '') {
    errors.push('appName is required');
  }

  if (!config.receiverAddress || !config.receiverAddress.startsWith('0x')) {
    errors.push('receiverAddress must be a valid Ethereum address');
  }

  if (!config.items || config.items.length === 0) {
    errors.push('At least one item is required');
  }

  config.items.forEach((item, index) => {
    const itemErrors = validateItem(item);
    itemErrors.forEach((err) => {
      errors.push(`items[${index}]: ${err}`);
    });
  });

  return errors;
}

/**
 * Validate a single BipsItem.
 */
export function validateItem(item: BipsItem): string[] {
  const errors: string[] = [];

  if (!item.id || item.id.trim() === '') {
    errors.push('id is required');
  }

  if (!item.name || item.name.trim() === '') {
    errors.push('name is required');
  }

  if (!item.price || !/^\d+(\.\d{1,2})?$/.test(item.price)) {
    errors.push('price must be a valid USD amount (e.g., "0.05" or "1.00")');
  }

  if (item.currency !== 'USDC') {
    errors.push('currency must be "USDC"');
  }

  return errors;
}

/**
 * Find an item by ID in a config.
 * Returns undefined if not found (like Enum.find/2).
 */
export function findItem(
  config: BipsConfig,
  itemId: string
): BipsItem | undefined {
  return config.items.find((item) => item.id === itemId);
}
