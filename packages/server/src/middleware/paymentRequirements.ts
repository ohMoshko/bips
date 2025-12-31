import type { Request } from 'express';
import type { BipsConfig, BipsItem } from '@bips/core';
import { getEip155 } from '@bips/core';

export interface PaymentRequirements {
  scheme: 'exact';
  network: string;
  maxAmountRequired: string;
  resource: string;
  payTo: string;
  currency: string;
}

export function createPaymentRequirements(
  item: BipsItem,
  config: BipsConfig,
  req: Request
): PaymentRequirements {
  return {
    scheme: 'exact',
    network: getEip155(config.network),
    maxAmountRequired: item.price,
    resource: req.originalUrl,
    payTo: config.receiverAddress,
    currency: 'USDC',
  };
}
