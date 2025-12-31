# Mathler with x402 Micropayments

A Wordle-inspired math puzzle game with **real cryptocurrency micropayments** for in-game purchases, powered by [Dynamic SDK](https://dynamic.xyz) and the [x402 payment protocol](https://www.x402.org/).

## Live Demo

[**Play Mathler**](https://mathler-demo.vercel.app) (Base Sepolia testnet)

## The Crypto Feature: x402 Micropayments

The assignment suggested minting an NFT on first solve - a great way to showcase wallet integration. I decided to take it a step further by implementing **pay-per-use micropayments** for game hints, demonstrating how crypto can enable real in-app purchases.

### Why Micropayments?

NFTs are perfect for collectibles and achievements, but micropayments unlock a different use case: **sustainable app monetization**. With x402:

- Users pay $0.05 USDC for a hint (real utility, not just a collectible)
- Developers get a revenue stream from day one
- L2 fees make sub-dollar payments viable
- No smart contract deployment needed - just HTTP

### How It Works

```
1. User clicks "Buy Hint" ($0.05 USDC)
2. Server returns HTTP 402 Payment Required
3. x402 client prompts wallet to sign EIP-712 payment
4. Request retries with payment header
5. Server verifies payment, returns hint
6. Payment settles on Base (L2 = low fees)
```

The entire flow happens in ~2 seconds with a single wallet signature.

## Architecture

```
apps/mathler/           # Game frontend + backend
packages/
  @bips/core            # Shared types and utilities
  @bips/react           # React hooks for payments (useBipsPurchase)
  @bips/server          # Express middleware for x402
```

### Key Files

- `src/features/game/` - Game logic (equation parsing, guess checking)
- `src/features/game/hooks/useUserStats.ts` - Dynamic SDK metadata integration
- `server/index.ts` - Express server with x402 payment verification
- `packages/react/src/hooks/useBipsPurchase.ts` - Payment hook with Dynamic wallet

## Dynamic SDK Integration

### 1. Wallet Connection
Using `DynamicContextProvider` with Base Sepolia network configuration.

### 2. User Metadata (Stats Persistence)
```typescript
// useUserStats.ts - persists game stats to Dynamic user metadata
const { updateUser } = useUserUpdateRequest();

await updateUser({
  metadata: {
    mathlerStats: {
      gamesPlayed: 5,
      gamesWon: 3,
      currentStreak: 2,
      maxStreak: 4,
      guessDistribution: { 1: 0, 2: 1, 3: 2, 4: 0, 5: 0, 6: 0 },
      hintsPurchased: 1,
    },
  },
});
```

### 3. EIP-712 Signing for Payments
```typescript
// Creates a signer from Dynamic's wallet client
const walletClient = await primaryWallet.getWalletClient();
const signature = await walletClient.signTypedData({
  domain: paymentDomain,
  types: paymentTypes,
  message: paymentMessage,
});
```

## Testing Strategy

I focused on testing the **game logic** thoroughly since that's the core domain:

```bash
pnpm test
# 110 tests passing
```

### What I Test

| Layer | Approach | Why |
|-------|----------|-----|
| Equation parsing | Unit tests | Pure functions, easy to test |
| Guess checking | Unit tests | Core game logic |
| Game state machine | Unit tests | State transitions |
| Payment hook | Integration tests | Mocks fetch + wallet |
| Server middleware | Integration tests | Mocks x402 verification |

### Mocking Philosophy

- **Mock at boundaries**: External services (x402, blockchain, Dynamic API)
- **Don't mock core logic**: Equation evaluation, guess checking
- **Realistic mocks**: Mock implementations mirror real behavior

## Running Locally

### Prerequisites
- Node.js 20+
- pnpm 8+
- MetaMask or another wallet

### Setup

```bash
# Install dependencies
pnpm install

# Build packages
pnpm build

# Start development servers
pnpm dev:mathler      # Frontend on http://localhost:5173
pnpm dev:server       # Backend on http://localhost:3001
```

### Getting Testnet USDC

1. Get Base Sepolia ETH from [Coinbase Faucet](https://portal.cdp.coinbase.com/products/faucet)
2. Get testnet USDC from [Circle Faucet](https://faucet.circle.com/)

## Design Decisions

### Why a Monorepo?

The `@bips/react` and `@bips/server` packages are designed to be reusable across any app. Mathler is just the first demo app - the same SDK could power:
- Article paywalls
- AI image generation credits
- Premium API access

### Why Base Sepolia?

- L2 = low gas fees (essential for micropayments)
- Good testnet infrastructure
- Circle's testnet USDC available

### Why x402 Protocol?

- Open standard (Coinbase-backed)
- HTTP-native (no custom WebSocket flows)
- Automatic retry with payment
- Built for exactly this use case

## Future Improvements

With more time, I would add:
- [ ] Gasless transactions (paymaster/sponsor)
- [ ] Revenue splitting (app vs protocol)
- [ ] More purchasable items (extra guesses, daily skip)
- [ ] Leaderboard with on-chain verification
- [ ] PWA support for mobile

## Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Express, TypeScript
- **Payments**: x402 protocol, USDC on Base
- **Wallet**: Dynamic SDK
- **Testing**: Vitest
- **Build**: Turborepo, pnpm workspaces

