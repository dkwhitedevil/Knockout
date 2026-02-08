import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getIdentityBySui, linkIdentity } from '@/services/identity';
import { ConnectButton, useCurrentAccount, useWallets } from '@mysten/dapp-kit';
import { useAccount } from 'wagmi';
import { BrowserProvider, verifyMessage } from 'ethers';
import { getAllBalances } from '@/lib/suiRpc';

function shortAddr(addr = '') {
  return addr.slice(0, 6) + '...' + addr.slice(-6);
}

function formatSui(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(value);
}

export default function SuiIdentity() {
  const { toast } = useToast();
  const account = useCurrentAccount();
  const wallets = (useWallets as any) ? (useWallets as any)() : null;
  const { isConnected: isEthConnected } = useAccount();
  const [suiAddress, setSuiAddress] = useState<string | null>(null);
  const [identity, setIdentity] = useState<any | null>(null);
  const [linking, setLinking] = useState(false);
  const [suiBalance, setSuiBalance] = useState<number | null>(null);
  const [suiBalanceLoading, setSuiBalanceLoading] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [usdcBalanceLoading, setUsdcBalanceLoading] = useState(false);

  useEffect(() => {
    const onLinked = (e: any) => {
      try {
        const payload = e?.detail;
        if (payload && payload.sui_address === account?.address) {
          setIdentity(payload);
        }
      } catch (err) {
        console.debug('SuiIdentity: error handling identity:linked', err);
      }
    };
    window.addEventListener('identity:linked', onLinked as EventListener);
    return () => window.removeEventListener('identity:linked', onLinked as EventListener);
  }, [account]);

  useEffect(() => {
    setSuiAddress(account?.address ?? null);
  }, [account]);

  useEffect(() => {
    if (!account?.address) {
      setSuiBalance(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setSuiBalanceLoading(true);
      setUsdcBalanceLoading(true);
      try {
        const balances = await getAllBalances(account.address);
        // find SUI coin type (contains 'sui::SUI' or similar)
        const suiEntry = (balances || []).find((b: any) => String(b.coinType || '').toLowerCase().includes('sui::sui'));
        if (suiEntry && suiEntry.totalBalance != null) {
          // SUI uses 9 decimals
          const value = Number(suiEntry.totalBalance) / 1e9;
          if (!cancelled) setSuiBalance(value);
        } else {
          if (!cancelled) setSuiBalance(0);
        }

        // Try to find a USDC-like token in the balances (flexible matching)
        const usdcEntry = (balances || []).find((b: any) => {
          const t = String(b.coinType || '').toLowerCase();
          return t.includes('usdc') || t.includes('usd') || t.includes('stable') || t.includes('usd_coin');
        });

        if (usdcEntry && (usdcEntry.totalBalance != null || usdcEntry.total_balance != null || usdcEntry.value != null)) {
          // Most USDC variants use 6 decimals on Sui-like networks; fall back to 6
          const raw = Number(usdcEntry.totalBalance ?? usdcEntry.total_balance ?? usdcEntry.value ?? 0);
          if (!cancelled) setUsdcBalance(raw / 1_000_000);
        } else {
          if (!cancelled) setUsdcBalance(null);
        }
      } catch (e) {
        console.debug('Could not fetch balances', e);
        if (!cancelled) {
          setSuiBalance(null);
          setUsdcBalance(null);
        }
      } finally {
        if (!cancelled) {
          setSuiBalanceLoading(false);
          setUsdcBalanceLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [account?.address]);

  useEffect(() => {
    if (!suiAddress) return;
    (async () => {
      try {
        const res = await getIdentityBySui(suiAddress);
        if (res) setIdentity(res);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [suiAddress]);

  // Sui connection handled by ConnectButton and WalletProvider
  const handleDisconnect = async () => {
    try {
      if (wallets && wallets.disconnect) {
        await wallets.disconnect();
      } else if ((window as any).sui && (window as any).sui.disconnect) {
        await (window as any).sui.disconnect();
      }
      setSuiAddress(null);
      setIdentity(null);
      toast({ title: 'Sui wallet disconnected' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Disconnect failed', description: e?.message ?? String(e) });
    }
  };

  const handleLinkEthereum = async () => {
    setLinking(true);
    try {
      // Request Ethereum provider
      if (!(window as any).ethereum) throw new Error('No Ethereum provider found');
      const provider = new BrowserProvider((window as any).ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const ethAddress = await signer.getAddress();

      // Resolve ENS name and avatar (best-effort)
      let ensName: string | null = null;
      let ensAvatar: string | null = null;
      try {
        ensName = await provider.lookupAddress(ethAddress);
        if (ensName) {
          const resolver = await provider.getResolver(ensName);
          if (resolver && resolver.getText) {
            // try to fetch avatar text record
            try {
              ensAvatar = await resolver.getText('avatar');
            } catch {}
          }
        }
      } catch (e) {
        console.debug('ENS lookup failed', e);
      }

      // Sign linking message
      const timestamp = Date.now();
      const message = `Link Sui:${suiAddress} to Ethereum:${ethAddress}\nTimestamp:${timestamp}`;
      const signature = await signer.signMessage(message);
      const recovered = verifyMessage(message, signature);
      if (recovered.toLowerCase() !== ethAddress.toLowerCase()) throw new Error('Signature mismatch');

      const payload = {
        sui_address: suiAddress,
        eth_address: ethAddress,
        ens_name: ensName,
        ens_avatar: ensAvatar,
        created_at: new Date().toISOString(),
      };

      await linkIdentity(payload as any);
      setIdentity(payload);
      toast({ title: 'Identity linked', description: 'Sui and Ethereum identities linked successfully.' });
      try {
        // broadcast to the app that an identity was linked so other components can update
        window.dispatchEvent(new CustomEvent('identity:linked', { detail: payload }));
      } catch (e) {
        console.debug('Could not dispatch identity:linked event', e);
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Linking failed', description: e?.message ?? String(e) });
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {identity ? (
        // Only show ENS avatar/name when Ethereum is connected; otherwise show only Sui address
        isEthConnected ? (
          <div className="flex items-center gap-3">
            <img
              src={identity.ens_avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(identity.ens_name ?? identity.sui_address)}&background=111827&color=ffffff`}
              alt="ens avatar"
              className="w-8 h-8 rounded-full"
            />
            <div className="text-sm text-right">
                <div className="font-bold">{identity.ens_name ?? shortAddr(identity.sui_address)}</div>
              <div className="opacity-70 text-xs font-mono">{identity.sui_address}</div>
                <div className="mt-1">
                  {suiBalanceLoading ? (
                    <span className="inline-flex items-center gap-2 text-xs">
                      <span className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                      <span className="opacity-70 text-xs">Loading</span>
                    </span>
                  ) : suiBalance == null ? null : (
                    <span className="ml-1 inline-flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs font-mono opacity-90" title={`${suiBalance} SUI`}>
                        <span className="mr-1">🪙</span>
                        {formatSui(suiBalance)}
                      </span>
                      {usdcBalanceLoading ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs font-mono opacity-90">
                          <span className="opacity-70 text-xs">Loading</span>
                        </span>
                      ) : usdcBalance == null ? null : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs font-mono opacity-90" title={`$${usdcBalance} USDC`}>
                          <span className="mr-1">💵</span>
                          ${usdcBalance.toFixed(2)}
                        </span>
                      )}
                    </span>
                  )}
                </div>
            </div>
            <button
              className="ml-2 px-2 py-1 border-2 border-foreground text-sm"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted text-white flex items-center justify-center rounded-full font-mono text-xs">
              {shortAddr(identity.sui_address)}
            </div>
            <div className="text-sm text-right">
              <div className="font-bold">{shortAddr(identity.sui_address)}</div>
              <div className="opacity-70 text-xs font-mono">{identity.sui_address}</div>
              <div className="mt-1">
                {suiBalanceLoading ? (
                  <span className="inline-flex items-center gap-2 text-xs">
                    <span className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                    <span className="opacity-70 text-xs">Loading</span>
                  </span>
                ) : suiBalance == null ? null : (
                  <span className="ml-1 inline-flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs font-mono opacity-90" title={`${suiBalance} SUI`}>
                      <span className="mr-1">🪙</span>
                      {formatSui(suiBalance)}
                    </span>
                    {usdcBalanceLoading ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs font-mono opacity-90">
                        <span className="opacity-70 text-xs">Loading</span>
                      </span>
                    ) : usdcBalance == null ? null : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs font-mono opacity-90" title={`$${usdcBalance} USDC`}>
                        <span className="mr-1">💵</span>
                        ${usdcBalance.toFixed(2)}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
            
          </div>
        )
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <ConnectButton />
          </div>
        </div>
      )}
    </div>
  );
}
