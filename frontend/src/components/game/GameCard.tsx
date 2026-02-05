 import { motion } from 'framer-motion';
 import { GameCard as GameCardType, CardType } from '@/lib/gameTypes';
 import { cn } from '@/lib/utils';
 
 interface GameCardProps {
   card: GameCardType;
   isSelected?: boolean;
   isDisabled?: boolean;
   onClick?: () => void;
   size?: 'sm' | 'md' | 'lg';
 }
 
 const cardTypeStyles: Record<CardType, string> = {
   ATTACK: 'bg-destructive text-destructive-foreground',
   DEFENSE: 'bg-success text-success-foreground',
   TRICK: 'bg-warning text-warning-foreground',
   SPECIAL: 'bg-primary text-primary-foreground',
 };
 
 const cardTypeIcons: Record<CardType, string> = {
   ATTACK: '⚔',
   DEFENSE: '🛡',
   TRICK: '🎭',
   SPECIAL: '✦',
 };
 
 const sizeClasses = {
   sm: 'w-20 h-28 text-xs',
   md: 'w-28 h-40 text-sm',
   lg: 'w-36 h-52 text-base',
 };
 
 export function GameCard({ card, isSelected, isDisabled, onClick, size = 'md' }: GameCardProps) {
   return (
     <motion.div
       whileHover={!isDisabled ? { y: -8 } : undefined}
       whileTap={!isDisabled ? { scale: 0.95 } : undefined}
       transition={{ duration: 0.1, ease: 'linear' }}
       onClick={!isDisabled ? onClick : undefined}
       className={cn(
         'relative border-[4px] border-foreground cursor-pointer select-none flex flex-col',
         sizeClasses[size],
         cardTypeStyles[card.type],
         isSelected && 'ring-4 ring-primary ring-offset-2 ring-offset-background -translate-y-4',
         isDisabled && 'opacity-50 cursor-not-allowed grayscale',
         'shadow-brutal-lg hover:shadow-[8px_8px_0px_hsl(var(--foreground))]'
       )}
     >
       {/* Card Header */}
       <div className="flex items-center justify-between p-2 border-b-[3px] border-foreground bg-background/20">
         <span className="text-2xl">{cardTypeIcons[card.type]}</span>
         <span className="font-mono font-bold text-lg">{card.power}</span>
       </div>
       
       {/* Card Body */}
       <div className="flex-1 flex flex-col items-center justify-center p-2">
         <span className="font-bold uppercase tracking-tight text-center leading-tight">
           {card.name}
         </span>
       </div>
       
       {/* Card Footer */}
       <div className="p-2 border-t-[3px] border-foreground bg-background/20">
         <p className="text-[10px] uppercase tracking-wide text-center opacity-80 line-clamp-2">
           {card.description}
         </p>
       </div>
       
       {/* Selection indicator */}
       {isSelected && (
         <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary border-[3px] border-foreground flex items-center justify-center">
           <span className="text-xs font-bold">✓</span>
         </div>
       )}
     </motion.div>
   );
 }