 import { useState, useEffect } from 'react';
 import { cn } from '@/lib/utils';
 
 interface TimerProps {
   seconds: number;
   onComplete?: () => void;
   isRunning?: boolean;
 }
 
 export function Timer({ seconds, onComplete, isRunning = true }: TimerProps) {
   const [timeLeft, setTimeLeft] = useState(seconds);
   
   useEffect(() => {
     setTimeLeft(seconds);
   }, [seconds]);
   
   useEffect(() => {
     if (!isRunning || timeLeft <= 0) return;
     
     const timer = setInterval(() => {
       setTimeLeft(prev => {
         if (prev <= 1) {
           onComplete?.();
           return 0;
         }
         return prev - 1;
       });
     }, 1000);
     
     return () => clearInterval(timer);
   }, [isRunning, timeLeft, onComplete]);
   
   const isUrgent = timeLeft <= 5;
   
   return (
     <div className={cn(
       'w-20 h-20 border-[4px] border-foreground flex items-center justify-center font-mono font-bold text-3xl',
       isUrgent && 'bg-destructive text-destructive-foreground animate-pulse-brutal',
       !isUrgent && 'bg-card'
     )}>
       {timeLeft}
     </div>
   );
 }