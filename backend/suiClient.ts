import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";

/**
 * Sui RPC client (testnet)
 */
export const suiClient = new SuiClient({
  url: getFullnodeUrl("testnet"),
});
