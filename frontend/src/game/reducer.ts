/**
 * Yellow SDK Game Reducer
 * Handles all state transitions with immutability guarantee
 */

import {
  GameState,
  maybeStartGame,
  getActivePlayers,
  MAX_PLAYERS,
  STARTING_HEALTH,
  PlayerState,
  MAX_ROUND_TIME,
  getGameWinner,
  getCardDamage,
  drawCardsForPlayer,
  discardCard,
  DRAW_PER_ROUND,
} from './state';
import { Player, GameCard } from '@/lib/gameTypes';
import { GameAction } from './types'; // Use centralized GameAction type

/**
 * Pure reducer function
 * All state transitions are deterministic and replayable
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
    case 'PLAYER_PAID':
      return {
        ...state,
        players: state.players.map(player =>
          player.id === action.playerId ? { ...player, hasPaid: true } : player
        ),
      };
    case 'JOIN_PLAYER': {
      // Prevent duplicate joins
      if (state.players.find(p => p.id === action.player.id)) {
        return state;
      }

      // Hard cap at 4 players
      if (state.players.length >= MAX_PLAYERS) {
        return state;
      }

      // Can only join during lobby
      if (state.phase !== 'lobby') {
        return state;
      }

      const playerState: PlayerState = {
        ...action.player,
        health: STARTING_HEALTH,
        maxHealth: STARTING_HEALTH,
        hasPaid: false,
      };

      const nextState = {
        ...state,
        players: [...state.players, playerState],
      };

      // 🚨 AUTO-START WHEN 4 PLAYERS REACHED
      return maybeStartGame(nextState);
    }

    case 'SUBMIT_CARD': {
      // Only during active phase
      if (state.phase !== 'active') {
        return state;
      }

      // Player must exist and not be eliminated
      const playerActive = getActivePlayers(state).find(
        p => p.id === action.playerId
      );
      if (!playerActive) {
        return state;
      }

      // Can't submit twice per round
      if (state.submissions[action.playerId]) {
        return state;
      }

      return {
        ...state,
        submissions: {
          ...state.submissions,
          [action.playerId]: action.card,
        },
      };
    }

    case 'RESOLVE_ROUND': {
      // Only during active phase
      if (state.phase !== 'active') {
        return state;
      }

      // All active players must submit
      const activePlayers = getActivePlayers(state);
      if (Object.keys(state.submissions).length !== activePlayers.length) {
        return state;
      }

      // Calculate damage for each player
      const damageMap: Record<string, number> = {};
      activePlayers.forEach(p => {
        damageMap[p.id] = 0;
      });

      // Apply damage from attacks
      Object.entries(state.submissions).forEach(([attackerId, card]) => {
        // Each attack deals damage to all other players
        const damage = getCardDamage(card.type, card.power);
        
        activePlayers.forEach(defender => {
          if (defender.id !== attackerId) {
            // Reduce damage by defender's defense cards
            const defenderCard = state.submissions[defender.id];
            const defense = defenderCard?.type === 'DEFENSE' ? 2 : 0;
            const actualDamage = Math.max(0, damage - defense);
            damageMap[defender.id] += actualDamage;
          }
        });
      });

      // Apply damage to players
      const updatedPlayers = state.players.map(player => {
        if (!state.eliminated.includes(player.id)) {
          const damage = damageMap[player.id] || 0;
          return {
            ...player,
            health: Math.max(0, player.health - damage),
          };
        }
        return player;
      });

      // Find newly eliminated players
      const newlyEliminated = updatedPlayers
        .filter(p => p.health === 0 && !state.eliminated.includes(p.id))
        .map(p => p.id);

      // Move played cards to discard pile
      let nextState: GameState = {
        ...state,
        players: updatedPlayers,
        eliminated: [...state.eliminated, ...newlyEliminated],
        resolvedEffects: Object.entries(damageMap).map(([playerId, damage]) => ({
          from: 'game',
          to: playerId,
          type: 'DAMAGE',
          damage,
        })),
      };

      // Discard all played cards
      Object.entries(state.submissions).forEach(([playerId, card]) => {
        const hand = nextState.playerHands[playerId] || [];
        const discard = nextState.playerDiscard[playerId] || [];
        
        nextState = {
          ...nextState,
          playerHands: {
            ...nextState.playerHands,
            [playerId]: hand.filter(c => c.id !== card.id),
          },
          playerDiscard: {
            ...nextState.playerDiscard,
            [playerId]: [...discard, card],
          },
        };
      });

      return nextState;
    }

    case 'ELIMINATE_PLAYER': {
      // Player must exist and not already eliminated
      if (state.eliminated.includes(action.playerId)) {
        return state;
      }

      if (!state.players.find(p => p.id === action.playerId)) {
        return state;
      }

      return {
        ...state,
        eliminated: [...state.eliminated, action.playerId],
      };
    }

    case 'ADVANCE_ROUND': {
      // Only during active phase
      if (state.phase !== 'active') {
        return state;
      }

      const activePlayers = getActivePlayers(state);

      // Can only advance if at least 2 players remain
      if (activePlayers.length < 2) {
        return state;
      }

      // Check if max rounds reached
      if (state.round >= state.totalRounds) {
        return state;
      }

      const now = Date.now();
      let nextState: GameState = {
        ...state,
        round: state.round + 1,
        submissions: {},
        resolvedEffects: [],
        roundStartTime: now,
        roundTimeoutAt: now + MAX_ROUND_TIME * 1000,
      };

      // Draw cards for each active player
      activePlayers.forEach(player => {
        nextState = drawCardsForPlayer(nextState, player.id, DRAW_PER_ROUND);
      });

      return nextState;
    }

    case 'AUTO_TIMEOUT': {
      // Only during active phase
      if (state.phase !== 'active') {
        return state;
      }

      // Eliminate players who didn't submit
      const activePlayers = getActivePlayers(state);
      const didNotSubmit = activePlayers
        .filter(p => !state.submissions[p.id])
        .map(p => p.id);

      return {
        ...state,
        eliminated: [...state.eliminated, ...didNotSubmit],
      };
    }

    case 'FINISH_GAME': {
      // Only when game is active
      if (state.phase !== 'active') {
        return state;
      }

      // Winner must be an active player
      const isWinnerActive = getActivePlayers(state).some(
        p => p.id === action.winnerId
      );
      if (!isWinnerActive) {
        return state;
      }

      return {
        ...state,
        phase: 'ended',
        winner: action.winnerId,
        endedAt: Date.now(),
      };
    }

    case 'DRAW_CARD': {
      // Player must exist
      if (!state.players.find(p => p.id === action.playerId)) {
        return state;
      }

      return drawCardsForPlayer(state, action.playerId, action.count || DRAW_PER_ROUND);
    }

    case 'SHUFFLE_DECK': {
      // Player must exist
      if (!state.players.find(p => p.id === action.playerId)) {
        return state;
      }

      const discard = state.playerDiscard[action.playerId] || [];
      const hand = state.playerHands[action.playerId] || [];

      // Can't shuffle if no discard pile
      if (discard.length === 0) {
        return state;
      }

      // Reshuffle discard into deck
      return {
        ...state,
        playerDecks: {
          ...state.playerDecks,
          [action.playerId]: discard,
        },
        playerDiscard: {
          ...state.playerDiscard,
          [action.playerId]: [],
        },
      };
    }

    default:
      return state;
  }
}
