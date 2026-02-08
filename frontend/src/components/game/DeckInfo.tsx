import { GameState } from '@/game/state';
import { motion } from 'framer-motion';

interface DeckInfoProps {
  gameState: GameState;
  playerId: string;
}

export function DeckInfo({ gameState, playerId }: DeckInfoProps) {
  const hand = gameState.playerHands[playerId] || [];
  const deck = gameState.playerDecks[playerId] || [];
  const discard = gameState.playerDiscard[playerId] || [];

  return (
    <motion.div
      className="rounded border-2 border-black bg-white p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="mb-3 text-sm font-bold uppercase">Your Deck</h3>

      {/* Deck Status */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold">🎴 Deck</span>
          <span className="text-xs font-mono">{deck.length}</span>
        </div>
        <div className="h-1 w-full border border-black bg-white">
          <div
            className="h-full bg-black transition-all"
            style={{ width: `${Math.min((deck.length / 40) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Hand */}
      <div className="mb-3">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-bold">✋ Hand</span>
          <span className="text-xs font-mono">{hand.length}/5</span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const card = hand[i];
            return (
              <motion.div
                key={i}
                className={`aspect-square rounded border-2 border-black text-xs font-bold flex items-center justify-center ${
                  card
                    ? 'bg-yellow-300 text-black'
                    : 'bg-gray-200 text-gray-400'
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
              >
                {card ? card.type.charAt(0) : '-'}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Discard */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold">🗑️ Discard</span>
        <span className="text-xs font-mono">{discard.length}</span>
      </div>
    </motion.div>
  );
}
