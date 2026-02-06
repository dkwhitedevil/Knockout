import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function shorten(addr: string) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export default function Header() {
  const [address, setAddress] = useState<string | null>(() => {
    try {
      return localStorage.getItem('wallet_address');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'wallet_address') setAddress(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <header className="border-b-[4px] border-foreground p-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/">
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter">
            KNOCKOUT<span className="text-primary">_OS</span>
          </h1>
        </Link>

        <div className="flex items-center gap-4">
          {address ? (
            <div className="px-4 py-2 border-[3px] border-foreground bg-card shadow-brutal-sm">
              <p className="text-sm font-mono">{shorten(address)}</p>
            </div>
          ) : (
            <div className="text-sm font-mono opacity-70">Not connected</div>
          )}
        </div>
      </div>
    </header>
  );
}
