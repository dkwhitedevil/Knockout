import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrutalCard } from '@/components/ui/BrutalCard';
import Wallet from '@/components/wallets/wallet';

export default function Login() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b-[4px] border-foreground p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/">
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter">
              KNOCKOUT<span className="text-primary">_OS</span>
            </h1>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'linear' }}
        >
          <BrutalCard className="w-full max-w-md p-8 text-center">
            <div className="mb-6">
              <h2 className="text-3xl font-bold uppercase mb-2">CONNECT WALLET</h2>
              <p className="font-mono text-sm opacity-70">Connect your wallet to enter the arena</p>
            </div>

            <div className="flex items-center justify-center">
              <Wallet />
            </div>
          </BrutalCard>
        </motion.div>
      </main>
    </div>
  );
}
