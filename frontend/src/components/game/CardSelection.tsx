/**
 * Card Selection Component
 * Allows players to select and submit a card for the round
 * Uses signature-free submission via session capability
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/contexts/GameContext';
import { GameCard as GameCardType } from '@/lib/gameTypes';
import { GameCard } from './GameCard';
import { BrutalButton } from '@/components/ui/BrutalButton';
import { BrutalCard } from '@/components/ui/BrutalCard';

interface CardSelectionProps {
  matchId: string;
  playerhand: GameCardType[];
  isSubmitted: boolean;
  submittedCard?: GameCardType;
  onSubmit?: () => void;
}

export function CardSelection({
  matchId,
  playerhand,
  isSubmitted,
  submittedCard,
  onSubmit,
}: CardSelectionProps) {
  const { playCard, isLoading } = useGame();
  const [selectedCard, setSelectedCard] = useState<GameCardType | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectCard = (card: GameCardType) => {
    if (isSubmitted) return;
    setSelectedCard(card);
    setShowConfirm(true);
  };

  const handleConfirmCard = async () => {
    if (!selectedCard) return;

    setError(null);

    try {
      await playCard(matchId, selectedCard);
      setShowConfirm(false);
      setSelectedCard(null);
      onSubmit?.();
    } catch (err: any) {
      setError(err.message || 'Failed to submit card');
    }
  };

  const cardTypeColors: Record<string, string> = {
    ATTACK: 'from-red-500/20 to-red-500/10',
    DEFENSE: 'from-blue-500/20 to-blue-500/10',
    TRICK: 'from-purple-500/20 to-purple-500/10',
    SPECIAL: 'from-yellow-500/20 to-yellow-500/10',
  };

  const cardTypeBorders: Record<string, string> = {
    ATTACK: 'border-red-500',
    DEFENSE: 'border-blue-500',
    TRICK: 'border-purple-500',
    SPECIAL: 'border-yellow-500',
  };

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold uppercase">YOUR HAND</h3>
        <div className="px-3 py-1 bg-foreground/5 border-[2px] border-foreground">
          <span className="text-xs font-mono font-bold">
            {isSubmitted ? '✓ SUBMITTED' : 'SELECTING'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-500/10 border-[2px] border-red-500 rounded-lg"
          >
            <p className="text-sm font-mono text-red-500">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hand Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <AnimatePresence mode="popLayout">
          {playerhand.map((card, idx) => (
            <motion.div
              key={`${card.name}-${idx}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: idx * 0.05 }}
            >
              <motion.div
                whileHover={!isSubmitted ? { scale: 1.05 } : {}}
                whileTap={!isSubmitted ? { scale: 0.95 } : {}}
              >
                <button
                  onClick={() => handleSelectCard(card)}
                  disabled={isSubmitted || isLoading}
                  className={`w-full relative group ${
                    isSubmitted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div
                    className={`
                      relative h-32 rounded-lg border-[3px] p-2
                      transition-all duration-200
                      ${cardTypeBorders[card.type]}
                      ${selectedCard?.name === card.name 
                        ? 'ring-4 ring-primary shadow-lg scale-105' 
                        : 'bg-gradient-to-br from-background to-muted'
                      }
                      ${cardTypeColors[card.type]}
                    `}
                  >
                    {/* Card Power */}
                    <div className="absolute top-1 right-1 w-6 h-6 bg-primary text-primary-foreground border-[2px] border-foreground flex items-center justify-center rounded text-xs font-bold">
                      {card.power}
                    </div>

                    {/* Card Type Icon */}
                    <div className="absolute top-1 left-1 px-1 py-0.5 bg-foreground/10 border border-foreground/30 rounded text-[9px] font-bold uppercase">
                      {card.type[0]}
                    </div>

                    {/* Card Name */}
                    <div className="absolute inset-x-1 bottom-1 text-center">
                      <p className="text-xs font-bold uppercase leading-tight line-clamp-2">
                        {card.name}
                      </p>
                    </div>

                    {/* Selected Indicator */}
                    {selectedCard?.name === card.name && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-primary border-[3px] border-foreground rounded-full flex items-center justify-center"
                      >
                        <span className="text-white font-bold">✓</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Hover Effect */}
                  {!isSubmitted && (
                    <div className="absolute inset-0 rounded-lg border-[3px] border-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  )}
                </button>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Submitted State */}
      {isSubmitted && submittedCard && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/10 border-[3px] border-green-500 rounded-lg text-center"
        >
          <p className="text-sm font-bold uppercase mb-2">✓ CARD SUBMITTED</p>
          <p className="text-lg font-mono font-bold">{submittedCard.name}</p>
          <p className="text-xs opacity-70 mt-1">Power: {submittedCard.power}</p>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && selectedCard && !isSubmitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <BrutalCard className="max-w-sm p-8">
                <h2 className="text-2xl font-bold uppercase mb-4">CONFIRM CARD</h2>

                {/* Card Preview */}
                <div className="mb-6 p-4 bg-muted border-[3px] border-foreground rounded-lg text-center">
                  <p className="text-xs font-mono opacity-50 mb-2">SELECTED:</p>
                  <p className="text-2xl font-bold mb-2">{selectedCard.name}</p>
                  <div className="flex justify-around items-center">
                    <span className="font-mono text-sm">
                      Type: <span className="font-bold">{selectedCard.type}</span>
                    </span>
                    <span className="font-mono text-sm">
                      Power: <span className="font-bold text-lg">{selectedCard.power}</span>
                    </span>
                  </div>
                </div>

                {/* Warning */}
                <p className="text-sm font-mono opacity-70 mb-6">
                  ⚡ This will be submitted without wallet signature using your session capability.
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  <BrutalButton
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowConfirm(false)}
                    disabled={isLoading}
                  >
                    CANCEL
                  </BrutalButton>
                  <BrutalButton
                    variant="primary"
                    className="flex-1"
                    onClick={handleConfirmCard}
                    disabled={isLoading}
                  >
                    {isLoading ? 'SUBMITTING...' : 'SUBMIT ✓'}
                  </BrutalButton>
                </div>
              </BrutalCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
