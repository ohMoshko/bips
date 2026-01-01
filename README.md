# Bips SDK

A micropayment SDK for web apps using [Coinbase's x402 protocol](https://github.com/coinbase/x402) and [Dynamic wallet infrastructure](https://dynamic.xyz).

**Bips** = **B**lockchain **I**n-app **P**ayment**s**

## What is this?

Bips lets you add crypto micropayments to any web app in minutes. Users pay with USDC on Base (L2), and you get a simple React component and server middleware to handle everything.

```tsx
// That's it. A $0.05 payment button.
<BipsButton itemId="hint" onSuccess={(purchase) => revealHint(purchase)} />
```

## Live Demo

[**Mathler**](https://bips-mathler.vercel.app) - A math puzzle game where you can buy hints for $0.05 USDC

## Project Structure

```
bips/
├── packages/
│   ├── @bips/core       # Shared types, validation, utilities
│   ├── @bips/react      # React hooks and BipsButton component
│   └── @bips/server     # Express middleware for x402 payments
│
└── apps/
    └── mathler          # Demo game (see apps/mathler/README.md)
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- A wallet (MetaMask, Coinbase Wallet, or Dynamic embedded wallet)

### Installation

```bash
# Clone the repo
git clone https://github.com/ohMoshko/bips.git
cd bips

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local
```

### Configure Environment

Edit `.env.local` with your values:

```bash
# Get from https://app.dynamic.xyz > Developer > API
VITE_DYNAMIC_ENVIRONMENT_ID=your-dynamic-environment-id

# Your wallet address (receives payments)
VITE_BIPS_RECEIVER_ADDRESS=0xYourWalletAddress

# Network (base-sepolia for testnet, base for mainnet)
VITE_BIPS_NETWORK=base-sepolia

# Server-side (same values)
BIPS_RECEIVER_ADDRESS=0xYourWalletAddress
BIPS_NETWORK=base-sepolia
```

### Run Locally

```bash
# Build all packages
pnpm build

# Start development servers
pnpm dev:mathler      # Frontend: http://localhost:5173
pnpm dev:server       # Backend:  http://localhost:3001
```

### Run Tests

```bash
pnpm test             # All 108 tests
```

## How to Add Bips to Your App

### 1. Install Packages

```bash
pnpm add @bips/core @bips/react @bips/server
```

### 2. Configure the Provider

```tsx
// App.tsx
import { BipsProvider } from '@bips/react';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';

const bipsConfig = {
  appId: 'my-app',
  appName: 'My App',
  receiverAddress: process.env.VITE_BIPS_RECEIVER_ADDRESS,
  network: 'base-sepolia',
  items: [
    { id: 'premium', name: 'Premium Feature', price: '1.00', currency: 'USDC' },
    { id: 'credits', name: '10 Credits', price: '0.50', currency: 'USDC' },
  ],
};

function App() {
  return (
    <DynamicContextProvider settings={{ environmentId: '...' }}>
      <BipsProvider config={bipsConfig}>
        <YourApp />
      </BipsProvider>
    </DynamicContextProvider>
  );
}
```

### 3. Add Payment Buttons

```tsx
// Anywhere in your app
import { BipsButton } from '@bips/react';

function PremiumFeature() {
  return (
    <BipsButton
      itemId="premium"
      onSuccess={(purchase) => {
        console.log('Paid!', purchase);
        unlockFeature();
      }}
      onError={(error) => {
        console.error('Payment failed:', error);
      }}
    >
      Unlock Premium ($1.00)
    </BipsButton>
  );
}
```

### 4. Set Up Server

```typescript
// server/index.ts
import { createBipsServer } from '@bips/server';

const app = createBipsServer({
  config: bipsConfig,
  onPurchase: async ({ itemId, req }) => {
    if (itemId === 'premium') {
      // Your business logic here
      await unlockPremiumForUser(req.userId);
      return { success: true, data: { unlocked: true } };
    }
    return { success: false, error: 'Unknown item' };
  },
});

app.listen(3001);
```

## Package APIs

### @bips/core

Shared types and utilities.

```typescript
import { BipsConfig, BipsItem, BipsPurchase, formatPrice } from '@bips/core';

formatPrice('0.05');  // "$0.05"
formatPrice('1.00');  // "$1.00"
```

### @bips/react

React integration with Dynamic wallet.

```typescript
import { BipsProvider, BipsButton, useBips, useBipsPurchase } from '@bips/react';

// Hook for custom payment UI
const { purchase, isLoading, error } = useBipsPurchase();
const result = await purchase('item-id');

// Hook for app state
const { items, isConnected, walletAddress } = useBips();
```

### @bips/server

Express middleware for x402 payment verification.

```typescript
import { createBipsServer, bipsMiddleware } from '@bips/server';

// Full server setup
const app = createBipsServer({ config, onPurchase });

// Or just the middleware
app.use('/api/bips', bipsMiddleware({ config, onPurchase }));
```

## How Payments Work

Bips uses the [x402 protocol](https://github.com/coinbase/x402) - an HTTP-native payment standard by Coinbase.

```
1. Client: POST /api/bips/purchase/hint
2. Server: 402 Payment Required (with price + address)
3. Client: Wallet signs EIP-712 payment authorization
4. Client: Retries request with payment header
5. Server: Verifies payment on-chain
6. Server: 200 OK + your response data
```

The entire flow takes ~2 seconds with a single wallet signature.

### Why x402?

| Approach | Pros | Cons |
|----------|------|------|
| **x402 (used here)** | HTTP-native, stateless, low fees on L2 | Newer protocol |
| Stripe | Familiar, reliable | 2.9% + $0.30 fees, no crypto |
| Custom smart contracts | Full control | Complex, gas costs |
| NFTs | Ownership proof | Overkill for consumables |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables:
   - `VITE_DYNAMIC_ENVIRONMENT_ID`
   - `VITE_BIPS_RECEIVER_ADDRESS`
   - `VITE_BIPS_NETWORK`
4. Deploy

### Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `VITE_DYNAMIC_ENVIRONMENT_ID` | Frontend | Dynamic SDK environment ID |
| `VITE_BIPS_RECEIVER_ADDRESS` | Frontend | Wallet receiving payments |
| `VITE_BIPS_NETWORK` | Frontend | `base-sepolia` or `base` |
| `BIPS_RECEIVER_ADDRESS` | Backend | Same as above |
| `BIPS_NETWORK` | Backend | Same as above |
| `PORT` | Backend | Server port (default: 3001) |

## Getting Testnet Funds

1. **Base Sepolia ETH**: [Coinbase Faucet](https://portal.cdp.coinbase.com/products/faucet)
2. **Testnet USDC**: [Circle Faucet](https://faucet.circle.com/)

## Security Considerations

- **No private keys on client** - Signing happens in wallet (Dynamic embedded or external)
- **Payment verification on-chain** - Server doesn't trust client claims
- **Environment variables** - Secrets in `.env.local`, never committed
- **Input validation** - Item IDs validated against config

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Express, TypeScript
- **Payments**: Coinbase x402 protocol, USDC on Base
- **Wallet**: Dynamic SDK (embedded + external wallets)
- **Testing**: Vitest (108 tests)
- **Build**: Turborepo, pnpm workspaces

## Contributing

```bash
# Run tests
pnpm test

# Type check
pnpm build

# Lint (if configured)
pnpm lint
```
