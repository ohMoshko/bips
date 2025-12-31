import type { Request, Response, NextFunction } from 'express';
import type { BipsConfig, BipsItem } from '@bips/core';
import { findItem } from '@bips/core';
import { createPaymentRequirements } from './paymentRequirements';

export interface BipsMiddlewareOptions {
  config: BipsConfig;
  facilitatorUrl?: string;
}

export interface BipsRequest extends Request {
  bipsPurchase?: {
    itemId: string;
    price: string;
    currency: 'USDC';
    timestamp: number;
    txHash?: string;
  };
}

const DEFAULT_FACILITATOR_URL = 'https://x402.org/facilitator';

export function bipsMiddleware(options: BipsMiddlewareOptions) {
  const { config, facilitatorUrl = DEFAULT_FACILITATOR_URL } = options;

  return async (
    req: BipsRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const itemId = req.params['itemId'];

    if (!itemId) {
      res.status(400).json({ error: 'Missing itemId parameter' });
      return;
    }

    const item = findItem(config, itemId);

    if (!item) {
      res.status(404).json({ error: `Item "${itemId}" not found` });
      return;
    }

    const paymentHeader = req.headers['x-payment'];

    if (!paymentHeader) {
      res.status(402).json({
        error: 'Payment required',
        item: {
          id: item.id,
          name: item.name,
          price: item.price,
          currency: item.currency,
        },
        paymentRequirements: createPaymentRequirements(item, config, req),
      });
      return;
    }

    // TODO: Verify payment with x402 facilitator
    // For now, we'll implement a placeholder
    try {
      const isValid = await verifyPayment(
        paymentHeader as string,
        item,
        config,
        facilitatorUrl
      );

      if (!isValid) {
        res.status(402).json({ error: 'Invalid payment' });
        return;
      }

      req.bipsPurchase = {
        itemId: item.id,
        price: item.price,
        currency: item.currency,
        timestamp: Date.now(),
      };

      next();
    } catch (error) {
      console.error('Payment verification failed:', error);
      res.status(500).json({ error: 'Payment verification failed' });
    }
  };
}

async function verifyPayment(
  _paymentHeader: string,
  _item: BipsItem,
  _config: BipsConfig,
  _facilitatorUrl: string
): Promise<boolean> {
  // TODO: Implement actual x402 verification
  // This will call the facilitator to verify the payment
  return false;
}
