import { describe, test, expect } from 'vitest';
import {
  formatPrice,
  formatPriceWithCurrency,
  addPrices,
  comparePrices,
  hasSufficientBalance,
  toSmallestUnit,
  fromSmallestUnit,
} from '../pricing';

describe('formatPrice', () => {
  test('formats price with $ prefix', () => {
    expect(formatPrice('0.05')).toBe('$0.05');
  });

  test('formats whole numbers with two decimals', () => {
    expect(formatPrice('1')).toBe('$1.00');
  });

  test('formats prices with one decimal', () => {
    expect(formatPrice('10.5')).toBe('$10.50');
  });

  test('handles zero', () => {
    expect(formatPrice('0')).toBe('$0.00');
  });

  test('returns $0.00 for invalid input', () => {
    expect(formatPrice('invalid')).toBe('$0.00');
  });
});

describe('formatPriceWithCurrency', () => {
  test('appends currency symbol', () => {
    expect(formatPriceWithCurrency('0.05', 'USDC')).toBe('$0.05 USDC');
  });
});

describe('addPrices', () => {
  test('adds two prices correctly', () => {
    expect(addPrices('0.05', '0.10')).toBe('0.15');
  });

  test('handles floating point precision', () => {
    // Classic JS gotcha: 0.1 + 0.2 = 0.30000000000000004
    expect(addPrices('0.10', '0.20')).toBe('0.30');
  });

  test('adds larger numbers', () => {
    expect(addPrices('99.99', '0.01')).toBe('100.00');
  });
});

describe('comparePrices', () => {
  test('returns -1 when a < b', () => {
    expect(comparePrices('0.05', '0.10')).toBe(-1);
  });

  test('returns 0 when equal', () => {
    expect(comparePrices('0.05', '0.05')).toBe(0);
  });

  test('returns 1 when a > b', () => {
    expect(comparePrices('0.10', '0.05')).toBe(1);
  });
});

describe('hasSufficientBalance', () => {
  test('returns true when balance equals price', () => {
    expect(hasSufficientBalance('0.05', '0.05')).toBe(true);
  });

  test('returns true when balance exceeds price', () => {
    expect(hasSufficientBalance('1.00', '0.05')).toBe(true);
  });

  test('returns false when balance is insufficient', () => {
    expect(hasSufficientBalance('0.01', '0.05')).toBe(false);
  });
});

describe('toSmallestUnit', () => {
  test('converts $0.05 to 50000 (USDC has 6 decimals)', () => {
    expect(toSmallestUnit('0.05')).toBe('50000');
  });

  test('converts $1.00 to 1000000', () => {
    expect(toSmallestUnit('1.00')).toBe('1000000');
  });

  test('handles custom decimals', () => {
    // ETH has 18 decimals
    expect(toSmallestUnit('1.00', 18)).toBe('1000000000000000000');
  });
});

describe('fromSmallestUnit', () => {
  test('converts 50000 back to $0.05', () => {
    expect(fromSmallestUnit('50000')).toBe('0.05');
  });

  test('converts 1000000 back to $1.00', () => {
    expect(fromSmallestUnit('1000000')).toBe('1.00');
  });
});
