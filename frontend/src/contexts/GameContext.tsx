import React, { createContext, useContext, useEffect, useState, useReducer } from 'react';
import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

import { getProfileById } from '@/services/profile';
import { pollOpenMatches } from '@/lib/fetchMatches';
import {
  suiToMist,
  extractMatchIdFromResult,
  buildJoinMatchTx,
  buildMintSessionCapTx,
  buildPlayTurnTx,
  buildFinishMatchTx,
} from '@/lib/createMatch';
import { gameReducer } from '@/game/reducer'; // Correct import for gameReducer
import { GameAction } from '@/game/types'; // Correct import for GameAction
import { GameState, createInitialState, REQUIRED_PLAYERS } from '@/game/state';

import {
  UserProfile,
  Match,
  MatchStatus,
  SessionWallet,
  GameCard,
} from '@/lib/gameTypes';

/* ================= Types ================= */

type GameContextValue = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  availableMatches: Match[];
  createMatch: (entryFee: number, maxPlayers: number) => Promise<Match>;
  joinMatch: (matchId: string) => Promise<Match | null>;
  startMatch: (matchId: string) => Promise<void>;
  leaveMatch: (matchId: string) => Promise<void>;
  playCard: (matchId: string, card: GameCard) => Promise<void>;
  settleMatch: (matchId: string) => Promise<void>;
  session: SessionWallet | null;
  currentMatch: Match | null;
  // Yellow SDK game state
  gameState: GameState | null;
  dispatchGameAction: (action: GameAction) => void;
};

const GameContext = createContext<GameContextValue | undefined>(undefined);

/* ================= Helpers ================= */

function readMockUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem('mock_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ================= Provider ================= */

export const GameProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [user, setUser] = useState<UserProfile | null>(() => readMockUser());
  const [isLoading, setIsLoading] = useState(false);
  const [availableMatches, setAvailableMatches] = useState<Match[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [session, setSession] = useState<SessionWallet | null>(null);
  const [gameState, dispatchGameState] = useReducer(
    gameReducer,
    {
      phase: 'lobby',
      players: [],
      submissions: {},
      resolvedEffects: [],
      eliminated: [],
      round: 0,
      roundStartTime: 0,
      roundTimeoutAt: 0,
      startedAt: 0,
      playerDecks: {},
      playerHands: {},
      playerDiscard: {},
    } as GameState,
    () => null
  );

  /* ================= Poll Matches ================= */

  useEffect(() => {
    let mounted = true;

    pollOpenMatches((matches) => {
      if (mounted) setAvailableMatches(matches);
    }, 5000);

    return () => {
      mounted = false;
    };
  }, []);

  /* ================= Wallet → User Sync ================= */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!account?.address) return;

      try {
        const profile = await getProfileById(account.address);
        if (cancelled) return;

        const mapped: UserProfile = profile
          ? {
              id: profile.id,
              ensName: profile.ens_name ?? '',
              displayName: profile.display_name ?? profile.id.slice(0, 6),
              avatarUrl: profile.avatar_url ?? undefined,
              totalMatches: profile.total_matches ?? 0,
              wins: profile.wins ?? 0,
              losses: (profile.total_matches ?? 0) - (profile.wins ?? 0),
              totalEarnings: profile.total_earnings ?? 0,
              totalSpent: profile.total_spent ?? 0,
              spendLimit: 0,
              preferences: { autoFold: false, soundEnabled: true, notifications: true },
              pastMatches: [],
              provider: 'sui',
              createdAt: new Date(),
            }
          : {
              id: account.address,
              ensName: '',
              displayName: `${account.address.slice(0, 6)}...${account.address.slice(-6)}`,
              totalMatches: 0,
              wins: 0,
              losses: 0,
              totalEarnings: 0,
              totalSpent: 0,
              spendLimit: 0,
              preferences: { autoFold: false, soundEnabled: true, notifications: true },
              pastMatches: [],
              provider: 'sui',
              createdAt: new Date(),
            };

        setUser(mapped);
        localStorage.setItem('mock_user', JSON.stringify(mapped));
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [account?.address]);

  /* ================= Logout ================= */

  const logout = async () => {
    localStorage.removeItem('mock_user');
    setUser(null);
  };

  /* ================= MINT SESSION CAP ================= */

  // Auto-mint session cap when game starts
  useEffect(() => {
    if (
      !account?.address ||
      !gameState ||
      gameState.phase !== 'active' ||
      session // Already have session
    ) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // Session valid for 1 hour (3,600,000 ms)
        const SESSION_DURATION_MS = 3_600_000;

        const tx = buildMintSessionCapTx({
          matchId: gameState.matchId,
          durationMs: SESSION_DURATION_MS,
        });

        return new Promise<void>((resolve, reject) => {
          signAndExecute(
            { transaction: tx },
            {
              onSuccess: (result) => {
                if (cancelled) return;

                // 🚨 SessionCap is now owned by player (transferred in Move)
                // Store session metadata locally
                const sessionCap = {
                  matchId: gameState.matchId,
                  player: account.address,
                  expiresAt: Date.now() + SESSION_DURATION_MS,
                  createdAt: Date.now(),
                };

                setSession(sessionCap as any); // Cast to SessionWallet for now
                resolve();
              },
              onError: (err) => {
                console.error('Failed to mint session cap:', err);
                reject(err);
              },
            }
          );
        });
      } catch (err) {
        console.error('Session cap minting error:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gameState?.phase, account?.address, session, gameState?.matchId]);

  /* ================= CREATE MATCH ================= */

  const createMatch = async (entryFee: number, maxPlayers: number): Promise<Match> => {
    if (!account?.address) throw new Error('Connect Sui wallet');

    setIsLoading(true);

    try {
      const entryFeeMist = suiToMist(entryFee);

      const tx = new Transaction();

      // ✅ split exact fee from gas
      const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(entryFeeMist)]);

      tx.moveCall({
        target:
          '0x53258a48aba231b5daa055e8be010fa4a63e5a79e2d6caa38e738053d66f6b48::game::create_match',
        arguments: [
          tx.pure.address(account.address),
          tx.pure.u64(entryFeeMist),
          tx.pure.u8(maxPlayers),
          payment,
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              const matchId = extractMatchIdFromResult(result);
              if (!matchId) return reject(new Error('Match ID not found'));

              const newMatch: Match = {
                id: matchId,
                entryFee,
                prizePool: entryFee,
                players: [],
                minPlayers: 2,
                maxPlayers,
                currentRound: 0,
                totalRounds: 3,
                status: 'WAITING',
                roundTimeLimit: 30,
                createdAt: new Date(),
              };

              resolve(newMatch);
            },
            onError: reject,
          }
        );
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= JOIN MATCH ================= */

  const joinMatch = async (matchId: string): Promise<Match | null> => {
    if (!account?.address) return null;

    const match = availableMatches.find((m) => m.id === matchId);
    if (!match) return null;

    setIsLoading(true);

    try {
      const entryFeeMist = suiToMist(match.entryFee);

      const tx = buildJoinMatchTx({
        matchId,
        entryFee: entryFeeMist,
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: () => {
              // 🚨 Initialize Yellow game state if first player
              if (!gameState) {
                const initialState = createInitialState(matchId, {
                  id: account.address,
                  ensName: user?.ensName || '',
                  displayName: user?.displayName || account.address.slice(0, 6),
                  avatarUrl: user?.avatarUrl,
                  health: 20,
                  maxHealth: 20,
                  cards: [],
                  isConnected: true,
                });
                dispatchGameState({ type: 'JOIN_PLAYER', player: initialState.players[0] });
              } else if (gameState.matchId === matchId) {
                // 👇 Dispatch JOIN action - this triggers AUTO-START if 4 players reached
                dispatchGameState({
                  type: 'JOIN_PLAYER',
                  player: {
                    id: account.address,
                    ensName: '',
                    displayName: `${account.address.slice(0, 6)}...${account.address.slice(-6)}`,
                    avatarUrl: profile.avatar_url ?? undefined,
                    health: 20,
                    maxHealth: 20,
                    cards: [],
                    isConnected: true,
                    hasPaid: true, // Add missing hasPaid property
                  },
                });
              }

              setCurrentMatch(match);
              resolve(match);
            },
            onError: reject,
          }
        );
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= LOCAL GAME STATE ================= */

  const startMatch = async (matchId: string) => {
    const match = availableMatches.find((m) => m.id === matchId);
    if (!match) return;

    const updated = { ...match, status: 'IN_PROGRESS' as MatchStatus };
    setAvailableMatches((s) => s.map((m) => (m.id === matchId ? updated : m)));
    setCurrentMatch(updated);

    // Dispatch action to set gameState.phase to 'active'
    dispatchGameState({ type: 'START_GAME' });
  };

  const leaveMatch = async (matchId: string) => {
    setCurrentMatch(null);
  };

  /* ================= PLAY CARD (SIGNATURE-FREE) ================= */

  const playCard = async (matchId: string, card: GameCard): Promise<void> => {
    // Validate preconditions
    if (!account?.address) throw new Error('Wallet not connected');
    if (!gameState || gameState.matchId !== matchId) throw new Error('Game state mismatch');
    if (!session) throw new Error('Session not active');

    setIsLoading(true);

    try {
      // Check if session is still valid
      const sessionExpiresAt = (session as any).expiresAt;
      if (Date.now() > sessionExpiresAt) {
        throw new Error('Session expired');
      }

      // Check if player is active (not eliminated)
      const isActive = gameState.players.some(p => p.id === account.address);
      if (!isActive) {
        throw new Error('Player not in game');
      }

      // Check if player already submitted this round
      if (gameState.submissions[account.address]) {
        throw new Error('Already submitted for this round');
      }

      // 🚨 Build transaction with SessionCap (NO SIGNATURE NEEDED)
      // The session capability validates player authorization on-chain
      const tx = buildPlayTurnTx({
        sessionCapId: (session as any).sessionCapId || '', // SessionCap ID
        matchId,
        cardPower: card.power,
        cardType: card.type,
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: () => {
              // Update local game state immediately
              dispatchGameState({
                type: 'SUBMIT_CARD',
                playerId: account.address,
                card,
              });

              resolve();
            },
            onError: reject,
          }
        );
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= SETTLE MATCH (PRIZE PAYOUT) ================= */

  const settleMatch = async (matchId: string): Promise<void> => {
    if (!account?.address) throw new Error('Wallet not connected');
    if (!gameState || gameState.matchId !== matchId) throw new Error('Game state mismatch');
    if (!currentMatch) throw new Error('No active match');

    setIsLoading(true);

    try {
      // Determine winner: last player not in eliminated list
      const allPlayerIds = gameState.players.map((p) => p.id);
      const eliminatedIds = gameState.eliminated || [];
      const winnerCandidates = allPlayerIds.filter((id) => !eliminatedIds.includes(id));

      if (winnerCandidates.length === 0) {
        throw new Error('No winner found - all players eliminated');
      }

      // In a real game, winner would be clearest in gameState
      // For now, take the first remaining player
      const winnerAddress = winnerCandidates[0];

      // Build finish_match transaction
      const tx = buildFinishMatchTx({
        matchId,
        winnerAddress,
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: () => {
              // Update match status to COMPLETED
              const updatedMatch = { ...currentMatch, status: 'COMPLETED' as MatchStatus };
              setCurrentMatch(updatedMatch);
              setAvailableMatches((prev) =>
                prev.map((m) => (m.id === matchId ? updatedMatch : m))
              );

              // Update user stats (wins, earnings)
              if (winnerAddress === account.address) {
                setUser((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    wins: prev.wins + 1,
                    totalMatches: prev.totalMatches + 1,
                    totalEarnings: prev.totalEarnings + currentMatch.prizePool,
                  };
                });
              } else {
                setUser((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    losses: prev.losses + 1,
                    totalMatches: prev.totalMatches + 1,
                    totalSpent: prev.totalSpent + currentMatch.entryFee,
                  };
                });
              }

              // Dispatch FINISH_GAME action to mark game as ended
              dispatchGameState({
                type: 'FINISH_GAME',
                winnerId: winnerAddress,
              });

              resolve();
            },
            onError: reject,
          }
        );
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= AI PLAYERS ================= */

  useEffect(() => {
    if (gameState && gameState.players.length === 1) {
      const aiPlayers = Array.from({ length: gameState.maxPlayers - 1 }, (_, i) => ({
        id: `AI_PLAYER_${i + 1}`,
        displayName: `AI Player ${i + 1}`,
        health: 20,
        maxHealth: 20,
        isConnected: true,
      }));

      dispatchGameState({
        type: 'ADD_AI_PLAYERS',
        payload: aiPlayers,
      } as unknown as GameAction); // Explicitly cast to unknown first
    }
  }, [gameState, dispatchGameState]);

  /* ================= Context Value ================= */

  const value: GameContextValue = {
    user,
    isAuthenticated: !!(user && account?.address),
    isLoading,
    logout,
    availableMatches,
    createMatch,
    joinMatch,
    startMatch,
    leaveMatch,
    playCard,
    settleMatch,
    session,
    currentMatch,
    gameState,
    dispatchGameAction: dispatchGameState,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

/* ================= Hook ================= */

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
