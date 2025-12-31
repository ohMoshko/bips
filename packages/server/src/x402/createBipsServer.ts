/**
 * Creates an Express server with Bips x402 payment integration
 *
 * This wraps the x402-express middleware to provide a Bips-specific API.
 * The resulting server handles:
 * 1. 402 responses with payment requirements
 * 2. Payment verification via x402 facilitator
 * 3. Calling your purchase handler when payment is valid
 */

import express, { type Express, type Request, type Response } from 'express';
import { paymentMiddleware, type RoutesConfig } from 'x402-express';
import type { BipsConfig, BipsItem } from '@bips/core';
import { findItem } from '@bips/core';

export interface PurchaseContext {
  itemId: string;
  item: BipsItem;
  req: Request;
}

export interface PurchaseResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface CreateBipsServerOptions {
  /** Bips configuration with items and receiver address */
  config: BipsConfig;

  /** Handler called when a valid payment is received */
  onPurchase: (context: PurchaseContext) => Promise<PurchaseResult>;

  /** Optional custom facilitator URL (defaults to x402.org) */
  facilitatorUrl?: string;

  /** Skip payment verification (for testing only) */
  skipPaymentVerification?: boolean;
}

const DEFAULT_FACILITATOR_URL = 'https://x402.org/facilitator' as const;

/**
 * Creates an Express app configured with Bips x402 payments.
 *
 * @example
 * const app = createBipsServer({
 *   config: {
 *     appId: 'mathler',
 *     appName: 'Mathler',
 *     receiverAddress: '0x...',
 *     network: 'base-sepolia',
 *     items: [
 *       { id: 'hint', name: 'Hint', price: '0.05', currency: 'USDC' },
 *     ],
 *   },
 *   onPurchase: async ({ itemId, item }) => {
 *     // Deliver the purchased item
 *     return { success: true, data: { hintPosition: 0 } };
 *   },
 * });
 *
 * app.listen(3001);
 */
export function createBipsServer(options: CreateBipsServerOptions): Express {
  const {
    config,
    onPurchase,
    facilitatorUrl = DEFAULT_FACILITATOR_URL,
    skipPaymentVerification = false,
  } = options;

  const app = express();
  app.use(express.json());

  // Build x402 routes config from Bips items
  const x402Routes = buildRoutesConfig(config);

  // Apply x402 middleware globally - it will match based on routes config
  if (!skipPaymentVerification) {
    app.use(
      paymentMiddleware(
        config.receiverAddress as `0x${string}`,
        x402Routes,
        { url: facilitatorUrl as `${string}://${string}` }
      )
    );
  }

  // Purchase endpoint
  app.post('/api/bips/purchase/:itemId', async (req: Request, res: Response) => {
    const itemId = req.params['itemId'];

    if (!itemId) {
      res.status(400).json({ error: 'Missing itemId' });
      return;
    }

    const item = findItem(config, itemId);

    if (!item) {
      res.status(404).json({ error: `Item "${itemId}" not found` });
      return;
    }

    try {
      const result = await onPurchase({ itemId, item, req });

      if (result.success) {
        res.json({ success: true, data: result.data });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error('Purchase handler error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  return app;
}

/**
 * Build x402 routes config from Bips items.
 * Each item becomes a route like /api/bips/purchase/hint
 */
function buildRoutesConfig(config: BipsConfig): RoutesConfig {
  const routes: RoutesConfig = {};

  for (const item of config.items) {
    const routePath = `POST /api/bips/purchase/${item.id}`;

    routes[routePath] = {
      price: `$${item.price}`,
      network: config.network,
      config: {
        description: item.description || item.name,
      },
    };
  }

  return routes;
}
