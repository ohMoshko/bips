import {
  DynamicContextProvider,
  DynamicWidget,
} from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { BipsProvider } from '@bips/react';
import { Game } from './features/game';

// Environment variables (from .env.local, not committed to git)
const DYNAMIC_ENVIRONMENT_ID = import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID;
const BIPS_RECEIVER_ADDRESS = import.meta.env.VITE_BIPS_RECEIVER_ADDRESS;
const BIPS_NETWORK = (import.meta.env.VITE_BIPS_NETWORK || 'base-sepolia') as 'base-sepolia' | 'base';

// Validate required environment variables
if (!DYNAMIC_ENVIRONMENT_ID) {
  throw new Error('Missing VITE_DYNAMIC_ENVIRONMENT_ID. Copy .env.example to .env.local and configure.');
}
if (!BIPS_RECEIVER_ADDRESS) {
  throw new Error('Missing VITE_BIPS_RECEIVER_ADDRESS. Copy .env.example to .env.local and configure.');
}

// Base Sepolia network configuration for Dynamic SDK
const baseSepolia = {
  blockExplorerUrls: ['https://sepolia.basescan.org'],
  chainId: 84532,
  chainName: 'Base Sepolia',
  iconUrls: ['https://app.dynamic.xyz/assets/networks/base.svg'],
  name: 'Base Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  networkId: 84532,
  rpcUrls: ['https://sepolia.base.org'],
  vanityName: 'Base Sepolia',
};

const bipsConfig = {
  appId: 'mathler',
  appName: 'Mathler',
  receiverAddress: BIPS_RECEIVER_ADDRESS,
  network: BIPS_NETWORK,
  items: [
    {
      id: 'hint',
      name: 'Hint',
      description: 'Reveal one correct character',
      price: '0.05',
      currency: 'USDC' as const,
    },
    {
      id: 'extra-guess',
      name: 'Extra Guess',
      description: 'Get one more attempt',
      price: '0.10',
      currency: 'USDC' as const,
    },
  ],
};

export default function App() {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: DYNAMIC_ENVIRONMENT_ID,
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          evmNetworks: [baseSepolia],
        },
      }}
    >
      <BipsProvider config={bipsConfig}>
        <div className="min-h-[100dvh] bg-tile flex flex-col">
          {/* Header with wallet connection */}
          <header className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-700 shrink-0">
            <div className="text-lg sm:text-xl font-bold text-white">🧮 Mathler</div>
            <DynamicWidget />
          </header>

          {/* Game */}
          <main className="py-4 sm:py-8 flex-1">
            <Game />
          </main>
        </div>
      </BipsProvider>
    </DynamicContextProvider>
  );
}
