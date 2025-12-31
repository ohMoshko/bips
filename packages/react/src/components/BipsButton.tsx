/**
 * BipsButton - A pre-built button component for purchases
 *
 * This is a convenience component for the common use case of
 * "I want a button that buys something when clicked".
 *
 * Uses x402 protocol for real cryptocurrency payments.
 * Developers can either use this or build their own with useBipsPurchase().
 *
 * @example
 * <BipsButton
 *   itemId="hint"
 *   onSuccess={(purchase) => revealHint(purchase)}
 *   onError={(error) => showToast(error)}
 * >
 *   Get Hint
 * </BipsButton>
 */

import { type ReactNode } from 'react';
import { useBipsPurchase } from '../hooks/useBipsPurchase';
import { useBipsContext } from '../provider/BipsContext';
import type { BipsPurchase } from '@bips/core';
import { formatPrice } from '@bips/core';

export interface BipsButtonProps {
  /** The ID of the item to purchase */
  itemId: string;
  /** Called when purchase succeeds - receives the purchase record with any server data */
  onSuccess?: (purchase: BipsPurchase) => void;
  /** Called when purchase fails */
  onError?: (error: string) => void;
  /** Button content (defaults to "Item Name ($X.XX)") */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Disable the button */
  disabled?: boolean;
  /** Base URL for the API (defaults to current origin) */
  baseUrl?: string;
}

export function BipsButton({
  itemId,
  onSuccess,
  onError,
  children,
  className,
  disabled,
  baseUrl,
}: BipsButtonProps) {
  const { purchase, isLoading, error } = useBipsPurchase({ baseUrl });
  const { getItem } = useBipsContext();

  const item = getItem(itemId);

  if (!item) {
    console.warn(
      `BipsButton: Item "${itemId}" not found in config. ` +
        `Make sure it's defined in your BipsProvider config.`
    );
    return null;
  }

  const handleClick = async () => {
    if (isLoading || disabled) return;

    const result = await purchase(itemId);

    if (result.success) {
      onSuccess?.(result.purchase);
    } else {
      onError?.(result.error);
    }
  };

  // Default button content: "Item Name ($0.05)"
  const defaultContent = `${item.name} (${formatPrice(item.price)})`;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || disabled}
      className={className}
      type="button"
    >
      {isLoading ? 'Processing...' : (children ?? defaultContent)}
      {error && <span className="bips-error">{error}</span>}
    </button>
  );
}
