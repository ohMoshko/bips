import { describe, test, expect, vi, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createBipsServer } from '../x402/createBipsServer';
import type { BipsConfig } from '@bips/core';

/**
 * x402 Integration Tests
 *
 * These tests verify that our Bips server correctly integrates with x402.
 * The x402 middleware automatically:
 * 1. Returns 402 with payment requirements when no payment header
 * 2. Verifies payments via the facilitator
 * 3. Calls our handler when payment is valid
 *
 * For testing, we mock the facilitator to avoid real network calls.
 */

const testConfig: BipsConfig = {
  appId: 'test-app',
  appName: 'Test App',
  receiverAddress: '0x5aE2Ea70209Fad3Ac413363cdcC21D5DeBc7085A',
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

describe('createBipsServer', () => {
  test('creates an express app with x402 middleware', () => {
    const app = createBipsServer({
      config: testConfig,
      onPurchase: async () => ({ success: true, data: { hintPosition: 0 } }),
    });

    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });
});

describe('Bips x402 payment flow', () => {
  const purchaseHandler = vi.fn().mockResolvedValue({
    success: true,
    data: { hintPosition: 0, hintChar: '5' },
  });

  function createTestApp() {
    return createBipsServer({
      config: testConfig,
      onPurchase: purchaseHandler,
      // Use test facilitator that doesn't make real network calls
      facilitatorUrl: 'http://localhost:9999/facilitator',
    });
  }

  test('returns 402 with payment requirements when no payment header', async () => {
    const app = createTestApp();

    const response = await request(app).post('/api/bips/purchase/hint');

    // x402 returns 402 with payment requirements in body
    expect(response.status).toBe(402);
    expect(response.body.x402Version).toBe(1);
    expect(response.body.error).toContain('X-PAYMENT');
    expect(response.body.accepts).toBeDefined();
    expect(Array.isArray(response.body.accepts)).toBe(true);
  });

  test('returns 404 for non-existent item', async () => {
    const app = createTestApp();

    const response = await request(app).post('/api/bips/purchase/unknown-item');

    expect(response.status).toBe(404);
    expect(response.body.error).toContain('not found');
  });

  test('includes correct price in payment requirements', async () => {
    const app = createTestApp();

    // Test hint ($0.05)
    const hintResponse = await request(app).post('/api/bips/purchase/hint');
    expect(hintResponse.status).toBe(402);

    // Price is in smallest units (USDC has 6 decimals: $0.05 = 50000)
    const accepts = hintResponse.body.accepts;
    expect(accepts.some((a: any) => a.maxAmountRequired === '50000')).toBe(true);
  });

  test('uses correct receiver address', async () => {
    const app = createTestApp();

    const response = await request(app).post('/api/bips/purchase/hint');
    expect(response.status).toBe(402);

    const accepts = response.body.accepts;
    expect(
      accepts.some(
        (a: any) => a.payTo?.toLowerCase() === testConfig.receiverAddress.toLowerCase()
      )
    ).toBe(true);
  });
});

describe('Bips purchase handler', () => {
  test('onPurchase receives correct itemId and config', async () => {
    const purchaseHandler = vi.fn().mockResolvedValue({
      success: true,
      data: { revealed: true },
    });

    const app = createBipsServer({
      config: testConfig,
      onPurchase: purchaseHandler,
      // Skip payment verification for this test
      skipPaymentVerification: true,
    });

    const response = await request(app).post('/api/bips/purchase/hint');

    expect(response.status).toBe(200);
    expect(purchaseHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: 'hint',
        item: expect.objectContaining({
          id: 'hint',
          price: '0.05',
        }),
      })
    );
  });

  test('returns purchase handler response as JSON', async () => {
    const responseData = { hintPosition: 3, hintChar: '*' };

    const app = createBipsServer({
      config: testConfig,
      onPurchase: async () => ({ success: true, data: responseData }),
      skipPaymentVerification: true,
    });

    const response = await request(app).post('/api/bips/purchase/hint');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(responseData);
  });
});
