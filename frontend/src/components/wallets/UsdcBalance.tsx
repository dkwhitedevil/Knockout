import React, { useEffect, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import getUsdcBalance from '@/lib/getUsdcBalance';

export default function UsdcBalance({ className }: { className?: string }) {
  const account = useCurrentAccount();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!account?.address) {
      setBalance(null);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const b = await getUsdcBalance(account.address);
        if (!cancelled) setBalance(b);
      } catch (e) {
        console.error('UsdcBalance: failed to fetch', e);
        if (!cancelled) setBalance(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [account?.address]);

  if (loading) return <div className={className}><span className="text-xs opacity-70">Loading USDC…</span></div>;
  if (balance == null) return <div className={className}><span className="opacity-70">—</span></div>;

  return (
    <div className={className} title={`$${balance} USDC`}>
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs font-mono opacity-90">
        <span className="mr-1">USDC</span>
        {`$${balance.toFixed(2)}`} balance
      </span>
    </div>
  );
}
