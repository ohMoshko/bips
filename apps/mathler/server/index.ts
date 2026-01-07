/**
 * Mathler Backend Server
 *
 * This server handles hint purchases using the Bips x402 payment integration.
 * It tracks which positions have been revealed to prevent duplicate hints.
 */

import { createBipsServer } from '@bips/server';
import type { BipsConfig } from '@bips/core';

// Environment variables (from .env.local, not committed to git)
const BIPS_RECEIVER_ADDRESS = process.env.BIPS_RECEIVER_ADDRESS;
const BIPS_NETWORK = (process.env.BIPS_NETWORK || 'base-sepolia') as 'base-sepolia' | 'base';

// Validate required environment variables
if (!BIPS_RECEIVER_ADDRESS) {
  throw new Error('Missing BIPS_RECEIVER_ADDRESS. Copy .env.example to .env.local and configure.');
}

// Import puzzle functions (shared with frontend)
const PUZZLES = [
  { target: 42, solution: '50-8*1' },
  { target: 20, solution: '10+5*2' },
  { target: 15, solution: '9+6*01' },
  { target: 24, solution: '8*4-08' },
  { target: 36, solution: '72/2+0' },
  { target: 100, solution: '99+1+0' },
  { target: 48, solution: '6*9-06' },
  { target: 30, solution: '5*7-05' },
  { target: 18, solution: '3*6*01' },
  { target: 27, solution: '9*3+00' },
  { target: 35, solution: '7*5+00' },
  { target: 12, solution: '2*6+00' },
  { target: 45, solution: '9*5+00' },
  { target: 28, solution: '4*7+00' },
  { target: 21, solution: '3*7+00' },
];

function getDailyPuzzle() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const index = dayOfYear % PUZZLES.length;
  return PUZZLES[index]!;
}

// Session storage for revealed hints (per wallet address per day)
// In production, use Redis or a database
const hintSessions = new Map<string, Set<number>>();

function getSessionKey(walletAddress: string): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${walletAddress}:${today}`;
}

function getRevealedPositions(walletAddress: string): Set<number> {
  const key = getSessionKey(walletAddress);
  if (!hintSessions.has(key)) {
    hintSessions.set(key, new Set());
  }
  return hintSessions.get(key)!;
}

function revealNextHint(
  walletAddress: string
): { position: number; char: string } | null {
  const puzzle = getDailyPuzzle();
  const revealed = getRevealedPositions(walletAddress);

  // Find first unrevealed position
  for (let i = 0; i < puzzle.solution.length; i++) {
    if (!revealed.has(i)) {
      revealed.add(i);
      return { position: i, char: puzzle.solution[i]! };
    }
  }

  return null; // All positions revealed
}

// Bips configuration for Mathler
const bipsConfig: BipsConfig = {
  appId: 'mathler',
  appName: 'Mathler',
  receiverAddress: BIPS_RECEIVER_ADDRESS,
  network: BIPS_NETWORK,
  items: [
    {
      id: 'hint',
      name: 'Hint',
      description: 'Reveal one character from the solution',
      price: '0.05',
      currency: 'USDC',
    },
  ],
};

// Create the Bips-enabled Express server
const app = createBipsServer({
  config: bipsConfig,
  onPurchase: async ({ itemId, req }) => {
    // Extract wallet address from x402 payment (stored by middleware)
    // For now, use a placeholder - in production, extract from payment verification
    const walletAddress = (req.headers['x-wallet-address'] as string) || 'demo';

    if (itemId === 'hint') {
      const hint = revealNextHint(walletAddress);

      if (!hint) {
        return {
          success: false,
          error: 'All positions already revealed',
        };
      }

      console.log(`Hint purchased: position=${hint.position}, char=${hint.char}`);

      return {
        success: true,
        data: hint,
      };
    }

    return {
      success: false,
      error: `Unknown item: ${itemId}`,
    };
  },
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', puzzle: getDailyPuzzle().target });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🎮 Mathler server running on http://localhost:${PORT}`);
  console.log(`📊 Today's puzzle target: ${getDailyPuzzle().target}`);
  console.log(`💰 Receiver address: ${bipsConfig.receiverAddress}`);
});
