// Legacy middleware (without x402)
export type { BipsMiddlewareOptions } from './middleware/bipsMiddleware';
export { bipsMiddleware } from './middleware/bipsMiddleware';
export { createPaymentRequirements } from './middleware/paymentRequirements';

// x402 integrated server
export type {
  CreateBipsServerOptions,
  PurchaseContext,
  PurchaseResult,
} from './x402/createBipsServer';
export { createBipsServer } from './x402/createBipsServer';

// Re-export core types for convenience
export type {
  BipsItem,
  BipsConfig,
  BipsPurchase,
  BipsPurchaseResult,
} from '@bips/core';
