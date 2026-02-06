import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  UserProfile,
  Match,
  MatchStatus,
  SessionWallet,
  GameCard,
  Player,
} from '@/lib/gameTypes';

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
};

const GameContext = createContext<GameContextValue | undefined>(undefined);

function readMockUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem('mock_user');
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export const GameProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => readMockUser());
  const [isLoading, setIsLoading] = useState(false);
  const [availableMatches, setAvailableMatches] = useState<Match[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [session, setSession] = useState<SessionWallet | null>(null);

  useEffect(() => {
    const listener = (e: Event) => {
      const detail = (e as CustomEvent).detail as UserProfile | null;
      setUser(detail ?? readMockUser());
    };
    window.addEventListener('mockAuthChange', listener);
    return () => window.removeEventListener('mockAuthChange', listener);
  }, []);

  const logout = async () => {
    localStorage.removeItem('mock_user');
    setUser(null);
    window.dispatchEvent(new CustomEvent('mockAuthChange', { detail: null }));
  };

  const createMatch = async (entryFee: number, maxPlayers: number) => {
    setIsLoading(true);
    try {
      const id = `m_${Date.now().toString(36)}`;
      const match: Match = {
        id,
        entryFee,
        prizePool: entryFee * maxPlayers,
        players: user
          ? [
              {
                id: user.id,
                ensName: user.ensName,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                health: 100,
                maxHealth: 100,
                cards: [],
                isConnected: true,
              } as Player,
            ]
          : [],
        minPlayers: 2,
        maxPlayers,
        currentRound: 0,
        totalRounds: 3,
        status: 'WAITING' as MatchStatus,
        roundTimeLimit: 30,
        createdAt: new Date(),
      };
      setAvailableMatches((s) => [match, ...s]);
      return match;
    } finally {
      setIsLoading(false);
    }
  };

  const joinMatch = async (matchId: string) => {
    setIsLoading(true);
    try {
      const match = availableMatches.find((m) => m.id === matchId) ?? null;
      if (!match || !user) return null;
      if (match.players.find((p) => p.id === user.id)) return match;
      const player: Player = {
        id: user.id,
        ensName: user.ensName,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        health: 100,
        maxHealth: 100,
        cards: [],
        isConnected: true,
      };
      const updated: Match = { ...match, players: [...match.players, player] };
      setAvailableMatches((s) => s.map((m) => (m.id === matchId ? updated : m)));
      return updated;
    } finally {
      setIsLoading(false);
    }
  };

  const startMatch = async (matchId: string) => {
    const match = availableMatches.find((m) => m.id === matchId);
    if (!match) return;
    const updated: Match = { ...match, status: 'IN_PROGRESS' } as Match;
    setAvailableMatches((s) => s.map((m) => (m.id === matchId ? updated : m)));
    setCurrentMatch(updated);
  };

  const leaveMatch = async (matchId: string) => {
    if (!user) return;
    const match = availableMatches.find((m) => m.id === matchId);
    if (!match) return;
    const updatedPlayers = match.players.filter((p) => p.id !== user.id);
    let updated: Match;
    if (updatedPlayers.length === 0) {
      updated = { ...match, status: 'CANCELLED', players: [] } as Match;
    } else {
      updated = { ...match, players: updatedPlayers } as Match;
    }
    setAvailableMatches((s) => s.map((m) => (m.id === matchId ? updated : m)));
    if (currentMatch?.id === matchId) setCurrentMatch(null);
  };

  const playCard = async (_matchId: string, _card: GameCard) => {
    // Local simulation stub — no-op for now
    return;
  };

  const settleMatch = async (matchId: string) => {
    const match = availableMatches.find((m) => m.id === matchId) ?? currentMatch;
    if (!match) return;
    const updated: Match = { ...match, status: 'COMPLETED' } as Match;
    setAvailableMatches((s) => s.map((m) => (m.id === matchId ? updated : m)));
    setCurrentMatch(null);
    // update mock user stats
    if (user) {
      const wins = user.wins + 0;
      const totalMatches = user.totalMatches + 1;
      const updatedUser: UserProfile = { ...user, wins, totalMatches } as UserProfile;
      setUser(updatedUser);
      localStorage.setItem('mock_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent('mockAuthChange', { detail: updatedUser }));
    }
  };

  const value: GameContextValue = {
    user,
    isAuthenticated: !!user,
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
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}