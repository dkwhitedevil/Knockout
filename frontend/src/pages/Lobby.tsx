 import { useState } from 'react';
 import { useNavigate, Link } from 'react-router-dom';
 import { motion } from 'framer-motion';
 import { BrutalButton } from '@/components/ui/BrutalButton';
 import { BrutalCard } from '@/components/ui/BrutalCard';
 import { useGame } from '@/contexts/GameContext';
 
 export default function Lobby() {
   const navigate = useNavigate();
   const { user, availableMatches, joinMatch, createMatch, isLoading } = useGame();
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [entryFee, setEntryFee] = useState(10);
   const [maxPlayers, setMaxPlayers] = useState(4);
 
   const handleCreateMatch = async () => {
     await createMatch(entryFee, maxPlayers);
     navigate('/arena');
   };
 
   const handleJoinMatch = async (matchId: string) => {
     await joinMatch(matchId);
     navigate('/arena');
   };
 
   if (!user) {
     navigate('/login');
     return null;
   }
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       {/* Header */}
       <header className="border-b-[4px] border-foreground p-4">
         <div className="container mx-auto flex items-center justify-between">
           <Link to="/">
             <h1 className="text-2xl font-bold uppercase tracking-tighter">
               LAST HAND<span className="text-primary">_OS</span>
             </h1>
           </Link>
           
           <div className="flex items-center gap-4">
             <Link to="/profile">
               <div className="flex items-center gap-3 px-4 py-2 border-[3px] border-foreground bg-card shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                 <div className="w-8 h-8 bg-primary border-[2px] border-foreground flex items-center justify-center font-bold">
                   {user.displayName[0]}
                 </div>
                 <div>
                   <p className="text-sm font-bold uppercase">{user.displayName}</p>
                   <p className="text-xs font-mono opacity-70">{user.ensName}</p>
                 </div>
               </div>
             </Link>
           </div>
         </div>
       </header>
 
       {/* Main Content */}
       <main className="flex-1 container mx-auto p-4 py-8">
         <div className="flex flex-col lg:flex-row gap-8">
           {/* Matches List */}
           <div className="flex-1">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold uppercase">OPEN MATCHES</h2>
               <BrutalButton 
                 variant="primary"
                 onClick={() => setShowCreateModal(true)}
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
                         <p className="font-bold uppercase">{match.id}</p>
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
                         <p className="font-mono font-bold text-lg">${match.entryFee}</p>
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
             </BrutalCard>
           </div>
         </div>
       </main>
 
       {/* Create Match Modal */}
       {showCreateModal && (
         <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50">
           <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.1 }}
           >
             <BrutalCard className="w-full max-w-md p-8">
               <h2 className="text-2xl font-bold uppercase mb-6">CREATE MATCH</h2>
               
               <div className="space-y-6">
                 <div>
                   <label className="block text-sm font-bold uppercase mb-2">
                     ENTRY FEE (USDC)
                   </label>
                   <div className="flex gap-2">
                     {[5, 10, 25, 50].map((fee) => (
                       <button
                         key={fee}
                         onClick={() => setEntryFee(fee)}
                         className={`flex-1 py-3 border-[3px] border-foreground font-bold transition-all ${
                           entryFee === fee 
                             ? 'bg-primary text-primary-foreground' 
                             : 'bg-card hover:bg-muted'
                         }`}
                       >
                         ${fee}
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
                     <span>Prize Pool (if full)</span>
                     <span className="font-bold">${entryFee * maxPlayers}</span>
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
                   {isLoading ? 'CREATING...' : 'CREATE →'}
                 </BrutalButton>
               </div>
             </BrutalCard>
           </motion.div>
         </div>
       )}
     </div>
   );
 }