import { BipsButton } from '@bips/react';
import type { BipsPurchase } from '@bips/core';

interface HintData {
  position: number;
  char: string;
}

interface HintButtonProps {
  onHintPurchased: (hint: HintData) => void;
  disabled?: boolean;
}

/**
 * Game-specific wrapper around BipsButton for purchasing hints.
 *
 * This demonstrates how to integrate Bips payments into any game:
 * 1. Define your items in BipsConfig (see App.tsx)
 * 2. Create a server handler (see server/index.ts)
 * 3. Use BipsButton with onSuccess to handle the purchased item
 */
export function HintButton({ onHintPurchased, disabled }: HintButtonProps) {
  const handleSuccess = (purchase: BipsPurchase) => {
    // The server returns hint data in the purchase record
    const hint = purchase as unknown as HintData;
    if (hint.position !== undefined && hint.char) {
      onHintPurchased(hint);
    }
  };

  const handleError = (error: string) => {
    console.error('Hint purchase failed:', error);
  };

  return (
    <BipsButton
      itemId="hint"
      onSuccess={handleSuccess}
      onError={handleError}
      disabled={disabled}
      className="px-5 py-3 sm:px-4 sm:py-2 bg-yellow-500 active:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg sm:rounded text-base sm:text-sm transition-colors min-w-[160px]"
    >
      💡 Get Hint ($0.05)
    </BipsButton>
  );
}
