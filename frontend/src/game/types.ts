// Centralized GameAction type definition

import { GameCard } from './state';
import { PlayerState } from './state';

export type GameAction =
  | { type: 'CREATE_MATCH'; payload: { maxPlayers: number } }
  | { type: 'INITIALIZE_GAME' }
  | { type: 'ADD_AI_PLAYERS'; payload: PlayerState[] }
  | { type: 'START_GAME' }
  | { type: 'PLAYER_PAID'; playerId: string }
  | { type: 'SUBMIT_CARD'; playerId: string; card: GameCard }
  | { type: 'JOIN_PLAYER'; player: PlayerState }
  | { type: 'RESOLVE_ROUND' }
  | { type: 'ELIMINATE_PLAYER'; playerId: string }
  | { type: 'ADVANCE_ROUND' }
  | { type: 'AUTO_TIMEOUT'; playerId: string }
  | { type: 'FINISH_GAME'; winnerId: string }
  | { type: 'DRAW_CARD'; playerId: string; count?: number }
  | { type: 'SHUFFLE_DECK'; playerId: string };