 import { SessionWallet as SessionWalletType } from '@/lib/gameTypes';
 import { BrutalCard } from '../ui/BrutalCard';
 import { motion } from 'framer-motion';
 
 interface SessionWalletProps {
   session: SessionWalletType;
 }

 export function SessionWalletDisplay({ session }: SessionWalletProps) {
  // Calculate time remaining
  const expiresAt = session.status === 'ACTIVE' ? (session as any).expiresAt : null;
  const timeRemaining = expiresAt ? Math.max(0, expiresAt - Date.now()) : 0;
  const minutesRemaining = Math.floor(timeRemaining / 60000);
  const isExpiring = timeRemaining < 300000; // Less than 5 minutes

   return (
     <motion.div
       initial={{ opacity: 0, scale: 0.95 }}
       animate={{ opacity: 1, scale: 1 }}
       transition={{ duration: 0.3 }}
     >
       <BrutalCard variant="dark" padding="sm" className="w-full border-[3px]" style={{
         borderColor: session.status === 'ACTIVE' ? '#4ade80' : '#6b7280'
       }}>
       <div className="flex items-center justify-between mb-3">
         <span className="text-xs uppercase tracking-widest opacity-70">
           SESSION WALLET
         </span>
         <div className={`px-2 py-0.5 text-[10px] font-bold uppercase border-2 ${
           session.status === 'ACTIVE' 
             ? 'border-green-500 text-green-500' 
             : 'border-muted text-muted'
         }`}>
           ✓ {session.status}
         </div>
       </div>
       
       <div className="grid grid-cols-2 gap-4 mb-3">
         <div>
           <span className="text-[10px] uppercase opacity-50">MATCH ID</span>
           <p className="font-mono font-bold text-xs">{(session as any).matchId?.slice(0, 10)}...</p>
         </div>
         <div>
           <span className="text-[10px] uppercase opacity-50">EXPIRES IN</span>
           <p className={`font-mono font-bold text-lg ${isExpiring ? 'text-orange-500' : 'text-green-500'}`}>
             {minutesRemaining}m
           </p>
         </div>
       </div>
       
       <div className="border-t-2 border-background/20 pt-2">
         <span className="text-[10px] uppercase opacity-50 block mb-2">SIGNATURE-FREE PLAY</span>
         <p className="text-[10px] opacity-70">
           You can now play cards without wallet signatures. The session expires in {minutesRemaining} minutes.
         </p>
       </div>
       
       {/* Sui/Yellow Network Comment */}
       <div className="mt-3 pt-2 border-t border-dashed border-background/20">
         <p className="text-[9px] opacity-40 font-mono">
           // Sui PTB session object • Yellow Network state channel
         </p>
       </div>
       </BrutalCard>
     </motion.div>
   );
 }