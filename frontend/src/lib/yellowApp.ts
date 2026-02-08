import fs from "fs";
import path, { dirname } from "path";
import { WebSocketServer, WebSocket } from "ws";
import pkg from "@erc7824/nitrolite";
import { fileURLToPath } from "url";

const {
  createAppSessionMessage,
  RPCAppDefinition,
  RPCAppSessionAllocation,  
  RPCProtocolVersion,
} = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 8081;
const wss = new WebSocketServer({ port: PORT });

const OFFLINE_STORAGE_PATH = path.resolve(__dirname, "offlineStorage.json");
const GAME_LOG_PATH = path.resolve(__dirname, "gameLog.txt");

console.log(`🟢 Yellow Server running on ws://localhost:${PORT}`);

/* ================= STORAGE ================= */

function saveGameStateLocally(gameState: any) {
  try {
    fs.writeFileSync(OFFLINE_STORAGE_PATH, JSON.stringify(gameState, null, 2));
    console.log("💾 Game state saved");
  } catch (err) {
    console.error("❌ Failed to save game state", err);
  }
}

function loadGameState(): any {
  try {
    if (fs.existsSync(OFFLINE_STORAGE_PATH)) {
      const data = fs.readFileSync(OFFLINE_STORAGE_PATH, "utf-8");
      console.log("📂 Loaded game state");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("❌ Failed to load game state", err);
  }
  return null;
}

function logGameStateChange(message: string) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(GAME_LOG_PATH, entry);
}

/* ================= GAME STATE ================= */

let gameState = loadGameState() || {};

/* ================= MESSAGE HANDLER ================= */

function handleClientMessage(ws: WebSocket, message: string) {
  try {
    const parsed = JSON.parse(message);

    /* -------- SESSION -------- */
    if (parsed.type === "create_session") {
      const { userAddress, partnerAddress, messageSigner } = parsed;


      const sessionData = JSON.stringify({
        gameId: "game-123",
        createdAt: Date.now(),
      });

      createAppSessionMessage(messageSigner, {
        definition: appDefinition,
        allocations,
        session_data: sessionData,
      })
        .then(() => {
          ws.send(
            JSON.stringify({
              type: "session_created",
              sessionId: "session-id",
            })
          );
          console.log("✅ Session created");
        })
        .catch((err) => {
          console.error(err);
          ws.send(JSON.stringify({ type: "error", error: "Session failed" }));
        });
    }

    /* -------- GAME STATE -------- */
    else if (parsed.type === "gameStateUpdate") {
      gameState = parsed.payload;
      saveGameStateLocally(gameState);

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "gameStateUpdate",
              payload: gameState,
            })
          );
        }
      });
    }

    /* -------- GAME LOG -------- */
    else if (parsed.type === "gameLog") {
      const logMessage = parsed.payload?.message;
      if (logMessage) {
        console.log("📜", logMessage);
        logGameStateChange(logMessage);
      }
    }

    /* -------- UNKNOWN -------- */
    else {
      ws.send(JSON.stringify({ type: "error", error: "Unknown type" }));
    }
  } catch (err) {
    console.error("❌ Invalid message", err);
    ws.send(JSON.stringify({ type: "error", error: "Bad message format" }));
  }
}

/* ================= CONNECTION ================= */

wss.on("connection", (ws) => {
  console.log("✅ Client connected");

  ws.on("message", (msg) => handleClientMessage(ws, msg.toString()));
});
