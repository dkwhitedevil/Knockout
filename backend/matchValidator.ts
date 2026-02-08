import { suiClient } from "./suiClient";

/**
 * Shape of Match object fields we care about
 */
type MatchData = {
  started: boolean;
  players: string[];
};

/**
 * Fetch Match object from Sui
 */
export async function fetchMatch(matchId: string): Promise<MatchData | null> {
  try {
    const res = await suiClient.getObject({
      id: matchId,
      options: { showContent: true },
    });

    // @ts-ignore (Sui dynamic structure)
    const fields = res.data?.content?.fields;

    if (!fields) return null;

    return {
      started: fields.started,
      players: fields.players,
    };
  } catch (err) {
    console.error("Failed to fetch match:", err);
    return null;
  }
}

/**
 * Validate whether a player can join
 */
export async function validatePlayerJoin(
  matchId: string,
  player: string
): Promise<boolean> {
  const match = await fetchMatch(matchId);

  if (!match) return false;

  if (!match.started) {
    console.log("⛔ Match not started");
    return false;
  }

  if (!match.players.includes(player)) {
    console.log("⛔ Player not in match");
    return false;
  }

  return true;
}
