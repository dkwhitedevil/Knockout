 import { Link } from 'react-router-dom';
 import { motion } from 'framer-motion';
 import { BrutalButton } from '@/components/ui/BrutalButton';
 import { BrutalCard } from '@/components/ui/BrutalCard';
 
 export default function Landing() {
   return (
     <div className="min-h-screen bg-background flex flex-col">
       {/* Header */}
       <header className="border-b-[4px] border-foreground p-4">
         <div className="container mx-auto flex items-center justify-between">
           <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter">
             LAST HAND<span className="text-primary">_OS</span>
           </h1>
           <Link to="/login">
             <BrutalButton variant="outline" size="sm">
               LOGIN
             </BrutalButton>
           </Link>
         </div>
       </header>
 
       {/* Hero */}
       <main className="flex-1 container mx-auto px-4 py-12 md:py-20">
         <div className="grid lg:grid-cols-2 gap-12 items-center">
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.3, ease: 'linear' }}
             className="space-y-8"
           >
             <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold uppercase leading-[0.85] tracking-tighter">
               ONE PAYMENT.
               <br />
               <span className="text-primary">INFINITE MOVES.</span>
               <br />
               FINAL SETTLEMENT.
             </h2>
             
             <p className="text-xl md:text-2xl font-mono max-w-lg opacity-80">
               Session-based card battles. Lock funds once, play unlimited rounds, settle on-chain.
             </p>
             
             <div className="flex flex-wrap gap-4">
               <Link to="/login">
                 <BrutalButton variant="primary" size="xl">
                   PLAY NOW →
                 </BrutalButton>
               </Link>
               <BrutalButton variant="outline" size="xl">
                 LEARN MORE
               </BrutalButton>
             </div>
             
             {/* Tech Stack Badges */}
             <div className="flex flex-wrap gap-2 pt-4">
               {['SUI', 'ENS', 'YELLOW NETWORK', 'zkLOGIN'].map((tech) => (
                 <span 
                   key={tech}
                   className="px-3 py-1 text-xs font-bold uppercase border-[2px] border-foreground bg-muted"
                 >
                   {tech}
                 </span>
               ))}
             </div>
           </motion.div>
           
           {/* Feature Cards */}
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.3, delay: 0.1, ease: 'linear' }}
             className="grid gap-4"
           >
             <BrutalCard variant="accent" className="p-6">
               <span className="text-4xl mb-2 block">⚡</span>
               <h3 className="text-xl font-bold uppercase mb-2">SESSION WALLETS</h3>
               <p className="font-mono text-sm opacity-80">
                 Lock funds once per match. No per-move blockchain calls. Instant gameplay.
               </p>
             </BrutalCard>
             
             <div className="grid grid-cols-2 gap-4">
               <BrutalCard className="p-4">
                 <span className="text-3xl mb-2 block">🎴</span>
                 <h3 className="text-lg font-bold uppercase mb-1">4-8 PLAYERS</h3>
                 <p className="font-mono text-xs opacity-70">Battle royale cards</p>
               </BrutalCard>
               
               <BrutalCard className="p-4">
                 <span className="text-3xl mb-2 block">⏱</span>
                 <h3 className="text-lg font-bold uppercase mb-1">15s ROUNDS</h3>
                 <p className="font-mono text-xs opacity-70">Real-time action</p>
               </BrutalCard>
             </div>
             
             <BrutalCard variant="dark" className="p-6">
               <span className="text-4xl mb-2 block">🔗</span>
               <h3 className="text-xl font-bold uppercase mb-2">ON-CHAIN SETTLEMENT</h3>
               <p className="font-mono text-sm opacity-80">
                 Final state committed to Sui. Winner paid automatically. Session closed.
               </p>
             </BrutalCard>
           </motion.div>
         </div>
       </main>
 
       {/* Footer */}
       <footer className="border-t-[4px] border-foreground p-4">
         <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
           <p className="font-mono text-sm opacity-60">
             // Demo of session-based Web3 gaming infrastructure
           </p>
           <div className="flex gap-4 text-sm font-bold uppercase">
             <a href="#" className="hover:text-primary">DOCS</a>
             <a href="#" className="hover:text-primary">GITHUB</a>
             <a href="#" className="hover:text-primary">DISCORD</a>
           </div>
         </div>
       </footer>
     </div>
   );
 }