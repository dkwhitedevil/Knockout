 import { SessionWallet as SessionWalletType } from '@/lib/gameTypes';
 import { BrutalCard } from '../ui/BrutalCard';
 
 interface SessionWalletProps {
   session: SessionWalletType;
 }
 
 export function SessionWalletDisplay({ session }: SessionWalletProps) {
   return (
     <BrutalCard variant="dark" padding="sm" className="w-full">
       <div className="flex items-center justify-between mb-3">
         <span className="text-xs uppercase tracking-widest opacity-70">
           SESSION WALLET
         </span>
         <div className={`px-2 py-0.5 text-[10px] font-bold uppercase border-2 ${
           session.status === 'ACTIVE' 
             ? 'border-success text-success' 
             : 'border-muted text-muted'
         }`}>
           {session.status}
         </div>
       </div>
       
       <div className="grid grid-cols-2 gap-4 mb-3">
         <div>
           <span className="text-[10px] uppercase opacity-50">LOCKED</span>
           <p className="font-mono font-bold text-lg">${session.lockedAmount}</p>
         </div>
         <div>
           <span className="text-[10px] uppercase opacity-50">BALANCE</span>
           <p className="font-mono font-bold text-lg">${session.balance}</p>
         </div>
       </div>
       
       <div className="border-t-2 border-background/20 pt-2">
         <span className="text-[10px] uppercase opacity-50 block mb-1">PERMISSIONS</span>
         <div className="flex flex-wrap gap-1">
           {session.permissions.map((perm) => (
             <span 
               key={perm}
               className="px-2 py-0.5 text-[10px] font-mono bg-background/20 border border-background/30"
             >
               {perm}
             </span>
           ))}
         </div>
       </div>
       
       {/* Sui/Yellow Network Comment */}
       <div className="mt-3 pt-2 border-t border-dashed border-background/20">
         <p className="text-[9px] opacity-40 font-mono">
           // Sui PTB session object • Yellow Network state channel
         </p>
       </div>
     </BrutalCard>
   );
 }