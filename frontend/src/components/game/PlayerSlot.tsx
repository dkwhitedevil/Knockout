 import { Player } from '@/lib/gameTypes';
 import { cn } from '@/lib/utils';
 import { BrutalCard } from '../ui/BrutalCard';
 
 interface PlayerSlotProps {
   player?: Player;
   isCurrentUser?: boolean;
   showCard?: boolean;
   position?: 'top' | 'bottom' | 'left' | 'right';
 }
 
 export function PlayerSlot({ player, isCurrentUser, showCard, position = 'bottom' }: PlayerSlotProps) {
   if (!player) {
     return (
       <BrutalCard variant="muted" padding="sm" className="w-32 h-44 flex items-center justify-center opacity-50">
         <span className="text-xs uppercase tracking-wide text-muted-foreground">
           WAITING...
         </span>
       </BrutalCard>
     );
   }
 
   const healthPercent = (player.health / player.maxHealth) * 100;
   const healthColor = healthPercent > 60 ? 'bg-success' : healthPercent > 30 ? 'bg-warning' : 'bg-destructive';
 
   return (
     <BrutalCard 
       variant={isCurrentUser ? 'accent' : 'default'} 
       padding="sm"
       className={cn(
         'w-32 flex flex-col gap-2',
         !player.isConnected && 'opacity-50'
       )}
     >
       {/* Player Name */}
       <div className="flex items-center gap-2">
         <div className={cn(
           'w-2 h-2 border border-foreground',
           player.isConnected ? 'bg-success' : 'bg-muted'
         )} />
         <span className="font-bold text-xs uppercase truncate">
           {player.displayName}
         </span>
       </div>
       
       {/* ENS Name */}
       <span className="font-mono text-[10px] opacity-70 truncate">
         {player.ensName}
       </span>
       
       {/* Health Bar */}
       <div className="w-full h-4 border-[2px] border-foreground bg-muted overflow-hidden">
         <div 
           className={cn('h-full transition-all duration-150', healthColor)}
           style={{ width: `${healthPercent}%` }}
         />
       </div>
       
       {/* Health Text */}
       <div className="flex justify-between text-xs font-mono">
         <span>HP</span>
         <span className="font-bold">{player.health}/{player.maxHealth}</span>
       </div>
       
       {/* Selected Card Indicator */}
       {showCard && player.selectedCard && (
         <div className="mt-2 p-2 border-[2px] border-foreground bg-background/50">
           <span className="text-[10px] uppercase font-bold">
             CARD LOCKED
           </span>
         </div>
       )}
     </BrutalCard>
   );
 }