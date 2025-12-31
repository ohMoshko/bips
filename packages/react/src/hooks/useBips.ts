import { useBipsContext } from '../provider/BipsContext';

export function useBips() {
  const context = useBipsContext();

  return {
    isReady: context.isReady,
    isConnected: context.isConnected,
    getItem: context.getItem,
    items: context.items,
    purchase: context.purchase,
    purchases: context.userState?.purchases ?? [],
    totalSpent: context.userState?.totalSpent ?? '0',
    walletAddress: context.walletAddress,
  };
}
