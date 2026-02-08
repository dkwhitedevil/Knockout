/**
 * Fetch Open Matches from Sui Blockchain
 * Reads MatchCreated events and Match objects
 */

import { suiClient } from "./suiClient";
import { Match, Player } from "./gameTypes";

const PACKAGE_ID = "0x53258a48aba231b5daa055e8be010fa4a63e5a79e2d6caa38e738053d66f6b48";

interface OnChainMatch {
  id: string;
  authority: string;
  entry_fee: number; // in MIST
  max_players: number;
  started: boolean;
  settled: boolean;
  players: string[];
  escrow: {
    value: number;
  };
}

/**
 * Fetch MatchCreated events from Sui
 * Returns all match IDs that were created
 */
export async function fetchMatchCreatedEvents(
  limit: number = 50
): Promise<string[]> {
  try {
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::game::MatchCreated`,
      },
      limit,
      order: "descending",
    });

    // Extract match IDs from event data
    return events.data
      .map((event) => {
        const data = event.parsedJson as any;
        return data?.match_id;
      })
      .filter(Boolean);
  } catch (err) {
    console.error("Failed to fetch match events:", err);
    return [];
  }
}

/**
 * Fetch a single Match object from Sui
 */
export async function fetchMatchObject(matchId: string): Promise<OnChainMatch | null> {
  try {
    const result = await suiClient.getObject({
      id: matchId,
      options: {
        showContent: true,
        showType: true,
      },
    });

    if (!result.data?.content) return null;

    const fields = (result.data.content as any).fields;
    if (!fields) return null;

    return {
      id: matchId,
      authority: fields.authority,
      entry_fee: Number(fields.entry_fee),
      max_players: Number(fields.max_players),
      started: Boolean(fields.started),
      settled: Boolean(fields.settled),
      players: fields.players || [],
      escrow: {
        value: Number(fields.escrow?.value || 0),
      },
    };
  } catch (err) {
    console.error(`Failed to fetch match ${matchId}:`, err);
    return null;
  }
}

/**
 * Fetch all open (not started, not settled) matches
 * Combines events + object reads
 */
export async function fetchOpenMatches(): Promise<Match[]> {
  try {
    // Get all match IDs from events
    const matchIds = await fetchMatchCreatedEvents(100);

    if (matchIds.length === 0) {
      return [];
    }

    // Fetch each match object
    const matchObjects = await Promise.all(
      matchIds.map((id) => fetchMatchObject(id))
    );

    // Filter to only open matches (not started, not settled)
    const openMatches = matchObjects
      .filter((m) => m && !m.started && !m.settled)
      .map((onChain) => convertOnChainToMatch(onChain!));

    return openMatches;
  } catch (err) {
    console.error("Failed to fetch open matches:", err);
    return [];
  }
}

/**
 * Convert on-chain Match object to frontend Match type
 */
function convertOnChainToMatch(onChain: OnChainMatch): Match {
  return {
    id: onChain.id,
    entryFee: onChain.entry_fee / 1e9, // Convert MIST to SUI
    prizePool: onChain.escrow.value / 1e9, // Current escrow value
    players: onChain.players.map((addr, idx) => ({
      id: addr,
      ensName: `Player ${idx + 1}`,
      displayName: addr.slice(0, 6) + "...",
      avatarUrl: undefined,
      health: 100,
      maxHealth: 100,
      cards: [],
      isConnected: true,
    })),
    minPlayers: 2,
    maxPlayers: onChain.max_players,
    currentRound: 0,
    totalRounds: 5,
    status: onChain.started ? "IN_PROGRESS" : "WAITING",
    roundTimeLimit: 60,
    createdAt: new Date(),
  };
}

/**
 * Poll for open matches with interval
 * Useful for real-time updates in UI
 */
export async function pollOpenMatches(
  callback: (matches: Match[]) => void,
  intervalMs: number = 5000
): Promise<() => void> {
  let cancelled = false;

  const poll = async () => {
    if (!cancelled) {
      const matches = await fetchOpenMatches();
      callback(matches);
    }
    if (!cancelled) {
      setTimeout(poll, intervalMs);
    }
  };

  poll();

  // Return cleanup function
  return () => {
    cancelled = true;
  };
}

/**
 * Watch for MatchCreated events and notify when new match created
 */
export async function watchForNewMatches(
  callback: (matchId: string) => void
): Promise<() => void> {
  let cancelled = false;
  let lastEventIndex = 0;

  const watch = async () => {
    if (!cancelled) {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::game::MatchCreated`,
        },
        limit: 50,
        order: "descending",
      });

      // Notify about new events
      if (events.data.length > lastEventIndex) {
        events.data.slice(0, events.data.length - lastEventIndex).forEach((event) => {
          const matchId = (event.parsedJson as any)?.match_id;
          if (matchId) callback(matchId);
        });
        lastEventIndex = events.data.length;
      }
    }

    if (!cancelled) {
      setTimeout(watch, 10000); // Check every 10 seconds
    }
  };

  watch();

  return () => {
    cancelled = true;
  };
}
