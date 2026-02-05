import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BrutalButton } from '@/components/ui/BrutalButton';
import { BrutalCard } from '@/components/ui/BrutalCard';
import { GameCard } from '@/components/game/GameCard';
import { PlayerSlot } from '@/components/game/PlayerSlot';
import { SessionWalletDisplay } from '@/components/game/SessionWallet';
import { Timer } from '@/components/game/Timer';
import { useGame } from '@/contexts/GameContext';
import { GameCard as GameCardType } from '@/lib/gameTypes';

type GamePhase = 'WAITING' | 'SELECTING' | 'REVEALING' | 'ROUND_END' | 'GAME_END';

export default function Arena() {
  const navigate = useNavigate();
  const { user, session, currentMatch, playCard, startMatch, leaveMatch } = useGame();
  const [phase, setPhase] = useState<GamePhase>('WAITING');
  const [selectedCard, setSelectedCard] = useState<GameCardType | null>(null);
  const [playerCards, setPlayerCards] = useState<GameCardType[]>([]);
  const [roundTimer, setRoundTimer] = useState(15);
  const [currentRound, setCurrentRound] = useState(0);
  const [roundLog, setRoundLog] = useState<string[]>([]);

  useEffect(() => {
    if (!currentMatch || !user) {
      navigate('/lobby');
      return;
    }
    // TODO: Initialize player cards from match data
    setPlayerCards([]);
  }, [currentMatch, user, navigate]);

  const handleStartGame = () => {
    startMatch();
    setPhase('SELECTING');
    setCurrentRound(1);
    setRoundLog(['ROUND 1 BEGIN']);
  };

  const handleSelectCard = (card: GameCardType) => {
    if (phase !== 'SELECTING') return;
    setSelectedCard(card);
    playCard(card);
  };

  const handleLockCard = () => {
    if (!selectedCard) return;
    setPhase('REVEALING');
    
    // Simulate round resolution
    setTimeout(() => {
      setRoundLog(prev => [
        ...prev,
        `YOU played ${selectedCard.name}`,
        `VIPER.ETH played BLOCK`,
        `SHADOW.ETH played STRIKE`,
        `Damage dealt: -15 HP to SHADOW.ETH`,
      ]);
      
      // Remove used card and draw new one
      setPlayerCards(prev => {
        const remaining = prev.filter(c => c.id !== selectedCard.id);
        // TODO: Draw new card from deck
        return remaining;
      });
      
      setSelectedCard(null);
      setPhase('ROUND_END');
      
      setTimeout(() => {
        if (currentRound < 5) {
          setCurrentRound(prev => prev + 1);
          setRoundLog(prev => [...prev, `ROUND ${currentRound + 1} BEGIN`]);
          setPhase('SELECTING');
          setRoundTimer(15);
        } else {
          setPhase('GAME_END');
        }
      }, 2000);
    }, 2000);
  };

  const handleLeave = () => {
    leaveMatch();
    navigate('/lobby');
  };

  const handleSettlement = () => {
    navigate('/settlement');
  };
 
   if (!currentMatch || !user) return null;
 
   const isHost = currentMatch.players[0]?.id === user.id;
   const canStart = currentMatch.players.length >= currentMatch.minPlayers && phase === 'WAITING';
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       {/* Header */}
       <header className="border-b-[4px] border-foreground p-3">
         <div className="container mx-auto flex items-center justify-between">
           <div className="flex items-center gap-4">
             <Link to="/lobby" onClick={handleLeave}>
               <BrutalButton variant="outline" size="sm">
                 ← EXIT
               </BrutalButton>
             </Link>
             <div>
               <h1 className="text-xl font-bold uppercase tracking-tighter">
                 MATCH: {currentMatch.id}
               </h1>
               <p className="font-mono text-xs opacity-70">
                 Round {currentRound}/{currentMatch.totalRounds} • Prize Pool: ${currentMatch.prizePool}
               </p>
             </div>
           </div>
           
           <div className="flex items-center gap-4">
             {phase === 'SELECTING' && (
               <Timer 
                 seconds={roundTimer} 
                 onComplete={() => handleLockCard()}
                 isRunning={phase === 'SELECTING'}
               />
             )}
           </div>
         </div>
       </header>
 
       {/* Main Arena */}
       <main className="flex-1 container mx-auto p-4 grid lg:grid-cols-4 gap-4">
         {/* Left Panel - Session & Log */}
         <div className="space-y-4">
           {session && <SessionWalletDisplay session={session} />}
           
           <BrutalCard className="p-4 h-64 overflow-hidden">
             <h3 className="text-sm font-bold uppercase mb-3 border-b-[2px] border-foreground pb-2">
               BATTLE LOG
             </h3>
             <div className="space-y-1 text-xs font-mono overflow-y-auto h-48">
               {roundLog.map((log, i) => (
                 <motion.p
                   key={i}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   className={log.includes('ROUND') ? 'text-primary font-bold' : 'opacity-70'}
                 >
                   {log}
                 </motion.p>
               ))}
             </div>
           </BrutalCard>
         </div>
 
         {/* Center - Battle Area */}
         <div className="lg:col-span-2 flex flex-col">
           {/* Opponents */}
           <div className="flex justify-center gap-4 mb-8">
             {currentMatch.players
               .filter(p => p.id !== user.id)
               .slice(0, 3)
               .map((player) => (
                 <PlayerSlot 
                   key={player.id} 
                   player={player}
                   showCard={phase === 'REVEALING' || phase === 'ROUND_END'}
                 />
               ))}
           </div>
 
           {/* Center Area */}
           <div className="flex-1 flex items-center justify-center">
             <AnimatePresence mode="wait">
               {phase === 'WAITING' && (
                 <motion.div
                   key="waiting"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="text-center"
                 >
                   <BrutalCard variant="accent" className="p-8">
                     <p className="text-2xl font-bold uppercase mb-4">
                       WAITING FOR PLAYERS
                     </p>
                     <p className="font-mono mb-6">
                       {currentMatch.players.length}/{currentMatch.minPlayers} players needed
                     </p>
                     {isHost && canStart && (
                       <BrutalButton 
                         variant="default" 
                         size="lg"
                         onClick={handleStartGame}
                       >
                         START MATCH →
                       </BrutalButton>
                     )}
                     {isHost && !canStart && (
                       <p className="text-sm font-mono opacity-70">
                         Waiting for more players...
                       </p>
                     )}
                   </BrutalCard>
                 </motion.div>
               )}
 
               {phase === 'SELECTING' && (
                 <motion.div
                   key="selecting"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="text-center"
                 >
                   <p className="text-2xl font-bold uppercase mb-2">
                     SELECT YOUR CARD
                   </p>
                   <p className="font-mono text-sm opacity-70 mb-4">
                     All players choose simultaneously
                   </p>
                   {selectedCard && (
                     <BrutalButton 
                       variant="primary" 
                       size="lg"
                       onClick={handleLockCard}
                     >
                       LOCK {selectedCard.name} →
                     </BrutalButton>
                   )}
                 </motion.div>
               )}
 
               {phase === 'REVEALING' && (
                 <motion.div
                   key="revealing"
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="text-center"
                 >
                   <BrutalCard variant="dark" className="p-8">
                     <p className="text-3xl font-bold uppercase animate-pulse-brutal">
                       RESOLVING...
                     </p>
                   </BrutalCard>
                 </motion.div>
               )}
 
               {phase === 'ROUND_END' && (
                 <motion.div
                   key="round-end"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="text-center"
                 >
                   <p className="text-2xl font-bold uppercase text-primary">
                     ROUND {currentRound} COMPLETE
                   </p>
                 </motion.div>
               )}
 
               {phase === 'GAME_END' && (
                 <motion.div
                   key="game-end"
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="text-center"
                 >
                   <BrutalCard variant="accent" className="p-8">
                     <p className="text-4xl font-bold uppercase mb-4">
                       YOU WIN!
                     </p>
                     <p className="font-mono text-xl mb-6">
                       Prize: ${currentMatch.prizePool}
                     </p>
                     <BrutalButton 
                       variant="default" 
                       size="lg"
                       onClick={handleSettlement}
                     >
                       SETTLE ON-CHAIN →
                     </BrutalButton>
                   </BrutalCard>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
 
           {/* Your Info */}
           <div className="flex justify-center mb-4">
             <PlayerSlot 
               player={currentMatch.players.find(p => p.id === user.id)}
               isCurrentUser
             />
           </div>
 
           {/* Your Hand */}
           <div className="border-t-[4px] border-foreground pt-4">
             <p className="text-sm font-bold uppercase mb-3 text-center">YOUR HAND</p>
             <div className="flex justify-center gap-3 flex-wrap">
               {playerCards.map((card) => (
                 <GameCard
                   key={card.id}
                   card={card}
                   isSelected={selectedCard?.id === card.id}
                   isDisabled={phase !== 'SELECTING'}
                   onClick={() => handleSelectCard(card)}
                   size="md"
                 />
               ))}
             </div>
           </div>
         </div>
 
         {/* Right Panel - Players */}
         <div className="space-y-4">
           <BrutalCard className="p-4">
             <h3 className="text-sm font-bold uppercase mb-3 border-b-[2px] border-foreground pb-2">
               PLAYERS ({currentMatch.players.length}/{currentMatch.maxPlayers})
             </h3>
             <div className="space-y-2">
               {currentMatch.players.map((player) => (
                 <div 
                   key={player.id}
                   className={`flex items-center gap-3 p-2 border-[2px] border-foreground ${
                     player.id === user.id ? 'bg-primary' : 'bg-card'
                   }`}
                 >
                   <div className={`w-2 h-2 ${player.isConnected ? 'bg-success' : 'bg-muted'}`} />
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold uppercase truncate">{player.displayName}</p>
                     <p className="text-xs font-mono opacity-70 truncate">{player.ensName}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-mono font-bold">{player.health}</p>
                     <p className="text-[10px] opacity-50">HP</p>
                   </div>
                 </div>
               ))}
             </div>
           </BrutalCard>
 
           {/* Card Types Legend */}
           <BrutalCard variant="muted" className="p-4">
             <h3 className="text-sm font-bold uppercase mb-3">CARD TYPES</h3>
             <div className="space-y-2 text-xs font-mono">
               <div className="flex items-center gap-2">
                 <div className="w-4 h-4 bg-destructive border border-foreground" />
                 <span>ATTACK - Deal damage</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-4 h-4 bg-success border border-foreground" />
                 <span>DEFENSE - Block damage</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-4 h-4 bg-warning border border-foreground" />
                 <span>TRICK - Special effects</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-4 h-4 bg-primary border border-foreground" />
                 <span>SPECIAL - Unique powers</span>
               </div>
             </div>
           </BrutalCard>
         </div>
       </main>
     </div>
   );
 }