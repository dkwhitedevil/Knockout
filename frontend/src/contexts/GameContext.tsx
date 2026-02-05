 import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
 import { 
   Player, 
   Match, 
   GameCard, 
   SessionWallet, 
   UserProfile,
   MatchStatus 
 } from '@/lib/gameTypes';

interface GameState {
  user: UserProfile | null;
  session: SessionWallet | null;
  currentMatch: Match | null;
  availableMatches: Match[];
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface GameActions {
  login: (provider: 'google' | 'apple') => Promise<void>;
  logout: () => void;
  createMatch: (entryFee: number, maxPlayers: number) => Promise<Match>;
  joinMatch: (matchId: string) => Promise<void>;
  leaveMatch: () => void;
  playCard: (card: GameCard, targetId?: string) => void;
  startMatch: () => void;
  settleMatch: () => Promise<void>;
}

const GameContext = createContext<(GameState & GameActions) | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<SessionWallet | null>(null);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [availableMatches, setAvailableMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!user;

  // zkLogin authentication
  const login = useCallback(async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    // In production: zkLogin flow with Sui
    // TODO: Implement actual zkLogin authentication
    setIsLoading(false);
  }, []);
 
   const logout = useCallback(() => {
     setUser(null);
     setSession(null);
     setCurrentMatch(null);
   }, []);
 
   const createMatch = useCallback(async (entryFee: number, maxPlayers: number): Promise<Match> => {
     setIsLoading(true);
    
    if (!user) {
      setIsLoading(false);
      throw new Error('User must be authenticated to create a match');
    }
    
    const newMatch: Match = {
      id: `match-${Date.now()}`,
      entryFee,
      prizePool: entryFee,
      players: [{
        id: user.id,
        ensName: user.ensName,
        displayName: user.displayName,
        health: 100,
        maxHealth: 100,
        cards: [],
        isConnected: true,
      }],
      minPlayers: 4,
      maxPlayers,
      currentRound: 0,
      totalRounds: 5,
      status: 'WAITING',
      roundTimeLimit: 15,
      createdAt: new Date(),
    };
    
    // TODO: Create session wallet and lock funds on-chain
    const newSession: SessionWallet = {
      id: `session-${Date.now()}`,
      userId: user.id,
      lockedAmount: entryFee,
      balance: entryFee,
      permissions: ['PLAY_CARDS', 'AUTO_FOLD', 'RECEIVE_REWARDS'],
      status: 'ACTIVE',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    };
    setSession(newSession);
    setCurrentMatch(newMatch);
    setAvailableMatches(prev => [...prev, newMatch]);
    setIsLoading(false);
     
     return newMatch;
   }, [user]);
 
   const joinMatch = useCallback(async (matchId: string) => {
     setIsLoading(true);
    
    const match = availableMatches.find(m => m.id === matchId);
    if (!match || !user) {
      setIsLoading(false);
      return;
    }
    
    const playerData: Player = {
      id: user.id,
      ensName: user.ensName,
      displayName: user.displayName,
      health: 100,
      maxHealth: 100,
      cards: [],
      isConnected: true,
    };
    
    const updatedMatch = {
      ...match,
      players: [...match.players, playerData],
      prizePool: match.prizePool + match.entryFee,
    };
    
    // TODO: Create session wallet and lock funds on-chain
    const newSession: SessionWallet = {
      id: `session-${Date.now()}`,
      userId: user.id,
      lockedAmount: match.entryFee,
      balance: match.entryFee,
      permissions: ['PLAY_CARDS', 'AUTO_FOLD', 'RECEIVE_REWARDS'],
      status: 'ACTIVE',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    };
    setSession(newSession);
    setCurrentMatch(updatedMatch);
    setAvailableMatches(prev => 
      prev.map(m => m.id === matchId ? updatedMatch : m)
    );
    setIsLoading(false);
   }, [availableMatches, user]);
 
   const leaveMatch = useCallback(() => {
     if (session) {
       // Refund session wallet (mock)
       setSession(null);
     }
     setCurrentMatch(null);
   }, [session]);
 
   const playCard = useCallback((card: GameCard, targetId?: string) => {
     if (!currentMatch || !user) return;
     
     // Update player's selected card
     setCurrentMatch(prev => {
       if (!prev) return null;
       return {
         ...prev,
         players: prev.players.map(p => 
           p.id === user.id ? { ...p, selectedCard: card } : p
         ),
       };
     });
   }, [currentMatch, user]);
 
   const startMatch = useCallback(() => {
     if (!currentMatch) return;
     setCurrentMatch(prev => prev ? { ...prev, status: 'IN_PROGRESS', currentRound: 1 } : null);
   }, [currentMatch]);
 
   const settleMatch = useCallback(async () => {
     if (!currentMatch || !user) return;
     setIsLoading(true);
     
    // TODO: Implement Sui settlement on-chain
    
    // Close session
    setSession(prev => prev ? { ...prev, status: 'CLOSED' } : null);
    setCurrentMatch(prev => prev ? { ...prev, status: 'COMPLETED', winnerId: user.id } : null);
    setIsLoading(false);
  }, [currentMatch, user]);

  const value = {
    user,
    session,
    currentMatch,
    availableMatches,
    isAuthenticated,
    isLoading,
    login,
    logout,
    createMatch,
    joinMatch,
    leaveMatch,
    playCard,
    startMatch,
    settleMatch,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
 
 export function useGame() {
   const context = useContext(GameContext);
   if (!context) {
     throw new Error('useGame must be used within a GameProvider');
   }
   return context;
 }