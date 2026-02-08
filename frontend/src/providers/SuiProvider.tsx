import { ReactNode } from 'react';
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import '@mysten/dapp-kit/dist/index.css';

const { networkConfig } = createNetworkConfig({
  testnet: { url: 'https://fullnode.testnet.sui.io' },
});

export function SuiProvider({ children }: { children: ReactNode }) {
  return (
    <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
      <WalletProvider autoConnect>{children}</WalletProvider>
    </SuiClientProvider>
  );
}
