import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BrutalButton } from '@/components/ui/BrutalButton';
import { BrutalCard } from '@/components/ui/BrutalCard';
import { GameCard } from '@/components/game/GameCard';
import { CardSelection } from '@/components/game/CardSelection';
import { PlayerSlot } from '@/components/game/PlayerSlot';
import { SessionWalletDisplay } from '@/components/game/SessionWallet';
import { Timer } from '@/components/game/Timer';
import { DeckInfo } from '@/components/game/DeckInfo';
import { useGame } from '@/contexts/GameContext';
import { GameCard as GameCardType, GameAction } from '@/game/types'; // Use centralized GameAction type
import { MAX_ROUND_TIME, getActivePlayers } from '@/game/state';
import {
  playAttack,
  playDefense,
  playDamage,
  playElimination,
  playVictory,
  playRoundStart,
  playSelect,
  playSubmit,
  soundManager,
} from '@/lib/sounds';

type ArenaPhase = 'WAITING' | 'SELECTING' | 'RESOLVING' | 'ROUND_END' | 'GAME_END';

export default function Arena() {
  const navigate = useNavigate();
  const { user, session, currentMatch, gameState, playCard, leaveMatch, dispatchGameAction } = useGame();
  const [phase, setPhase] = useState<ArenaPhase>('WAITING');
  const [selectedCard, setSelectedCard] = useState<GameCardType | null>(null);
  const [playerCards, setPlayerCards] = useState<GameCardType[]>([]);
  const [roundTimer, setRoundTimer] = useState(MAX_ROUND_TIME);
  const [roundLog, setRoundLog] = useState<string[]>([]);
  const [showDamageNumbers, setShowDamageNumbers] = useState<Record<string, number>>({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({});

  // Initialize game and round timer
  useEffect(() => {
    if (!currentMatch || !user) {
      // Removed redirection to '/lobby' to allow access to '/arena'
      return;
    }

    // Initialize game on first load
    if (gameState?.phase === 'active' && phase === 'WAITING') {
      setPhase('SELECTING');
      setRoundLog([`ROUND ${gameState.round} BEGIN`]);
      soundManager.setMute(!soundEnabled);
      playRoundStart();

      // Get player's hand from game state
      const hand = gameState.playerHands[user?.id || ''] || [];
      setPlayerCards(hand);
    }

    // Update player cards when hand changes
    if (gameState?.phase === 'active' && phase === 'SELECTING') {
      const hand = gameState.playerHands[user?.id || ''] || [];
      setPlayerCards(hand);
    }
  }, [currentMatch, user, gameState?.phase, gameState?.playerHands, phase, navigate, soundEnabled]);

  // Round timer countdown
  useEffect(() => {
    if (phase !== 'SELECTING' || !gameState) return;

    const interval = setInterval(() => {
      setRoundTimer((prev) => {
        if (prev <= 1) {
          // Auto-resolve round when timer expires
          handleResolveRound();
          return MAX_ROUND_TIME;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, gameState]);

  // Check if all players submitted or timeout
  const handleResolveRound = async () => {
    if (!gameState) return;

    const activePlayers = getActivePlayers(gameState);
    const submitted = Object.keys(gameState.submissions);

    // If not all submitted, eliminate non-submitters
    if (submitted.length < activePlayers.length) {
      const didNotSubmit = activePlayers
        .filter(p => !submitted.includes(p.id))
        .map(p => p.id);

      didNotSubmit.forEach(playerId => {
        dispatchGameAction({ type: 'AUTO_TIMEOUT' });
        playElimination();
      });
    }

    // Reveal cards with animation and sounds
    setRevealedCards({});
    Object.entries(gameState.submissions).forEach(([playerId, card], index) => {
      setTimeout(() => {
        setRevealedCards((prev) => ({ ...prev, [playerId]: true }));
        // Play sound based on card type
        if (card.type === 'ATTACK') {
          playAttack();
        } else if (card.type === 'DEFENSE') {
          playDefense();
        } else if (card.type === 'SPECIAL') {
          playAttack();
        }
      }, index * 200);
    });

    // Resolve round (apply damage)
    dispatchGameAction({ type: 'RESOLVE_ROUND' });

    // Show damage for a moment with sound
    if (gameState.resolvedEffects && gameState.resolvedEffects.length > 0) {
      const damageMap: Record<string, number> = {};
      gameState.resolvedEffects.forEach((effect, index) => {
        damageMap[effect.to] = effect.damage;
        // Play damage sound with slight delay
        setTimeout(() => {
          if (effect.damage > 0) {
            playDamage();
          }
        }, index * 150 + 500);
      });
      setShowDamageNumbers(damageMap);

      setTimeout(() => {
        setShowDamageNumbers({});
      }, 1500);
    }

    setPhase('RESOLVING');

    // Automatic resolution animation
    await new Promise(r => setTimeout(r, 1500));

    // Check for new eliminations and update log
    const activeBefore = getActivePlayers(gameState);
    const activeAfter = getActivePlayers(gameState);

    if (activeAfter.length < activeBefore.length) {
      const eliminated = activeBefore
        .filter(p => !activeAfter.find(a => a.id === p.id))
        .map(p => p.displayName);
      
      // Play elimination sound for each eliminated player
      eliminated.forEach((_, index) => {
        setTimeout(() => {
          playElimination();
        }, index * 300);
      });
      
      setRoundLog((prev) => [
        ...prev,
        `ROUND ${gameState.round} RESOLVED`,
        `❌ ELIMINATED: ${eliminated.join(', ')}`,
      ]);
    } else {
      setRoundLog((prev) => [...prev, `ROUND ${gameState.round} RESOLVED`]);
    }

    setPhase('ROUND_END');

    // Check for game end (only 1 player remains)
    if (activeAfter.length === 1) {
      // Play victory sound
      setTimeout(() => {
        playVictory();
      }, 500);
      
      setPhase('GAME_END');
      setRoundLog((prev) => [...prev, 'MATCH COMPLETE', `🏆 WINNER: ${activeAfter[0].displayName}`]);
    } else if (gameState.round >= gameState.totalRounds) {
      // Time limit reached - highest health wins
      const winner = activeAfter.reduce((prev, current) =>
        (prev.health || 0) > (current.health || 0) ? prev : current
      );
      
      setTimeout(() => {
        playVictory();
      }, 500);
      
      setPhase('GAME_END');
      setRoundLog((prev) => [...prev, 'MAX ROUNDS REACHED', `🏆 WINNER: ${winner.displayName}`]);
      dispatchGameAction({ type: 'FINISH_GAME', winnerId: winner.id });
    } else {
      // Advance to next round
      setTimeout(() => {
        dispatchGameAction({ type: 'ADVANCE_ROUND' });
        setPhase('SELECTING');
        setRoundTimer(MAX_ROUND_TIME);
        setRoundLog((prev) => [...prev, `ROUND ${(gameState.round || 0) + 1} BEGIN`]);
      }, 2000);
    }
  };

  // Check if game has ended (only 1 player remains)
  useEffect(() => {
    if (!gameState) return;

    const activePlayers = getActivePlayers(gameState);

    if (activePlayers.length === 1 && phase !== 'GAME_END') {
      setPhase('GAME_END');
      setRoundLog((prev) => [...prev, 'MATCH COMPLETE', `🏆 WINNER: ${activePlayers[0].displayName}`]);
      dispatchGameAction({ type: 'FINISH_GAME', winnerId: activePlayers[0].id });
    }
  }, [gameState?.eliminated, phase, gameState, dispatchGameAction]);

  // Simulate backend actions and award winner
  useEffect(() => {
    if (phase === 'GAME_END') {
      return;
    }

    const simulateGame = async () => {
      // Mock backend actions
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
      console.log('Mock backend: Resolving round...');

      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
      console.log('Mock backend: Calculating winner...');

      // Award winner
      const winner = gameState?.players[0]; // Mock winner selection
      console.log(`Winner is ${winner?.id}. Awarding 0.4 SUI.`);

      // Send winning amount to the specified address
      const winningAddress = '0xed2b6052bdb36c988b415500da287699fbdb25823a1e50e5d46b134eb72ee8ad';
      console.log(`Sending 0.4 SUI to ${winningAddress}`);

      setPhase('GAME_END');
    };

    if (phase === 'RESOLVING') {
      simulateGame();
    }
  }, [phase, gameState]);

  const handleLeave = () => {
    if (currentMatch) {
      leaveMatch(currentMatch.id);
    }
    navigate('/lobby');
  };

  const handleSettlement = () => {
    navigate('/settlement');
  };

  // AI Player Logic
  useEffect(() => {
    if (phase === 'SELECTING' && gameState) {
      const aiPlayers = gameState.players.filter(player => player.id !== user.id);

      aiPlayers.forEach((aiPlayer, index) => {
        setTimeout(() => {
          if (!gameState.submissions[aiPlayer.id]) {
            const randomCard = playerCards[Math.floor(Math.random() * playerCards.length)];
            dispatchGameAction({
              type: 'SUBMIT_CARD',
              playerId: aiPlayer.id,
              card: randomCard,
            });
          }
        }, index * 1000); // AI players submit cards with a delay
      });
    }
  }, [phase, gameState, playerCards, dispatchGameAction, user.id]);

  // Automatically start a match when the Arena page is loaded if currentMatch or gameState is null
  useEffect(() => {
    if (!currentMatch) {
      console.log('No current match found. Creating a new match...');
      dispatchGameAction({ type: 'CREATE_MATCH', payload: { maxPlayers: 4 } } as GameAction); // Explicit cast
    }

    if (!gameState) {
      console.log('No game state found. Initializing game state...');
      dispatchGameAction({ type: 'INITIALIZE_GAME' } as GameAction); // Explicit cast
    }
  }, [currentMatch, gameState, dispatchGameAction]);

  if (!currentMatch || !user || !gameState) {
    console.log('Debugging Arena Page:');
    console.log('currentMatch:', currentMatch);
    console.log('user:', user);
    console.log('gameState:', gameState);
    return <div className="flex items-center justify-center h-screen">Loading game...</div>;
  }

  const activePlayers = getActivePlayers(gameState);
  const isUserWinner = phase === 'GAME_END' && activePlayers[0]?.id === user.id;

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
                MATCH IN PROGRESS
              </h1>
              <p className="font-mono text-xs opacity-70">
                Round {gameState?.round}/{currentMatch.totalRounds} • {activePlayers.length} players alive
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {phase === 'SELECTING' && (
              <Timer 
                seconds={roundTimer} 
                onComplete={handleResolveRound}
                isRunning={phase === 'SELECTING'}
              />
            )}
            
            {/* Sound Toggle */}
            <BrutalButton
              variant={soundEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                const newState = !soundEnabled;
                setSoundEnabled(newState);
                soundManager.setMute(!newState);
                if (newState) playSelect();
              }}
              className="min-w-[40px]"
            >
              {soundEnabled ? '🔊' : '🔇'}
            </BrutalButton>
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
                  className={
                    log.includes('ROUND') && log.includes('BEGIN')
                      ? 'text-primary font-bold'
                      : log.includes('WINNER')
                      ? 'text-success font-bold'
                      : log.includes('ELIMINATED')
                      ? 'text-destructive'
                      : 'opacity-70'
                  }
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
              .map((player) => {
                const playerState = gameState.players.find(ps => ps.id === player.id);
                const isEliminated = gameState.eliminated.includes(player.id);
                const damage = showDamageNumbers[player.id];
                const submittedCard = gameState.submissions[player.id];
                const isRevealed = revealedCards[player.id];

                return (
                  <div key={player.id} className="relative">
                    <div className="relative h-40">
                      <PlayerSlot 
                        player={playerState || player}
                        showCard={phase === 'RESOLVING' || phase === 'ROUND_END'}
                      />
                      
                      {/* Card Reveal Animation */}
                      {isRevealed && submittedCard && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          initial={{ rotateY: 0 }}
                          animate={{ rotateY: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <div className={`w-20 h-28 border-[3px] border-foreground flex flex-col items-center justify-center font-bold text-xs text-center p-2 ${
                            submittedCard.type === 'ATTACK' ? 'bg-destructive' :
                            submittedCard.type === 'DEFENSE' ? 'bg-success' :
                            submittedCard.type === 'TRICK' ? 'bg-warning' :
                            'bg-primary'
                          }`}>
                            <div className="text-2xl mb-1">
                              {submittedCard.type === 'ATTACK' ? '⚔️' :
                               submittedCard.type === 'DEFENSE' ? '🛡️' :
                               submittedCard.type === 'TRICK' ? '✨' :
                               '⭐'}
                            </div>
                            <div className="uppercase leading-tight">{submittedCard.type}</div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Health Bar */}
                    <div className="mt-2">
                      <div className="w-32 h-4 border-[2px] border-foreground bg-muted">

                        <motion.div
                          className={`h-full ${playerState?.health === 0 ? 'bg-destructive' : 'bg-success'}`}
                          animate={{
                            width: `${((playerState?.health || 0) / (playerState?.maxHealth || 20)) * 100}%`,
                          }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-xs font-bold text-center mt-1">
                        {playerState?.health}/{playerState?.maxHealth} HP
                      </p>
                    </div>
                    {/* Damage Number */}
                    {damage && damage > 0 && (
                      <motion.div
                        className="absolute top-0 right-0 text-2xl font-bold text-destructive"
                        initial={{ y: 0, opacity: 1 }}
                        animate={{ y: -30, opacity: 0 }}
                        transition={{ duration: 1 }}
                      >
                        -{damage}
                      </motion.div>
                    )}
                    {/* Eliminated Badge */}
                    {isEliminated && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 border-[2px] border-destructive">
                        <p className="text-sm font-bold text-destructive">ELIMINATED</p>
                      </div>
                    )}
                  </div>
                );
              })}
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
                    <p className="font-mono">
                      {activePlayers.length}/4 players ready
                    </p>
                  </BrutalCard>
                </motion.div>
              )}

              {phase === 'SELECTING' && (
                <motion.div
                  key="selecting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 w-full"
                >
                  <CardSelection
                    matchId={currentMatch!.id}
                    playerhand={playerCards}
                    isSubmitted={!!gameState?.submissions[user?.id || '']}
                    submittedCard={gameState?.submissions[user?.id || ''] as GameCardType}
                    onSubmit={() => {
                      playSubmit();
                    }}
                  />
                </motion.div>
              )}

              {phase === 'RESOLVING' && (
                <motion.div
                  key="resolving"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <BrutalCard variant="dark" className="p-8">
                    <p className="text-3xl font-bold uppercase animate-pulse-brutal">
                      RESOLVING...
                    </p>
                    <p className="text-sm font-mono mt-4 opacity-70">
                      Calculating damage and effects
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
                  <BrutalCard className="p-8">
                    <p className="text-2xl font-bold uppercase text-primary mb-4">
                      ROUND {gameState?.round} COMPLETE
                    </p>
                    <p className="font-mono text-sm opacity-70">
                      {activePlayers.length} players remaining
                    </p>
                  </BrutalCard>
                </motion.div>
              )}

              {phase === 'GAME_END' && (
                <motion.div
                  key="game-end"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <BrutalCard variant={isUserWinner ? 'accent' : 'dark'} className="p-8">
                    <p className="text-4xl font-bold uppercase mb-4">
                      {isUserWinner ? '🎉 YOU WIN! 🎉' : 'GAME OVER'}
                    </p>
                    <p className="font-mono text-xl mb-6">
                      Winner: {activePlayers[0]?.displayName}
                    </p>
                    {isUserWinner && (
                      <>
                        <p className="font-mono text-lg mb-6 text-success">
                          Prize: ${currentMatch.prizePool}
                        </p>
                        <BrutalButton 
                          variant="default" 
                          size="lg"
                          onClick={handleSettlement}
                        >
                          SETTLE ON-CHAIN →
                        </BrutalButton>
                      </>
                    )}
                  </BrutalCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel - Players */}
        <div className="space-y-4">
          <BrutalCard className="p-4">
            <h3 className="text-sm font-bold uppercase mb-3 border-b-[2px] border-foreground pb-2">
              PLAYERS ({activePlayers.length}/{currentMatch.maxPlayers})
            </h3>
            <div className="space-y-2">
              {gameState.players.map((playerState) => {
                const isEliminated = gameState.eliminated.includes(playerState.id);
                const isUser = playerState.id === user.id;

                return (
                  <div 
                    key={playerState.id}
                    className={`flex items-center gap-2 p-2 border-[2px] border-foreground ${
                      isEliminated
                        ? 'bg-muted opacity-50 line-through'
                        : isUser
                        ? 'bg-primary'
                        : 'bg-card'
                    }`}
                  >
                    {isEliminated ? (
                      <div className="text-xs font-bold">❌</div>
                    ) : (
                      <div className={`w-2 h-2 ${playerState.isConnected ? 'bg-success' : 'bg-muted'}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold uppercase truncate">{playerState.displayName}</p>
                      <p className="text-xs font-mono opacity-70 truncate">{playerState.ensName}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono font-bold ${playerState.health === 0 ? 'text-destructive' : ''}`}>
                        {playerState.health} HP
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </BrutalCard>

          {/* Deck Info */}
          {user && gameState && <DeckInfo gameState={gameState} playerId={user.id} />}

          {/* Card Types Legend */}
          <BrutalCard variant="muted" className="p-4">
            <h3 className="text-sm font-bold uppercase mb-3">CARD TYPES</h3>
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-destructive border border-foreground" />
                <span>ATTACK −5 HP</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success border border-foreground" />
                <span>DEFENSE −4 DMG</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-warning border border-foreground" />
                <span>TRICK −2 DMG</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary border border-foreground" />
                <span>SPECIAL −10 HP</span>
              </div>
            </div>
          </BrutalCard>
        </div>
      </main>
    </div>
  );
}