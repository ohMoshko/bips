/**
 * Equation parsing and evaluation
 *
 * We could use eval(), but that's a security risk and doesn't give us
 * validation control. Instead, we parse and evaluate manually.
 */

import { VALID_CHARS } from '../types';

const OPERATORS = ['+', '-', '*', '/'] as const;
type Operator = (typeof OPERATORS)[number];

function isOperator(char: string): char is Operator {
  return OPERATORS.includes(char as Operator);
}

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

/**
 * Check if an expression is valid (only valid chars, proper structure)
 */
export function isValidExpression(expr: string): boolean {
  if (!expr || expr.length === 0) return false;

  // Check all characters are valid
  for (const char of expr) {
    if (!VALID_CHARS.includes(char as (typeof VALID_CHARS)[number])) {
      return false;
    }
  }

  // Can't start or end with operator
  if (isOperator(expr[0]!)) return false;
  if (isOperator(expr[expr.length - 1]!)) return false;

  // Can't have consecutive operators
  for (let i = 0; i < expr.length - 1; i++) {
    if (isOperator(expr[i]!) && isOperator(expr[i + 1]!)) {
      return false;
    }
  }

  // Try to evaluate - if it fails or divides by zero, it's invalid
  const result = evaluateExpression(expr);
  return result !== null;
}

/**
 * Evaluate a math expression string.
 * Returns null if invalid or division by zero.
 *
 * Uses a simple two-pass approach:
 * 1. Parse into tokens (numbers and operators)
 * 2. Evaluate respecting precedence (* / before + -)
 */
export function evaluateExpression(expr: string): number | null {
  try {
    const tokens = tokenize(expr);
    if (!tokens) return null;

    return evaluate(tokens);
  } catch {
    return null;
  }
}

interface Token {
  type: 'number' | 'operator';
  value: number | Operator;
}

function tokenize(expr: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const char = expr[i]!;

    if (isDigit(char)) {
      // Parse full number
      let numStr = '';
      while (i < expr.length && isDigit(expr[i]!)) {
        numStr += expr[i];
        i++;
      }
      tokens.push({ type: 'number', value: parseInt(numStr, 10) });
    } else if (isOperator(char)) {
      tokens.push({ type: 'operator', value: char });
      i++;
    } else {
      // Invalid character
      return null;
    }
  }

  return tokens;
}

function evaluate(tokens: Token[]): number | null {
  if (tokens.length === 0) return null;

  // First pass: handle * and /
  const afterMultDiv: Token[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;

    if (token.type === 'operator' && (token.value === '*' || token.value === '/')) {
      const left = afterMultDiv.pop();
      const right = tokens[i + 1];

      if (!left || left.type !== 'number' || !right || right.type !== 'number') {
        return null;
      }

      let result: number;
      if (token.value === '*') {
        result = (left.value as number) * (right.value as number);
      } else {
        if (right.value === 0) return null; // Division by zero
        result = (left.value as number) / (right.value as number);
      }

      afterMultDiv.push({ type: 'number', value: result });
      i++; // Skip the right operand
    } else {
      afterMultDiv.push(token);
    }
  }

  // Second pass: handle + and -
  let result = (afterMultDiv[0] as Token | undefined)?.value as number;
  if (typeof result !== 'number') return null;

  for (let i = 1; i < afterMultDiv.length; i += 2) {
    const op = afterMultDiv[i];
    const num = afterMultDiv[i + 1];

    if (!op || op.type !== 'operator' || !num || num.type !== 'number') {
      return null;
    }

    if (op.value === '+') {
      result += num.value as number;
    } else if (op.value === '-') {
      result -= num.value as number;
    } else {
      return null; // Unexpected operator
    }
  }

  return result;
}

/**
 * Normalize an expression by removing leading zeros from numbers.
 * "01+02" → "1+2"
 */
export function normalizeExpression(expr: string): string {
  return expr.replace(/\b0+(\d)/g, '$1');
}
