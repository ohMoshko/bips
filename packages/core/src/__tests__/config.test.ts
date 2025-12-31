import { describe, test, expect } from 'vitest';
import {
  validateConfig,
  validateItem,
  findItem,
  getChainId,
  getEip155,
} from '../config';
import type { BipsConfig, BipsItem } from '../types';

const validItem: BipsItem = {
  id: 'hint',
  name: 'Hint',
  description: 'Get a hint',
  price: '0.05',
  currency: 'USDC',
};

const validConfig: BipsConfig = {
  appId: 'test-app',
  appName: 'Test App',
  receiverAddress: '0x1234567890123456789012345678901234567890',
  network: 'base-sepolia',
  items: [validItem],
};

describe('validateItem', () => {
  test('returns empty array for valid item', () => {
    expect(validateItem(validItem)).toEqual([]);
  });

  test('requires id', () => {
    const item = { ...validItem, id: '' };
    const errors = validateItem(item);
    expect(errors).toContain('id is required');
  });

  test('requires name', () => {
    const item = { ...validItem, name: '' };
    const errors = validateItem(item);
    expect(errors).toContain('name is required');
  });

  test('validates price format - rejects invalid', () => {
    const item = { ...validItem, price: 'free' };
    const errors = validateItem(item);
    expect(errors.some((e) => e.includes('price'))).toBe(true);
  });

  test('validates price format - accepts "0.05"', () => {
    const item = { ...validItem, price: '0.05' };
    expect(validateItem(item)).toEqual([]);
  });

  test('validates price format - accepts "1.00"', () => {
    const item = { ...validItem, price: '1.00' };
    expect(validateItem(item)).toEqual([]);
  });

  test('validates price format - accepts whole numbers', () => {
    const item = { ...validItem, price: '5' };
    expect(validateItem(item)).toEqual([]);
  });

  test('requires USDC currency', () => {
    const item = { ...validItem, currency: 'ETH' as 'USDC' };
    const errors = validateItem(item);
    expect(errors).toContain('currency must be "USDC"');
  });
});

describe('validateConfig', () => {
  test('returns empty array for valid config', () => {
    expect(validateConfig(validConfig)).toEqual([]);
  });

  test('requires appId', () => {
    const config = { ...validConfig, appId: '' };
    const errors = validateConfig(config);
    expect(errors).toContain('appId is required');
  });

  test('requires appName', () => {
    const config = { ...validConfig, appName: '' };
    const errors = validateConfig(config);
    expect(errors).toContain('appName is required');
  });

  test('requires valid receiver address', () => {
    const config = { ...validConfig, receiverAddress: 'not-an-address' };
    const errors = validateConfig(config);
    expect(errors.some((e) => e.includes('receiverAddress'))).toBe(true);
  });

  test('requires at least one item', () => {
    const config = { ...validConfig, items: [] };
    const errors = validateConfig(config);
    expect(errors).toContain('At least one item is required');
  });

  test('validates nested items', () => {
    const config = {
      ...validConfig,
      items: [{ ...validItem, id: '' }],
    };
    const errors = validateConfig(config);
    expect(errors.some((e) => e.includes('items[0]'))).toBe(true);
  });
});

describe('findItem', () => {
  test('finds item by id', () => {
    const item = findItem(validConfig, 'hint');
    expect(item).toEqual(validItem);
  });

  test('returns undefined for non-existent item', () => {
    const item = findItem(validConfig, 'does-not-exist');
    expect(item).toBeUndefined();
  });

  test('finds correct item among multiple', () => {
    const extraLife: BipsItem = {
      id: 'extra-life',
      name: 'Extra Life',
      description: 'Get an extra life',
      price: '0.10',
      currency: 'USDC',
    };
    const config = { ...validConfig, items: [validItem, extraLife] };

    expect(findItem(config, 'hint')).toEqual(validItem);
    expect(findItem(config, 'extra-life')).toEqual(extraLife);
  });
});

describe('getChainId', () => {
  test('returns correct chain ID for base-sepolia', () => {
    expect(getChainId('base-sepolia')).toBe(84532);
  });

  test('returns correct chain ID for base', () => {
    expect(getChainId('base')).toBe(8453);
  });
});

describe('getEip155', () => {
  test('returns correct EIP-155 for base-sepolia', () => {
    expect(getEip155('base-sepolia')).toBe('eip155:84532');
  });

  test('returns correct EIP-155 for base', () => {
    expect(getEip155('base')).toBe('eip155:8453');
  });
});
