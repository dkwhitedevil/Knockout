import React, { useEffect, useState } from 'react';
  import { Link } from 'react-router-dom';
  import SuiIdentity from './wallets/SuiIdentity';
  import { useCurrentAccount } from '@mysten/dapp-kit';
  import { fetchSuiBalance } from '@/lib/suiRpc';

  export default function Header() {
    return (
      <header className="border-b-[4px] border-foreground p-4 bg-[hsl(var(--background))]">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/">
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter">
              Knockout<span className="text-primary"></span>
            </h1>
          </Link>

          {/* Right side actions: wallet identity + SUI balance */}
          <div className="flex items-center gap-3">
            <SuiIdentity />
            <SuiBalanceDisplay />
          </div>
        </div>
      </header>
    );
  }

  function SuiBalanceDisplay() {
  const account = useCurrentAccount();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Keep the hook here! Don't move it.
  useEffect(() => {
    let cancelled = false;
    
    // Logic inside the effect handles the "no account" state
    if (!account?.address) {
      setBalance(null);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const b = await fetchSuiBalance(account.address);
        if (!cancelled) setBalance(b);
      } catch (e) {
        if (!cancelled) setBalance(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [account?.address]);

  // NOW you can return early for the UI
  if (!account) return null;
  if (loading) return <div className="text-xs opacity-70">Loading SUI…</div>;
  if (balance == null) return null;

  return (
    <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs font-mono opacity-90" title={`${balance} SUI`}>
      <span className="mr-1">🪙</span>
      {balance.toFixed(2)} SUI
    </div>
  );
}
