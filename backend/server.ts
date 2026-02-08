import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import { validatePlayerJoin } from "./matchValidator";

/* ================= Types ================= */

type JoinMessage = {
  type: "join";
  matchId: string;
  player: string;
};

type ServerMessage =
  | { type: "player_joined"; player: string; count: number }
  | { type: "player_left"; player: string; count: number }
  | { type: "error"; message: string };

interface GameSocket extends WebSocket {
  matchId?: string;
  player?: string;
}

/* ================= Server Setup ================= */

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

/**
 * Rooms storage:
 * matchId → Set of sockets
 */
const rooms: Record<string, Set<GameSocket>> = {};

/* ================= WebSocket Logic ================= */

wss.on("connection", (ws: GameSocket) => {
  console.log("🔌 Player connected");

  ws.on("message", async (raw) => {
    try {
      const data: JoinMessage = JSON.parse(raw.toString());

      if (data.type === "join") {
        await handleJoin(ws, data);
      }
    } catch (err) {
      console.error("Invalid WS message:", err);
    }
  });

  ws.on("close", () => handleDisconnect(ws));
});

/* ================= Handlers ================= */

async function handleJoin(ws: GameSocket, data: JoinMessage) {
  const { matchId, player } = data;

  console.log(`🔍 Validating player ${player} for match ${matchId}`);

  const isValid = await validatePlayerJoin(matchId, player);

  if (!isValid) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Invalid player or match not started",
      })
    );
    ws.close();
    return;
  }

  if (!rooms[matchId]) {
    rooms[matchId] = new Set();
  }

  rooms[matchId].add(ws);
  ws.matchId = matchId;
  ws.player = player;

  console.log(`✅ ${player} joined match ${matchId}`);

  broadcast(matchId, {
    type: "player_joined",
    player,
    count: rooms[matchId].size,
  });
}

function handleDisconnect(ws: GameSocket) {
  const { matchId, player } = ws;

  if (!matchId || !rooms[matchId]) return;

  rooms[matchId].delete(ws);

  broadcast(matchId, {
    type: "player_left",
    player: player ?? "unknown",
    count: rooms[matchId].size,
  });

  console.log(`❌ ${player} disconnected from ${matchId}`);
}

/* ================= Broadcast Helper ================= */

function broadcast(matchId: string, message: ServerMessage) {
  const clients = rooms[matchId];
  if (!clients) return;

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}

/* ================= Start Server ================= */

const PORT = 4000;

server.listen(PORT, () => {
  console.log(`🚀 Multiplayer WS running at http://localhost:${PORT}`);
});
