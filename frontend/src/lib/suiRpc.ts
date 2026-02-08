export const SUI_TESTNET_RPC = "https://fullnode.testnet.sui.io:443";

export async function getAllBalances(ownerAddress: string) {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "sui_getAllBalances",
    params: [ownerAddress],
  };

  const res = await fetch(SUI_TESTNET_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  return json.result;
}

// Fetch SUI balance (returns number in SUI). Attempts to use @mysten/sui SuiClient
// if available, otherwise falls back to the RPC `sui_getAllBalances` method.
export async function fetchSuiBalance(ownerAddress: string) {
  if (!ownerAddress) return 0;

  // Try using the official client if it's installed
  try {
    // dynamic import so build doesn't break when package isn't installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = await import('@mysten/sui/jsonRpc');
    const { SuiJsonRpcClient, JsonRpcHTTPTransport } = mod as any;
    const transport = new JsonRpcHTTPTransport({ url: SUI_TESTNET_RPC.replace(':443', '') });
    const client = new SuiJsonRpcClient({ transport, network: 'testnet' });
    const balance = await client.getBalance({ owner: ownerAddress, coinType: '0x2::sui::SUI' });
    if (balance && balance.totalBalance != null) {
      return Number(balance.totalBalance) / 1e9;
    }
  } catch (e) {
    // ignore and fallback to RPC
    // console.debug('sui client unavailable, falling back to RPC', e);
  }

  // Fallback: use RPC
  try {
    const balances = await getAllBalances(ownerAddress);
    const suiEntry = (balances || []).find((b: any) => String(b.coinType || '').toLowerCase().includes('sui::sui'));
    if (suiEntry && suiEntry.totalBalance != null) {
      return Number(suiEntry.totalBalance) / 1e9;
    }
    return 0;
  } catch (e) {
    // on error, return 0
    return 0;
  }
}
