// @bips/react - React SDK for Bips Protocol

// Re-export core types for convenience
export type {
  BipsItem,
  BipsConfig,
  BipsPurchase,
  BipsPurchaseResult,
  BipsUserState,
  BipsErrorCode,
  BipsTheme,
} from '@bips/core';

// Provider
export { BipsProvider } from './provider/BipsProvider';
export { useBipsContext } from './provider/BipsContext';

// Hooks
export { useBips } from './hooks/useBips';
export { useBipsPurchase } from './hooks/useBipsPurchase';
export type { UseBipsPurchaseOptions, UseBipsPurchaseResult } from './hooks/useBipsPurchase';

// Components
export { BipsButton } from './components/BipsButton';
