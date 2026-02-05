 // LAST HAND OS - Game Type Definitions
 // These types would map to Sui Move structs in production
 
 export type CardType = 'ATTACK' | 'DEFENSE' | 'TRICK' | 'SPECIAL';
 
 export interface GameCard {
   id: string;
   type: CardType;
   name: string;
   power: number;
   description: string;
   // In production: would include Sui object ID
 }
 
 export interface Player {
   id: string;
   ensName: string; // ENS-style username (player.eth)
   displayName: string;
   avatarUrl?: string;
   health: number;
   maxHealth: number;
   cards: GameCard[];
   isConnected: boolean;
   selectedCard?: GameCard | null;
   // Session wallet tracking
   sessionId?: string;
 }
 
 export type MatchStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
 export type SessionStatus = 'ACTIVE' | 'CLOSED' | 'EXPIRED';
 
 export interface SessionWallet {
   id: string;
   userId: string;
   lockedAmount: number; // Mock USDC
   balance: number;
   permissions: string[];
   status: SessionStatus;
   createdAt: Date;
   expiresAt: Date;
   // In production: would be a Sui PTB session object
   // Yellow Network: state channel balance tracking
 }
 
 export interface Match {
   id: string;
   entryFee: number;
   prizePool: number;
   players: Player[];
   minPlayers: number;
   maxPlayers: number;
   currentRound: number;
   totalRounds: number;
   status: MatchStatus;
   roundTimeLimit: number; // seconds
   winnerId?: string;
   createdAt: Date;
   // Off-chain simulation state
   stateHash?: string;
 }
 
 export interface RoundResult {
   roundNumber: number;
   actions: PlayerAction[];
   healthChanges: Record<string, number>;
   eliminatedPlayers: string[];
 }
 
 export interface PlayerAction {
   playerId: string;
   card: GameCard;
   targetId?: string;
   timestamp: number;
 }
 
 export interface MatchResult {
   matchId: string;
   winnerId: string;
   winnerPayout: number;
   rounds: RoundResult[];
   finalStateHash: string;
   settlementTxId?: string; // Mock Sui transaction
 }
 
 export interface UserProfile {
   id: string;
   ensName: string;
   displayName: string;
   avatarUrl?: string;
   totalMatches: number;
   wins: number;
   losses: number;
   totalEarnings: number;
   totalSpent: number;
   spendLimit: number;
   preferences: {
     autoFold: boolean;
     soundEnabled: boolean;
     notifications: boolean;
   };
   pastMatches: MatchResult[];
 }