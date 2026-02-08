/**
 * Lobby Waiting Component
 * Shows player count with auto-start indicator
 */

import { motion } from 'framer-motion';
import { BrutalCard } from '@/components/ui/BrutalCard';
import { BrutalButton } from '@/components/ui/BrutalButton';
import { GameState, REQUIRED_PLAYERS } from '@/game/state';

interface LobbyWaitingProps {
  matchId: string;
  gameState: GameState | null;
  isLoading: boolean;
  onLeaveMatch?: () => void;
}

export function LobbyWaiting({
  matchId,
  gameState,
  isLoading,
  onLeaveMatch,
}: LobbyWaitingProps) {
  if (!gameState || gameState.matchId !== matchId) {
    return null;
  }

  const playerCount = gameState.players.length;
  const isStarting = gameState.phase === 'active';
  const playersNeeded = REQUIRED_PLAYERS - playerCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <BrutalCard className="p-8 bg-gradient-to-br from-background to-muted border-[4px] border-primary">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold uppercase mb-2">
              {isStarting ? '🚀 MATCH STARTING!' : 'WAITING FOR PLAYERS'}
            </h2>
            <p className="font-mono text-sm opacity-70">
              {matchId}
            </p>
          </div>

          {/* Player Counter */}
          <div className="flex items-center justify-center gap-4">
            {/* Current Players */}
            <div className="flex gap-2">
              {gameState.players.map((player, idx) => (
                <motion.div
                  key={player.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="w-12 h-12 bg-primary text-primary-foreground border-[3px] border-foreground flex items-center justify-center font-bold rounded-lg"
                >
                  {player.displayName[0]}
                </motion.div>
              ))}
            </div>

            {/* Needed Slots */}
            {!isStarting &&
              Array.from({ length: playersNeeded }).map((_, idx) => (
                <motion.div
                  key={`needed-${idx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-12 h-12 bg-muted border-[3px] border-dashed border-foreground/50 flex items-center justify-center font-bold rounded-lg"
                >
                  ?
                </motion.div>
              ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-foreground/5 border-[2px] border-foreground text-center">
              <p className="text-xs font-mono opacity-50 mb-2">PLAYERS</p>
              <p className="text-3xl font-bold">{playerCount}/{REQUIRED_PLAYERS}</p>
            </div>
            <div className="p-4 bg-foreground/5 border-[2px] border-foreground text-center">
              <p className="text-xs font-mono opacity-50 mb-2">STATUS</p>
              <p className={`text-2xl font-bold ${isStarting ? 'text-green-500' : 'opacity-70'}`}>
                {isStarting ? '✓ ACTIVE' : 'WAITING'}
              </p>
            </div>
          </div>

          {/* Auto-Start Message */}
          {!isStarting && playersNeeded > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-yellow-500/10 border-[2px] border-yellow-500 rounded-lg"
            >
              <p className="font-mono text-sm text-center">
                {playersNeeded === 1
                  ? '⚡ 1 more player → AUTO START'
                  : `⚡ ${playersNeeded} more players → AUTO START`}
              </p>
            </motion.div>
          )}

          {/* Game Starting Animation */}
          {isStarting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-green-500/10 border-[3px] border-green-500 rounded-lg text-center"
            >
              <motion.p
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-xl font-bold uppercase text-green-500"
              >
                MATCH STARTED ✓
              </motion.p>
              <p className="font-mono text-xs mt-2 opacity-70">
                Get ready to play!
              </p>
            </motion.div>
          )}

          {/* Action Button */}
          {!isStarting && onLeaveMatch && (
            <BrutalButton
              variant="outline"
              className="w-full"
              onClick={onLeaveMatch}
              disabled={isLoading}
            >
              {isLoading ? 'LEAVING...' : 'LEAVE MATCH'}
            </BrutalButton>
          )}
        </div>
      </BrutalCard>
    </motion.div>
  );
}
