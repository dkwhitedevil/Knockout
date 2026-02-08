import { useState } from 'react';
 import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrutalButton } from '@/components/ui/BrutalButton';
import { BrutalCard } from '@/components/ui/BrutalCard';
import { useGame } from '@/contexts/GameContext';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { getAllBalances } from '@/lib/suiRpc';
import { shortenId } from '@/lib/utils';
import { LobbyWaiting } from '@/components/game/LobbyWaiting';
import { useEffect} from 'react';

 
 export default function Lobby() {
   const navigate = useNavigate();
  const { user, availableMatches, joinMatch, createMatch, isLoading, currentMatch, gameState } = useGame();
  const account = useCurrentAccount();

  const [suiLoading, setSuiLoading] = useState(false);
  const [suiBalance, setSuiBalance] = useState<number | null>(null);
   const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConnectCard, setShowConnectCard] = useState(false);
  const [entryFee, setEntryFee] = useState(0.1);
   const [maxPlayers, setMaxPlayers] = useState(4);

  // Auto-navigate to Arena when all players are paid and game starts
  useEffect(() => {
    if (
      gameState?.phase === 'active' &&
      currentMatch &&
      gameState.players.every(player => player.hasPaid)
    ) {
      // Removed navigation to Arena
    }
  }, [gameState?.phase, currentMatch, gameState?.players, navigate]);
 
   const handleCreateMatch = async () => {
     await createMatch(entryFee, maxPlayers);
     // Removed navigation to Arena
   };
 
   const handleJoinMatch = async (matchId: string) => {
     await joinMatch(matchId);
     // Removed navigation to Arena
   };


   return (
     <div className="min-h-screen bg-background flex flex-col">
       {/* Header */}
      
       {/* Main Content */}
       <main className="flex-1 container mx-auto p-4 py-8">
         {/* Show Waiting State if User Joined a Match */}
         {currentMatch && gameState ? (
           <div className="max-w-2xl mx-auto">
             <LobbyWaiting
               matchId={currentMatch.id}
               gameState={gameState}
               isLoading={isLoading}
               onLeaveMatch={() => {
                 // TODO: Implement leave match
               }}
             />
           </div>
         ) : (
           <div className="flex flex-col lg:flex-row gap-8">
           {/* Matches List */}
           <div className="flex-1">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold uppercase">OPEN MATCHES</h2>
               <BrutalButton 
                 variant="primary"
                 onClick={() => {
                   if (!account?.address) {
                     setShowConnectCard(true);
                     return;
                   }
                   setShowCreateModal(true);
                 }}
               >
                 + CREATE MATCH
               </BrutalButton>
             </div>
 
             <div className="grid gap-4">
               {availableMatches.filter(m => m.status === 'WAITING').map((match) => (
                 <motion.div
                   key={match.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.15, ease: 'linear' }}
                 >
                   <BrutalCard className="p-0">
                     <div className="grid md:grid-cols-5 gap-4 p-4 items-center">
                       {/* Match Info */}
                       <div className="md:col-span-2">
                         <p className="font-mono text-xs opacity-50 mb-1">MATCH ID</p>
                         <p className="font-bold uppercase cursor-help" title={match.id}>
                           {shortenId(match.id)}
                         </p>
                       </div>
                       
                       {/* Players */}
                       <div>
                         <p className="font-mono text-xs opacity-50 mb-1">PLAYERS</p>
                         <p className="font-bold">
                           {match.players.length}/{match.maxPlayers}
                         </p>
                       </div>
                       
                       {/* Entry Fee */}
                       <div>
                         <p className="font-mono text-xs opacity-50 mb-1">ENTRY FEE</p>
                         <p className="font-mono font-bold text-lg">{Number(match.entryFee).toFixed(1)} SUI</p>
                       </div>
                       
                       {/* Join Button */}
                       <div className="flex justify-end">
                         <BrutalButton
                           variant="primary"
                           size="sm"
                           onClick={() => handleJoinMatch(match.id)}
                           disabled={isLoading || match.players.length >= match.maxPlayers}
                         >
                           JOIN →
                         </BrutalButton>
                       </div>
                     </div>
                     
                     {/* Player Avatars */}
                     <div className="border-t-[3px] border-foreground p-3 bg-muted flex items-center gap-2">
                       {match.players.map((p) => (
                         <div 
                           key={p.id}
                           className="w-8 h-8 bg-card border-[2px] border-foreground flex items-center justify-center text-xs font-bold"
                           title={p.ensName}
                         >
                           {p.displayName[0]}
                         </div>
                       ))}
                       {Array.from({ length: match.maxPlayers - match.players.length }).map((_, i) => (
                         <div 
                           key={i}
                           className="w-8 h-8 bg-muted border-[2px] border-dashed border-foreground/30"
                         />
                       ))}
                     </div>
                   </BrutalCard>
                 </motion.div>
               ))}
 
               {availableMatches.filter(m => m.status === 'WAITING').length === 0 && (
                 <BrutalCard variant="muted" className="p-12 text-center">
                   <p className="text-lg font-bold uppercase mb-2">NO OPEN MATCHES</p>
                   <p className="font-mono text-sm opacity-70">Create one to start playing</p>
                 </BrutalCard>
               )}
             </div>
           </div>
 
           {/* Sidebar */}
          <div className="lg:w-80 space-y-4">
            

            <BrutalCard variant="dark" className="p-6">
              <h3 className="text-lg font-bold uppercase mb-4">HOW IT WORKS</h3>
              <div className="space-y-4 text-sm font-mono">
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">1</span>
                  <span>Join match & lock entry fee</span>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">2</span>
                  <span>Play rounds instantly</span>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">3</span>
                  <span>Winner settled on-chain</span>
                </div>
              </div>
            </BrutalCard>

            <BrutalCard className="p-6">
              <h3 className="text-lg font-bold uppercase mb-4">YOUR STATS</h3>
              {user ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-mono opacity-50">MATCHES</p>
                    <p className="text-2xl font-bold">{user.totalMatches}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono opacity-50">WIN RATE</p>
                    <p className="text-2xl font-bold">
                      {user.totalMatches > 0 
                        ? Math.round((user.wins / user.totalMatches) * 100) 
                        : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-mono opacity-50">EARNINGS</p>
                    <p className="text-2xl font-bold font-mono">${user.totalEarnings}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono opacity-50">SPENT</p>
                    <p className="text-2xl font-bold font-mono">${user.totalSpent}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-mono opacity-50">MATCHES</p>
                    <p className="text-2xl font-bold">—</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono opacity-50">WIN RATE</p>
                    <p className="text-2xl font-bold">—</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono opacity-50">EARNINGS</p>
                    <p className="text-2xl font-bold font-mono">—</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono opacity-50">SPENT</p>
                    <p className="text-2xl font-bold font-mono">—</p>
                  </div>
                </div>
              )}
                <div className="border-t-[2px] border-foreground/30 mt-4 pt-4">
                <p className="text-xs font-mono opacity-50">SUI BALANCE (Testnet)</p>
                <p className="text-lg font-bold">
                  {suiLoading ? (
                    <span className="opacity-70 text-xs">Loading…</span>
                  ) : suiBalance == null ? (
                    <span className="opacity-70">—</span>
                  ) : (
                    `${suiBalance.toFixed(4)} SUI`
                  )}
                </p>
              </div>
            </BrutalCard>
          </div>
           </div>
         )}
       </main>
 
       {/* Create Match Modal */}
      {/* Connect Wallet Card (neobrutal) */}
      {showConnectCard && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.12 }}
          >
            <BrutalCard className="w-full max-w-sm p-6">
              <h3 className="text-xl font-bold uppercase mb-2">Wallet Required</h3>
              <p className="mb-4 font-mono text-sm opacity-80">Please connect your Sui wallet to create a match.</p>
              <div className="flex gap-4">
                <BrutalButton
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setShowConnectCard(false);
                  }}
                >
                  OK
                </BrutalButton>
              </div>
            </BrutalCard>
          </motion.div>
        </div>
      )}
       {showCreateModal && (
         <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-60">
           <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.1 }}
           >
             <BrutalCard className="w-full max-w-4xl p-10">
               <h2 className="text-2xl font-bold uppercase mb-6">CREATE MATCH</h2>
               
               <div className="space-y-6">
                 <div>
                   <label className="block text-sm font-bold uppercase mb-2">
                     ENTRY FEE (SUI)
                   </label>
                   <div className="flex gap-2">
                     {[0.1, 0.2, 0.3, 0.4].map((fee) => (
                       <button
                         key={fee}
                         onClick={() => setEntryFee(fee)}
                         className={`flex-1 py-3 border-[3px] border-foreground font-bold transition-all ${
                           entryFee === fee 
                             ? 'bg-primary text-primary-foreground' 
                             : 'bg-card hover:bg-muted'
                         }`}
                       >
                        {fee} SUI
                       </button>
                     ))}
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-bold uppercase mb-2">
                     MAX PLAYERS
                   </label>
                   <div className="flex gap-2">
                     {[4, 6, 8].map((num) => (
                       <button
                         key={num}
                         onClick={() => setMaxPlayers(num)}
                         className={`flex-1 py-3 border-[3px] border-foreground font-bold transition-all ${
                           maxPlayers === num 
                             ? 'bg-primary text-primary-foreground' 
                             : 'bg-card hover:bg-muted'
                         }`}
                       >
                         {num}
                       </button>
                     ))}
                   </div>
                 </div>
 
                 <div className="p-4 bg-muted border-[2px] border-foreground">
                   <div className="flex justify-between text-sm font-mono">
                     <span>Prize Pool : </span>
                     <span className="font-bold">{(entryFee * maxPlayers).toFixed(2)} SUI</span>
                   </div>
                 </div>
               </div>
 
               <div className="flex gap-4 mt-8">
                 <BrutalButton
                   variant="outline"
                   className="flex-1"
                   onClick={() => setShowCreateModal(false)}
                 >
                   CANCEL
                 </BrutalButton>
                 <BrutalButton
                   variant="primary"
                   className="flex-1"
                   onClick={handleCreateMatch}
                   disabled={isLoading}
                 >
                   {isLoading ? 'CREATING...' : 'CREATE→'}
                 </BrutalButton>
               </div>
             </BrutalCard>
           </motion.div>
         </div>
       )}
     </div>
   );
 }
