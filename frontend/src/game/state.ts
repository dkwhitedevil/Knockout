/**
 * Yellow SDK Game State
 * Authoritative state reducer for match gameplay
 */

import { GameCard, Player } from '@/lib/gameTypes';
import { createFullDeck, drawCards } from '@/lib/deckUtils';
import { GameAction } from './types'; // Use centralized GameAction type

export const REQUIRED_PLAYERS = 4;
export const MAX_PLAYERS = 4;
export const STARTING_HEALTH = 20;
export const MAX_ROUND_TIME = 15; // seconds
export const HAND_SIZE = 5; // Cards per player
export const DRAW_PER_ROUND = 1; // Cards drawn per round

export type GamePhase = 'lobby' | 'active' | 'ended';

export interface PlayerState extends Player {
  health: number;
  maxHealth: number;
  hasPaid: boolean; // Indicates if the player has paid
}

export type GameState = {
  matchId: string;
  phase: GamePhase;
  round: number;
  totalRounds: number;
  maxPlayers: number; // Add maxPlayers to GameState
  players: Array<PlayerState>;
  submissions: Record<string, GameCard>;
  eliminated: string[];
  roundStartTime?: number;
  roundTimeoutAt?: number;
  resolvedEffects?: Array<{
    from: string;
    to: string;
    type: string;
    damage: number;
  }>;
  // Deck management
  playerDecks: Record<string, GameCard[]>;     // Remaining cards in deck
  playerHands: Record<string, GameCard[]>;     // Cards in hand
  playerDiscard: Record<string, GameCard[]>;   // Played/discarded cards
  winner?: string;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
}

/**
 * Create the initial game state
 */
export function createInitialState(
  matchId: string,
  firstPlayer: Player
): GameState {
  const playerState: PlayerState = {
    ...firstPlayer,
    health: STARTING_HEALTH,
    maxHealth: STARTING_HEALTH,
    hasPaid: false,
  };

  return {
    matchId,
    phase: 'lobby',
    round: 0,
    totalRounds: 5,
    maxPlayers: MAX_PLAYERS, // Initialize maxPlayers
    players: [playerState],
    submissions: {},
    eliminated: [],
    resolvedEffects: [],
    playerDecks: {},
    playerHands: {},
    playerDiscard: {},
    createdAt: Date.now(),
  };
}

/**
 * Check if game should auto-start
 * Pure function: no side effects
 */
export function shouldStartGame(state: GameState): boolean {
  return (
    state.phase === 'lobby' &&
    state.players.length === REQUIRED_PLAYERS
  );
}

/**
 * Transition state to active when 4 players have joined
 * Called after every join action
 */
export function maybeStartGame(state: GameState): GameState {
  if (!shouldStartGame(state)) {
    return state;
  }

  const now = Date.now();
  
  // Initialize deck and hands for all players
  const playerDecks: Record<string, GameCard[]> = {};
  const playerHands: Record<string, GameCard[]> = {};
  const playerDiscard: Record<string, GameCard[]> = {};

  state.players.forEach((player) => {
    // Each player gets a shuffled deck
    const fullDeck = createFullDeck();
    // Draw starting hand
    const [startingHand, remainingDeck] = drawCards(fullDeck, HAND_SIZE);
    
    playerDecks[player.id] = remainingDeck;
    playerHands[player.id] = startingHand;
    playerDiscard[player.id] = [];
  });

  return {
    ...state,
    phase: 'active',
    round: 1,
    submissions: {},
    resolvedEffects: [],
    roundStartTime: now,
    roundTimeoutAt: now + MAX_ROUND_TIME * 1000,
    startedAt: now,
    playerDecks,
    playerHands,
    playerDiscard,
  };
}

/**
 * Get players still in game (not eliminated)
 */
export function getActivePlayers(state: GameState): PlayerState[] {
  return state.players.filter(p => !state.eliminated.includes(p.id));
}

/**
 * Check if round is complete (all active players submitted)
 */
export function isRoundComplete(state: GameState): boolean {
  if (state.phase !== 'active') return false;
  
  const activePlayers = getActivePlayers(state);
  const submitted = Object.keys(state.submissions);
  
  return (
    submitted.length === activePlayers.length &&
    activePlayers.length > 0
  );
}

/**
 * Get game winner (last player standing)
 */
export function getGameWinner(state: GameState): string | null {
  const activePlayers = getActivePlayers(state);
  if (activePlayers.length === 1) {
    return activePlayers[0].id;
  }
  return null;
}

/**
 * Calculate damage from card
 */
export function getCardDamage(cardType: string, cardPower: number): number {
  const baseMap: Record<string, number> = {
    'ATTACK': 5,
    'DEFENSE': 0,
    'TRICK': 2,
    'SPECIAL': 10,
  };
  return baseMap[cardType] || 0;
}


/**
 * Calculate defense reduction
 */
export function getCardDefense(cardType: string, cardPower: number): number {
  const baseMap: Record<string, number> = {
    'ATTACK': 0,
    'DEFENSE': 4,
    'TRICK': 1,
    'SPECIAL': 0,
  };
  return baseMap[cardType] || 0;
}

/**
 * Draw cards for a player at start of round
 */
export function drawCardsForPlayer(
  state: GameState,
  playerId: string,
  count: number = DRAW_PER_ROUND
): GameState {
  const deck = state.playerDecks[playerId] || [];
  const hand = state.playerHands[playerId] || [];
  const discard = state.playerDiscard[playerId] || [];

  const [drawnCards, remainingDeck] = drawCards(deck, count);

  return {
    ...state,
    playerDecks: {
      ...state.playerDecks,
      [playerId]: remainingDeck,
    },
    playerHands: {
      ...state.playerHands,
      [playerId]: [...hand, ...drawnCards],
    },
    playerDiscard: {
      ...state.playerDiscard,
      [playerId]: discard,
    },
  };
}

/**
 * Discard a card (move from hand to discard)
 */
export function discardCard(state: GameState, playerId: string, cardId: string): GameState {
  const hand = state.playerHands[playerId] || [];
  const discard = state.playerDiscard[playerId] || [];
  
  const cardToDiscard = hand.find(c => c.id === cardId);
  if (!cardToDiscard) return state;

  return {
    ...state,
    playerHands: {
      ...state.playerHands,
      [playerId]: hand.filter(c => c.id !== cardId),
    },
    playerDiscard: {
      ...state.playerDiscard,
      [playerId]: [...discard, cardToDiscard],
    },
  };
}

/**
 * Reducer function for game state
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'CREATE_MATCH':
      return {
        ...state,
        players: Array.from({ length: action.payload.maxPlayers }, (_, i) => ({
          id: `PLAYER_${i + 1}`,
          displayName: `Player ${i + 1}`,
          health: 20,
          maxHealth: 20,
          isConnected: true,
          hasPaid: true,
          ensName: '',
          cards: [],
        })),
        phase: 'lobby',
      };
    case 'INITIALIZE_GAME':
      return {
        ...state,
        phase: 'active',
        round: 1,
        playerHands: {},
        submissions: {},
      };
    case 'ADD_AI_PLAYERS':
      return {
        ...state,
        players: [...state.players, ...action.payload],
      };
    case 'START_GAME':
      return {
        ...state,
        phase: 'active',
      };
    // ...existing cases...
    default:
      return state;
  }
}
