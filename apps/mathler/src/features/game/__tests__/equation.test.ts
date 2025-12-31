import { describe, test, expect } from 'vitest';
import {
  evaluateExpression,
  isValidExpression,
  normalizeExpression,
} from '../lib/equation';

describe('evaluateExpression', () => {
  test('evaluates simple addition', () => {
    expect(evaluateExpression('1+2')).toBe(3);
  });

  test('evaluates simple subtraction', () => {
    expect(evaluateExpression('5-3')).toBe(2);
  });

  test('evaluates simple multiplication', () => {
    expect(evaluateExpression('4*3')).toBe(12);
  });

  test('evaluates simple division', () => {
    expect(evaluateExpression('8/2')).toBe(4);
  });

  test('respects operator precedence (PEMDAS)', () => {
    // 2 + 3 * 4 = 2 + 12 = 14, not (2+3)*4 = 20
    expect(evaluateExpression('2+3*4')).toBe(14);
  });

  test('handles complex expressions', () => {
    expect(evaluateExpression('50-8*1')).toBe(42);
    expect(evaluateExpression('10+5*2')).toBe(20);
    expect(evaluateExpression('9*5-3')).toBe(42);
  });

  test('handles leading zeros', () => {
    expect(evaluateExpression('01+02')).toBe(3);
  });

  test('returns null for invalid expressions', () => {
    expect(evaluateExpression('1++2')).toBeNull();
    expect(evaluateExpression('abc')).toBeNull();
    expect(evaluateExpression('')).toBeNull();
  });

  test('returns null for division by zero', () => {
    expect(evaluateExpression('5/0')).toBeNull();
  });
});

describe('isValidExpression', () => {
  test('accepts valid expressions', () => {
    expect(isValidExpression('1+2+3')).toBe(true);
    expect(isValidExpression('50-8*1')).toBe(true);
    expect(isValidExpression('10/2*5')).toBe(true);
  });

  test('rejects expressions starting with operator', () => {
    expect(isValidExpression('+1+2')).toBe(false);
    expect(isValidExpression('*1+2')).toBe(false);
  });

  test('rejects expressions ending with operator', () => {
    expect(isValidExpression('1+2+')).toBe(false);
    expect(isValidExpression('1+2*')).toBe(false);
  });

  test('rejects consecutive operators', () => {
    expect(isValidExpression('1++2')).toBe(false);
    expect(isValidExpression('1*+2')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(isValidExpression('')).toBe(false);
  });

  test('rejects invalid characters', () => {
    expect(isValidExpression('1+a')).toBe(false);
    expect(isValidExpression('1.5+2')).toBe(false);
  });

  test('rejects division by zero', () => {
    expect(isValidExpression('5/0')).toBe(false);
  });
});

describe('normalizeExpression', () => {
  test('removes leading zeros from numbers', () => {
    expect(normalizeExpression('01+02')).toBe('1+2');
    expect(normalizeExpression('007+3')).toBe('7+3');
  });

  test('preserves single zero', () => {
    expect(normalizeExpression('0+5')).toBe('0+5');
  });

  test('handles complex expressions', () => {
    expect(normalizeExpression('01+02*03')).toBe('1+2*3');
  });
});
