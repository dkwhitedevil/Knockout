import { Transaction } from "@mysten/sui/transactions";

/* ================= CONSTANTS ================= */

export const PACKAGE_ID =
  "0x53258a48aba231b5daa055e8be010fa4a63e5a79e2d6caa38e738053d66f6b48";

/* ================= SUI ↔ MIST ================= */

/**
 * Convert SUI → MIST
 * 1 SUI = 1_000_000_000 MIST
 */
export function suiToMist(sui: number): number {
  return Math.floor(sui * 1_000_000_000);
}

/**
 * Convert MIST → SUI
 */
export function mistToSui(mist: number): number {
  return mist / 1_000_000_000;
}

/* ================= CREATE MATCH TX ================= */

type BuildCreateMatchParams = {
  authority: string;
  entryFee: number; // in MIST
  maxPlayers: number;
};

/**
 * Build transaction for create_match
 * Uses splitCoins to guarantee exact payment amount.
 */
export function buildCreateMatchTx({
  authority,
  entryFee,
  maxPlayers,
}: BuildCreateMatchParams) {
  const tx = new Transaction();

  // Split exact entry fee from gas coin
  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(entryFee)]);

  tx.moveCall({
    target: `${PACKAGE_ID}::game::create_match`,
    arguments: [
      tx.pure.address(authority),
      tx.pure.u64(entryFee),
      tx.pure.u8(maxPlayers),
      payment,
    ],
  });

  return tx;
}

/* ================= EXTRACT MATCH ID ================= */

/**
 * Extract created Match object ID from transaction result
 */
export function extractMatchIdFromResult(result: any): string | null {
  try {
    const created = result?.effects?.created ?? [];

    for (const obj of created) {
      const id = obj?.reference?.objectId;
      if (id) return id;
    }

    return null;
  } catch {
    return null;
  }
}

/* ================= JOIN MATCH TX ================= */

type BuildJoinMatchParams = {
  matchId: string;
  entryFee: number; // MIST (u64)
};

/**
 * Build transaction for join_match
 * Uses splitCoins to guarantee exact payment amount.
 */
export function buildJoinMatchTx({
  matchId,
  entryFee,
}: BuildJoinMatchParams) {
  const tx = new Transaction();

  // 🚨 MUST split exact entry fee
  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(entryFee)]);

  tx.moveCall({
    target: `${PACKAGE_ID}::game::join_match`,
    arguments: [
      tx.object(matchId),
      payment,
    ],
  });

  return tx;
}

/* ================= MINT SESSION CAP TX ================= */

type BuildMintSessionCapParams = {
  matchId: string;
  durationMs: number; // Session duration in milliseconds
};

/**
 * Build transaction for mint_session_cap
 * Mints a SessionCap for signature-free gameplay
 * Called after game starts (when 4 players reach)
 */
export function buildMintSessionCapTx({
  matchId,
  durationMs,
}: BuildMintSessionCapParams) {
  const tx = new Transaction();

  // Reference to Sui system clock (standard object)
  const CLOCK_ID = '0x6';

  tx.moveCall({
    target: `${PACKAGE_ID}::game::mint_session_cap`,
    arguments: [
      tx.object(matchId),
      tx.pure.u64(durationMs),
      tx.object(CLOCK_ID),
    ],
  });

  return tx;
}

/* ================= PLAY TURN TX (SIGNATURE-FREE) ================= */

export type GameCard = {
  type: 'ATTACK' | 'DEFENSE' | 'TRICK' | 'SPECIAL';
  power: number;
  name: string;
};

type BuildPlayTurnParams = {
  sessionCapId: string;
  matchId: string;
  cardPower: number; // Card power level
  cardType: string; // Card type as string
};

/**
 * Build transaction for play_turn
 * Uses SessionCap to validate instead of wallet signature
 * NO signature required - pure session validation
 */
export function buildPlayTurnTx({
  sessionCapId,
  matchId,
  cardPower,
  cardType,
}: BuildPlayTurnParams) {
  const tx = new Transaction();

  // Reference to Sui system clock
  const CLOCK_ID = '0x6';

  tx.moveCall({
    target: `${PACKAGE_ID}::game::play_turn`,
    arguments: [
      tx.object(sessionCapId),      // SessionCap (owned by player)
      tx.object(matchId),           // Match object
      tx.pure.u64(cardPower),       // Card power
      tx.pure.string(cardType),     // Card type
      tx.object(CLOCK_ID),          // Clock for validation
    ],
  });

  return tx;
}

/* ================= FINISH MATCH TX (SETTLEMENT) ================= */

type BuildFinishMatchParams = {
  matchId: string;
  winnerAddress: string;
};

/**
 * Build transaction for finish_match
 * Called by authority/oracle to settle match and payout winner
 * Winner receives entire escrow balance
 */
export function buildFinishMatchTx({
  matchId,
  winnerAddress,
}: BuildFinishMatchParams) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::game::finish_match`,
    arguments: [
      tx.object(matchId),
      tx.pure.address(winnerAddress),
    ],
  });

  return tx;
}
