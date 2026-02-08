/**
 * Deck Management Utilities
 * Handles shuffling, drawing, and deck operations
 */

import { GameCard } from '@/lib/gameTypes';

/**
 * Fisher-Yates shuffle algorithm
 * Mutates array in-place for efficiency
 */
export function shuffleDeck(deck: GameCard[]): GameCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Draw a single card from deck
 * Returns [card, remainingDeck]
 */
export function drawCard(deck: GameCard[]): [GameCard | null, GameCard[]] {
  if (deck.length === 0) {
    return [null, []];
  }
  const card = deck[0];
  const remaining = deck.slice(1);
  return [card, remaining];
}

/**
 * Draw multiple cards from deck
 * Returns [cards, remainingDeck]
 */
export function drawCards(deck: GameCard[], count: number): [GameCard[], GameCard[]] {
  const drawn: GameCard[] = [];
  let remaining = [...deck];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const [card, newRemaining] = drawCard(remaining);
    if (card) {
      drawn.push(card);
      remaining = newRemaining;
    }
  }

  return [drawn, remaining];
}

/**
 * Create a full 40-card deck (10 of each type)
 * Card power is randomized for variety
 */
export function createFullDeck(): GameCard[] {
  const types: ('ATTACK' | 'DEFENSE' | 'TRICK' | 'SPECIAL')[] = [
    'ATTACK',
    'DEFENSE',
    'TRICK',
    'SPECIAL',
  ];

  const deck: GameCard[] = [];
  let cardId = 0;

  types.forEach((type) => {
    for (let i = 0; i < 10; i++) {
      const powerMap = {
        ATTACK: 15 + Math.floor(Math.random() * 5),    // 15-20
        DEFENSE: 12 + Math.floor(Math.random() * 5),   // 12-17
        TRICK: 8 + Math.floor(Math.random() * 3),      // 8-11
        SPECIAL: 20 + Math.floor(Math.random() * 5),   // 20-25
      };

      const nameMap = {
        ATTACK: ['STRIKE', 'SLASH', 'PUMMEL', 'JABB', 'CRUSH'][i % 5],
        DEFENSE: ['SHIELD', 'GUARD', 'BLOCK', 'WALL', 'PARRY'][i % 5],
        TRICK: ['DODGE', 'FEINT', 'DRAIN', 'FROST', 'SMOKE'][i % 5],
        SPECIAL: ['POWER', 'SURGE', 'CHAOS', 'INFERNO', 'STORM'][i % 5],
      };

      deck.push({
        id: `${type}-${cardId++}`,
        type: type as 'ATTACK' | 'DEFENSE' | 'TRICK' | 'SPECIAL',
        power: powerMap[type],
        name: nameMap[type],
        description: getCardDescription(type),
      });
    }
  });

  return shuffleDeck(deck);
}

/**
 * Get card description by type
 */
function getCardDescription(type: string): string {
  const descriptions: Record<string, string> = {
    ATTACK: 'Deal 5 damage to all opponents',
    DEFENSE: 'Block 4 damage this round',
    TRICK: 'Deal 2 damage and confuse',
    SPECIAL: 'Deal 10 damage to all',
  };
  return descriptions[type] || 'Unknown card effect';
}

/**
 * Reshuffle discard pile back into deck
 */
export function reshuffleDiscard(
  deck: GameCard[],
  discard: GameCard[]
): [GameCard[], GameCard[]] {
  if (deck.length > 0) {
    return [deck, discard];
  }
  // If deck is empty, reshuffle discard and clear it
  const newDeck = shuffleDeck(discard);
  return [newDeck, []];
}

/**
 * Add card to hand
 */
export function addCardToHand(hand: GameCard[], card: GameCard): GameCard[] {
  return [...hand, card];
}

/**
 * Remove card from hand
 */
export function removeCardFromHand(hand: GameCard[], cardId: string): GameCard[] {
  return hand.filter(c => c.id !== cardId);
}

/**
 * Validate deck integrity
 */
export function isDeckValid(deck: GameCard[]): boolean {
  return Array.isArray(deck) && deck.every(card => 
    card.id && card.type && card.power && card.name
  );
}
