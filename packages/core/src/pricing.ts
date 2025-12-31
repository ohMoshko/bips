/**
 * Pricing utilities for Bips Protocol
 *
 * We use strings for prices to avoid JavaScript floating-point issues.
 * In Elixir, you might use Decimal. In JS, we use string manipulation
 * or libraries like decimal.js for precision.
 */

/**
 * Format a price string for display.
 * "0.05" -> "$0.05"
 * "1" -> "$1.00"
 *
 * @example
 * formatPrice("0.05") // "$0.05"
 * formatPrice("1")    // "$1.00"
 * formatPrice("10.5") // "$10.50"
 */
export function formatPrice(price: string): string {
  // Parse to ensure valid number, then format
  const num = parseFloat(price);

  if (isNaN(num)) {
    return '$0.00';
  }

  // Format with exactly 2 decimal places
  return `$${num.toFixed(2)}`;
}

/**
 * Format price with currency symbol.
 * For now, always USDC, but extensible for future currencies.
 */
export function formatPriceWithCurrency(
  price: string,
  currency: 'USDC'
): string {
  return `${formatPrice(price)} ${currency}`;
}

/**
 * Add two price strings together.
 * Handles the floating-point precision issue by working in cents.
 *
 * @example
 * addPrices("0.05", "0.10") // "0.15"
 */
export function addPrices(a: string, b: string): string {
  // Convert to cents (integers) to avoid floating point issues
  const centsA = Math.round(parseFloat(a) * 100);
  const centsB = Math.round(parseFloat(b) * 100);
  const totalCents = centsA + centsB;

  return (totalCents / 100).toFixed(2);
}

/**
 * Compare two prices.
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 *
 * Like Elixir's compare/2 function.
 */
export function comparePrices(a: string, b: string): -1 | 0 | 1 {
  const numA = parseFloat(a);
  const numB = parseFloat(b);

  if (numA < numB) return -1;
  if (numA > numB) return 1;
  return 0;
}

/**
 * Check if user has sufficient balance for a purchase.
 */
export function hasSufficientBalance(balance: string, price: string): boolean {
  return comparePrices(balance, price) >= 0;
}

/**
 * Convert USD price to the smallest unit (for blockchain transactions).
 * USDC has 6 decimals, so $0.05 = 50000 units.
 *
 * @example
 * toSmallestUnit("0.05") // "50000"
 * toSmallestUnit("1.00") // "1000000"
 */
export function toSmallestUnit(price: string, decimals: number = 6): string {
  const num = parseFloat(price);
  const multiplier = Math.pow(10, decimals);
  return Math.round(num * multiplier).toString();
}

/**
 * Convert from smallest unit back to USD string.
 *
 * @example
 * fromSmallestUnit("50000")   // "0.05"
 * fromSmallestUnit("1000000") // "1.00"
 */
export function fromSmallestUnit(
  amount: string,
  decimals: number = 6
): string {
  const num = parseInt(amount, 10);
  const divisor = Math.pow(10, decimals);
  return (num / divisor).toFixed(2);
}
