// Token type configuration for Sui networks.
// Replace the MAINNET value with the real mainnet USDC coin type before production.

// Testnet USDC (example provided)
export const USDC_TYPE_TESTNET =
  '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC';

// TODO: set the correct Mainnet USDC type when deploying to mainnet
export const USDC_TYPE_MAINNET = '0xREPLACE_WITH_MAINNET_USDC::usdc::USDC';

const ENV: Record<string, any> = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : (typeof process !== 'undefined' && process.env ? process.env : {});

export const USDC_TYPE = (String(ENV.VITE_SUI_NETWORK || ENV.REACT_APP_SUI_NETWORK || 'testnet') === 'mainnet')
  ? USDC_TYPE_MAINNET
  : USDC_TYPE_TESTNET;
