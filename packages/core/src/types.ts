/**
 * Core types for Bips Protocol
 *
 * These types are the foundation of the entire SDK.
 * Think of them like Elixir structs with @type definitions.
 */

/**
 * A purchasable item in the Bips ecosystem.
 * Like a product SKU in e-commerce.
 *
 * @example
 * const hint: BipsItem = {
 *   id: 'hint',
 *   name: 'Hint',
 *   description: 'Reveal one correct character',
 *   price: '0.05',
 *   currency: 'USDC',
 * };
 */
export interface BipsItem {
  /** Unique identifier (e.g., "hint", "extra-life") */
  id: string;
  /** Display name shown to users */
  name: string;
  /** What the user gets for their money */
  description: string;
  /** Price in USD as a string (e.g., "0.05") - strings avoid floating point issues */
  price: string;
  /** Currency - currently only USDC supported */
  currency: 'USDC';
  /** Optional grouping (e.g., "gameplay", "cosmetic") */
  category?: string;
  /** App-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for a Bips-enabled app.
 * Passed to BipsProvider on the frontend or bipsMiddleware on the backend.
 */
export interface BipsConfig {
  /** Your app's unique identifier */
  appId: string;
  /** Display name for your app */
  appName: string;
  /** Available purchasable items */
  items: BipsItem[];
  /** Wallet address to receive payments */
  receiverAddress: string;
  /** Blockchain network */
  network: 'base-sepolia' | 'base';
  /** Optional UI customization */
  theme?: BipsTheme;
}

/**
 * UI theme customization
 */
export interface BipsTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
}

/**
 * A completed purchase record.
 * Stored in user metadata via Dynamic SDK.
 */
export interface BipsPurchase {
  /** Unique purchase ID (UUID) */
  id: string;
  /** What was purchased (BipsItem.id) */
  itemId: string;
  /** Amount paid */
  price: string;
  /** Currency used */
  currency: 'USDC';
  /** Unix timestamp (milliseconds) */
  timestamp: number;
  /** Blockchain transaction hash (if available) */
  txHash?: string;
  /** Purchase status */
  status: 'pending' | 'completed' | 'failed';
}

/**
 * User's Bips state within an app.
 * Stored in Dynamic user metadata.
 */
export interface BipsUserState {
  /** Purchase history */
  purchases: BipsPurchase[];
  /** Lifetime spend in this app (as string to avoid float issues) */
  totalSpent: string;
  /** Timestamp of last purchase */
  lastPurchase?: number;
}

/**
 * Result of a purchase attempt.
 *
 * This is a discriminated union - TypeScript's version of Elixir's tagged tuples.
 * Instead of {:ok, result} | {:error, reason}, we use { success: true, ... } | { success: false, ... }
 *
 * @example
 * const result = await purchase('hint');
 * if (result.success) {
 *   // TypeScript knows result.purchase exists here
 *   console.log(result.purchase.txHash);
 * } else {
 *   // TypeScript knows result.error exists here
 *   console.error(result.error);
 * }
 */
export type BipsPurchaseResult =
  | { success: true; purchase: BipsPurchase }
  | { success: false; error: string; code: BipsErrorCode };

/**
 * Error codes for failed purchases.
 * Like Elixir atom error reasons.
 */
export type BipsErrorCode =
  | 'WALLET_NOT_CONNECTED'
  | 'INSUFFICIENT_BALANCE'
  | 'PAYMENT_REJECTED'
  | 'PAYMENT_FAILED'
  | 'ITEM_NOT_FOUND'
  | 'NETWORK_ERROR';
