import { describe, test, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { bipsMiddleware } from '../middleware/bipsMiddleware';
import type { BipsConfig } from '@bips/core';

const testConfig: BipsConfig = {
  appId: 'test-app',
  appName: 'Test App',
  receiverAddress: '0x1234567890123456789012345678901234567890',
  network: 'base-sepolia',
  items: [
    {
      id: 'hint',
      name: 'Hint',
      description: 'Get a hint',
      price: '0.05',
      currency: 'USDC',
    },
    {
      id: 'extra-life',
      name: 'Extra Life',
      description: 'Get an extra life',
      price: '0.10',
      currency: 'USDC',
    },
  ],
};

function createTestApp() {
  const app = express();
  app.use(express.json());

  // Apply middleware to purchase route
  app.post(
    '/api/purchase/:itemId',
    bipsMiddleware({ config: testConfig }),
    (req, res) => {
      // This handler only runs if payment is verified
      res.json({
        success: true,
        itemId: req.params['itemId'],
        purchase: (req as any).bipsPurchase,
      });
    }
  );

  return app;
}

describe('bipsMiddleware', () => {
  describe('when no payment header is provided', () => {
    test('returns 402 Payment Required', async () => {
      const app = createTestApp();

      const response = await request(app).post('/api/purchase/hint');

      expect(response.status).toBe(402);
      expect(response.body.error).toBe('Payment required');
    });

    test('includes item details in 402 response', async () => {
      const app = createTestApp();

      const response = await request(app).post('/api/purchase/hint');

      expect(response.body.item).toEqual({
        id: 'hint',
        name: 'Hint',
        price: '0.05',
        currency: 'USDC',
      });
    });

    test('includes payment requirements in 402 response', async () => {
      const app = createTestApp();

      const response = await request(app).post('/api/purchase/hint');

      expect(response.body.paymentRequirements).toMatchObject({
        scheme: 'exact',
        network: 'eip155:84532', // Base Sepolia
        maxAmountRequired: '0.05',
        payTo: testConfig.receiverAddress,
        currency: 'USDC',
      });
    });
  });

  describe('when item does not exist', () => {
    test('returns 404 Not Found', async () => {
      const app = createTestApp();

      const response = await request(app).post('/api/purchase/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Item "non-existent" not found');
    });
  });

  describe('when payment header is provided', () => {
    test('returns 402 for invalid payment (placeholder behavior)', async () => {
      const app = createTestApp();

      // Currently verifyPayment always returns false (placeholder)
      const response = await request(app)
        .post('/api/purchase/hint')
        .set('X-Payment', 'some-payment-token');

      // Until we implement real verification, this returns 402
      expect(response.status).toBe(402);
      expect(response.body.error).toBe('Invalid payment');
    });
  });

  describe('price variations', () => {
    test('returns correct price for different items', async () => {
      const app = createTestApp();

      const hintResponse = await request(app).post('/api/purchase/hint');
      expect(hintResponse.body.item.price).toBe('0.05');

      const lifeResponse = await request(app).post('/api/purchase/extra-life');
      expect(lifeResponse.body.item.price).toBe('0.10');
    });
  });
});

describe('createPaymentRequirements', () => {
  test('uses correct network for base mainnet', async () => {
    const mainnetConfig: BipsConfig = {
      ...testConfig,
      network: 'base',
    };

    const app = express();
    app.post(
      '/api/purchase/:itemId',
      bipsMiddleware({ config: mainnetConfig }),
      (req, res) => res.json({ success: true })
    );

    const response = await request(app).post('/api/purchase/hint');

    expect(response.body.paymentRequirements.network).toBe('eip155:8453');
  });
});
