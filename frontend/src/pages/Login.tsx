 import { useState } from 'react';
 import { useNavigate, Link } from 'react-router-dom';
 import { motion } from 'framer-motion';
 import { BrutalButton } from '@/components/ui/BrutalButton';
 import { BrutalCard } from '@/components/ui/BrutalCard';
 import { useGame } from '@/contexts/GameContext';
 
 export default function Login() {
   const navigate = useNavigate();
   const { login, isLoading } = useGame();
   const [selectedProvider, setSelectedProvider] = useState<'google' | 'apple' | null>(null);
 
   const handleLogin = async (provider: 'google' | 'apple') => {
     setSelectedProvider(provider);
     await login(provider);
     navigate('/lobby');
   };
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       {/* Header */}
       <header className="border-b-[4px] border-foreground p-4">
         <div className="container mx-auto flex items-center justify-between">
           <Link to="/">
             <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter">
               LAST HAND<span className="text-primary">_OS</span>
             </h1>
           </Link>
         </div>
       </header>
 
       {/* Login Form */}
       <main className="flex-1 flex items-center justify-center p-4">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.2, ease: 'linear' }}
         >
           <BrutalCard className="w-full max-w-md p-8">
             <div className="text-center mb-8">
               <h2 className="text-3xl font-bold uppercase mb-2">ENTER THE ARENA</h2>
               <p className="font-mono text-sm opacity-70">
                 zkLogin — No seed phrases. Just play.
               </p>
             </div>
 
             <div className="space-y-4">
               <BrutalButton
                 variant="default"
                 size="lg"
                 className="w-full justify-start gap-4"
                 onClick={() => handleLogin('google')}
                 disabled={isLoading}
               >
                 <span className="text-2xl">G</span>
                 <span>
                   {isLoading && selectedProvider === 'google' 
                     ? 'CONNECTING...' 
                     : 'CONTINUE WITH GOOGLE'}
                 </span>
               </BrutalButton>
 
               <BrutalButton
                 variant="default"
                 size="lg"
                 className="w-full justify-start gap-4"
                 onClick={() => handleLogin('apple')}
                 disabled={isLoading}
               >
                 <span className="text-2xl"></span>
                 <span>
                   {isLoading && selectedProvider === 'apple' 
                     ? 'CONNECTING...' 
                     : 'CONTINUE WITH APPLE'}
                 </span>
               </BrutalButton>
             </div>
 
             {/* Info */}
             <div className="mt-8 pt-6 border-t-[3px] border-foreground">
               <div className="space-y-3 text-sm font-mono">
                 <div className="flex items-start gap-3">
                   <span className="text-primary">→</span>
                   <span className="opacity-70">
                     Social login creates a session wallet
                   </span>
                 </div>
                 <div className="flex items-start gap-3">
                   <span className="text-primary">→</span>
                   <span className="opacity-70">
                     No private keys exposed to browser
                   </span>
                 </div>
                 <div className="flex items-start gap-3">
                   <span className="text-primary">→</span>
                   <span className="opacity-70">
                     Get your ENS-style username (player.eth)
                   </span>
                 </div>
               </div>
             </div>
 
             {/* Technical Note */}
             <div className="mt-6 p-3 bg-muted border-[2px] border-foreground">
               <p className="text-[10px] font-mono opacity-50">
                 // Production: Sui zkLogin with OAuth providers
                 <br />
                 // Demo: Mock authentication flow
               </p>
             </div>
           </BrutalCard>
         </motion.div>
       </main>
     </div>
   );
 }