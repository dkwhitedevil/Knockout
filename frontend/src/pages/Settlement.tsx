 import { useState, useEffect } from 'react';
 import { useNavigate, Link } from 'react-router-dom';
 import { motion } from 'framer-motion';
 import { BrutalButton } from '@/components/ui/BrutalButton';
 import { BrutalCard } from '@/components/ui/BrutalCard';
 import { useGame } from '@/contexts/GameContext';
 
 type SettlementPhase = 'PREPARING' | 'SIGNING' | 'SETTLING' | 'COMPLETE';
 
 export default function Settlement() {
   const navigate = useNavigate();
   const { user, currentMatch, gameState, settleMatch } = useGame();
   const [phase, setPhase] = useState<SettlementPhase>('PREPARING');
   const [txHash, setTxHash] = useState<string>('');
   const [winnerAddress, setWinnerAddress] = useState<string>('');
   const [error, setError] = useState<string>('');
 
   useEffect(() => {
     if (!currentMatch) {
       navigate('/lobby');
     }
   }, [currentMatch, navigate]);

   useEffect(() => {
     // Determine winner from game state
     if (gameState) {
       const allPlayerIds = gameState.players.map((p) => p.id);
       const eliminatedIds = gameState.eliminated || [];
       const winners = allPlayerIds.filter((id) => !eliminatedIds.includes(id));
       
       if (winners.length > 0) {
         setWinnerAddress(winners[0]);
       }
     }
   }, [gameState]);
 
   const handleSettle = async () => {
     if (!currentMatch) return;
     
     setPhase('SIGNING');
     setError('');
     
     try {
       // Simulate user reviewing transaction
       await new Promise(r => setTimeout(r, 1000));
       setPhase('SETTLING');
       
       // Execute actual settlement transaction
       await settleMatch(currentMatch.id);
       
       // Generate a mock transaction hash for display
       setTxHash(`0x${Math.random().toString(16).slice(2, 18)}`);
       
       setPhase('COMPLETE');
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Settlement failed');
       setPhase('PREPARING');
     }
   };
 
   if (!currentMatch || !user) return null;

   // Determine winner display
   const winnerPlayer = gameState?.players.find((p) => p.id === winnerAddress);
   const isUserWinner = winnerAddress === user.id;
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       {/* Header */}
       <header className="border-b-[4px] border-foreground p-4">
         <div className="container mx-auto">
           <h1 className="text-2xl font-bold uppercase tracking-tighter text-center">
             ON-CHAIN SETTLEMENT
           </h1>
         </div>
       </header>
 
       {/* Settlement Content */}
       <main className="flex-1 container mx-auto p-4 py-12 flex items-center justify-center">
         <div className="w-full max-w-2xl">
           {/* Progress Steps */}
           <div className="flex items-center justify-between mb-12">
             {['PREPARE', 'SIGN', 'SETTLE', 'DONE'].map((step, i) => {
               const stepPhases: SettlementPhase[] = ['PREPARING', 'SIGNING', 'SETTLING', 'COMPLETE'];
               const currentIndex = stepPhases.indexOf(phase);
               const isActive = i <= currentIndex;
               const isCurrent = i === currentIndex;
               
               return (
                 <div key={step} className="flex items-center">
                   <div className={`w-12 h-12 border-[3px] border-foreground flex items-center justify-center font-bold ${
                     isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                   } ${isCurrent ? 'animate-pulse-brutal' : ''}`}>
                     {i + 1}
                   </div>
                   {i < 3 && (
                     <div className={`w-16 h-[3px] ${
                       i < currentIndex ? 'bg-primary' : 'bg-muted'
                     }`} />
                   )}
                 </div>
               );
             })}
           </div>
 
           {/* Content by Phase */}
           <motion.div
             key={phase}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.2 }}
           >
             {phase === 'PREPARING' && (
               <BrutalCard className="p-8">
                 <h2 className="text-2xl font-bold uppercase mb-6 text-center">
                   MATCH COMPLETE
                 </h2>
                 
                 {/* Match Summary */}
                 <div className="grid grid-cols-2 gap-6 mb-8">
                   <div className="text-center p-4 border-[2px] border-foreground">
                     <p className="text-xs font-mono opacity-50 mb-1">MATCH ID</p>
                     <p className="font-bold">{currentMatch.id.slice(0, 10)}...</p>
                   </div>
                   <div className={`text-center p-4 border-[2px] border-foreground ${isUserWinner ? 'bg-success/20 border-success' : 'bg-primary'}`}>
                     <p className="text-xs font-mono opacity-70 mb-1">PRIZE POOL</p>
                     <p className="text-2xl font-bold font-mono">${currentMatch.prizePool}</p>
                   </div>
                 </div>
 
                 {/* Winner */}
                 <div className="text-center mb-8">
                   <p className="text-sm font-mono opacity-50 mb-2">WINNER</p>
                   <div className={`inline-flex items-center gap-4 p-4 border-[3px] border-foreground ${isUserWinner ? 'bg-success/10' : 'bg-card'}`}>
                     <div className={`w-12 h-12 border-[2px] border-foreground flex items-center justify-center text-xl font-bold ${isUserWinner ? 'bg-success text-foreground' : 'bg-primary'}`}>
                       {winnerPlayer?.displayName[0] || '?'}
                     </div>
                     <div className="text-left">
                       <p className="text-lg font-bold uppercase">{winnerPlayer?.displayName || 'Unknown'}</p>
                       <p className="font-mono text-sm opacity-70">{winnerPlayer?.ensName || ''}</p>
                     </div>
                   </div>
                 </div>

                 {/* Result Message */}
                 {isUserWinner && (
                   <div className="p-4 bg-success/20 border-[2px] border-success mb-8 text-center">
                     <p className="text-lg font-bold text-success">🎉 YOU WON! 🎉</p>
                   </div>
                 )}
 
                 {error && (
                   <div className="p-4 bg-red-500/20 border-[2px] border-red-500 mb-8">
                     <p className="text-sm font-mono text-red-600">{error}</p>
                   </div>
                 )}
 
                 <BrutalButton
                   variant="primary"
                   size="xl"
                   className="w-full"
                   onClick={handleSettle}
                 >
                   SETTLE ON-CHAIN →
                 </BrutalButton>
 
                 {/* Technical Note */}
                 <div className="mt-6 p-3 border-[2px] border-dashed border-foreground/30">
                   <p className="text-[10px] font-mono opacity-50 text-center">
                     // Sui Move: finish_match() transfers escrow → winner
                     <br />
                     // gas funded by transaction sender
                   </p>
                 </div>
               </BrutalCard>
             )}
 
             {phase === 'SIGNING' && (
               <BrutalCard variant="dark" className="p-12 text-center">
                 <div className="w-16 h-16 mx-auto mb-6 border-[4px] border-background flex items-center justify-center animate-pulse-brutal">
                   <span className="text-3xl">✍</span>
                 </div>
                 <h2 className="text-2xl font-bold uppercase mb-2">SIGNING TRANSACTION</h2>
                 <p className="font-mono text-sm opacity-70">
                   Approve the settlement transaction...
                 </p>
               </BrutalCard>
             )}
 
             {phase === 'SETTLING' && (
               <BrutalCard variant="accent" className="p-12 text-center">
                 <div className="w-16 h-16 mx-auto mb-6 border-[4px] border-foreground flex items-center justify-center animate-pulse-brutal">
                   <span className="text-3xl">⛓</span>
                 </div>
                 <h2 className="text-2xl font-bold uppercase mb-2">SETTLING ON-CHAIN</h2>
                 <p className="font-mono text-sm opacity-70">
                   Submitting to Sui network...
                 </p>
               </BrutalCard>
             )}
 
             {phase === 'COMPLETE' && (
               <BrutalCard className="p-8">
                 <div className="text-center mb-8">
                   <div className="w-20 h-20 mx-auto mb-6 bg-success border-[4px] border-foreground flex items-center justify-center">
                     <span className="text-4xl">✓</span>
                   </div>
                   <h2 className="text-3xl font-bold uppercase mb-2">SETTLED!</h2>
                   <p className="font-mono opacity-70">
                     {isUserWinner ? 'Funds transferred to your wallet' : 'Match results recorded'}
                   </p>
                 </div>
 
                 {/* Transaction Details */}
                 <div className="space-y-3 mb-8">
                   <div className="flex justify-between p-3 border-[2px] border-foreground">
                     <span className="font-mono text-sm">Transaction Hash</span>
                     <span className="font-mono text-sm font-bold truncate max-w-[200px]">{txHash}</span>
                   </div>
                   {isUserWinner && (
                     <div className="flex justify-between p-3 border-[2px] border-foreground bg-success/20">
                       <span className="font-mono text-sm">Amount Received</span>
                       <span className="font-mono text-lg font-bold text-success">+${currentMatch.prizePool}</span>
                     </div>
                   )}
                   <div className="flex justify-between p-3 border-[2px] border-foreground">
                     <span className="font-mono text-sm">Match Status</span>
                     <span className="font-mono text-sm font-bold">COMPLETED</span>
                   </div>
                 </div>
 
                 <div className="flex gap-4">
                   <Link to="/profile" className="flex-1">
                     <BrutalButton variant="outline" className="w-full">
                       VIEW PROFILE
                     </BrutalButton>
                   </Link>
                   <Link to="/lobby" className="flex-1">
                     <BrutalButton variant="primary" className="w-full">
                       PLAY AGAIN →
                     </BrutalButton>
                   </Link>
                 </div>
               </BrutalCard>
             )}
           </motion.div>
         </div>
       </main>
     </div>
   );
 }
 
