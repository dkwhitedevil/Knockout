import { suiClient } from './suiClient';
import { USDC_TYPE } from './tokens';

/**
 * Get USDC balance for an address on Sui.
 * Returns a number representing the human-readable USDC amount (6 decimals).
 */
export async function getUsdcBalance(ownerAddress: string, coinType = USDC_TYPE): Promise<number> {
  if (!ownerAddress) return 0;

  try {
    const balance = await suiClient.getBalance({ owner: ownerAddress, coinType });
    const total = Number(balance?.totalBalance ?? 0);
    // USDC uses 6 decimals on Sui
    return total / 1_000_000;
  } catch (err) {
    console.error('getUsdcBalance error', err);
    throw err;
  }
}

export default getUsdcBalance;
