import fs from 'fs';
import path, { dirname } from 'path';
import { WebSocketServer } from 'ws';
import pkg from '@erc7824/nitrolite';
const { createAppSessionMessage, RPCAppDefinition, RPCAppSessionAllocation, RPCProtocolVersion } = pkg;
import { WebSocket } from 'ws';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT: number = 8081;
const wss = new WebSocketServer({ port: PORT });
const OFFLINE_STORAGE_PATH = path.resolve(__dirname, 'offlineStorage.json');

console.log(`🟢 Yellow Server is running on ws://localhost:${PORT}`);

// Function to save game state locally
function saveGameStateLocally(gameState: any) {
  try {
    fs.writeFileSync(OFFLINE_STORAGE_PATH, JSON.stringify(gameState, null, 2));
    console.log('💾 Game state saved locally');
  } catch (error) {
    console.error('❌ Failed to save game state locally:', error);
  }
}

// Function to load game state from local storage
function loadGameState(): any {
  try {
    if (fs.existsSync(OFFLINE_STORAGE_PATH)) {
      const data = fs.readFileSync(OFFLINE_STORAGE_PATH, 'utf-8');
      console.log('📂 Game state loaded from local storage');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('❌ Failed to load game state from local storage:', error);
  }
  return null;
}

// Initialize game state
let gameState = loadGameState() || {};

// Correct the type for createAppSessionMessage
function handleClientMessage(ws: WebSocket, message: string) {
  try {
    const parsedMessage = JSON.parse(message);

    if (parsedMessage.type === 'create_session') {
      const { userAddress, partnerAddress, messageSigner } = parsedMessage;

      // Update protocol to match the expected type
      const appDefinition: RPCAppDefinition = {
        protocol: RPCProtocolVersion.NitroRPC_0_2, // Updated to valid protocol version
        application: 'knockout-game', // Added required application property
        participants: [userAddress, partnerAddress],
        weights: [50, 50],
        quorum: 100,
        challenge: 0,
        nonce: Date.now(),
      };

      const allocations: RPCAppSessionAllocation[] = [
        { participant: userAddress, asset: 'sui', amount: '800000' },
        { participant: partnerAddress, asset: 'sui', amount: '200000' },
      ];

      // Add session_data property to match the expected type
      const sessionData = JSON.stringify({ gameId: 'game-123', timestamp: Date.now() });

      createAppSessionMessage(messageSigner, { definition: appDefinition, allocations, session_data: sessionData })
        .then((sessionMessage) => {
          ws.send(
            JSON.stringify({
              type: 'session_created',
              sessionId: 'session-id',
              participants: [userAddress, partnerAddress],
            })
          );
          console.log('✅ Payment session created!');
        })
        .catch((error) => {
          ws.send(
            JSON.stringify({
              type: 'error',
              error: 'Failed to create session',
            })
          );
          console.error('❌ Error creating session:', error);
        });
    } else if (parsedMessage.type === 'payment') {
      ws.send(
        JSON.stringify({
          type: 'payment',
          amount: parsedMessage.amount,
          sender: parsedMessage.sender,
          recipient: parsedMessage.recipient,
        })
      );
      console.log('💸 Payment processed and response sent');
    } else if (parsedMessage.type === 'gameStateUpdate') {
      // Update game state
      gameState = parsedMessage.payload;
      console.log('Game state updated:', gameState);

      // Log the game state change
      logGameStateChange(`Game state updated: ${JSON.stringify(gameState)}`);

      // Broadcast updated game state to all clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'gameStateUpdate', payload: gameState }));
        }
      });
    } else {
      ws.send(
        JSON.stringify({
          type: 'error',
          error: 'Unknown message type',
        })
      );
      console.error('❌ Unknown message type received');
    }
  } catch (err) {
    ws.send(
      JSON.stringify({
        type: 'error',
        error: 'Invalid message format',
      })
    );
    console.error('❌ Error parsing message:', (err as Error).message);
  }
}

// Function to log game state changes to a log file
function logGameStateChange(logMessage: string) {
  const logFilePath = path.resolve(__dirname, 'gameLog.txt');
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${logMessage}\n`;

  try {
    fs.appendFileSync(logFilePath, logEntry);
    console.log('📝 Game log updated');
  } catch (error) {
    console.error('❌ Failed to update game log:', error);
  }
}

// Update WebSocket connection to use the new handler
wss.on('connection', (ws) => {
  console.log('✅ Client connected');

  ws.on('message', (message: string) => {
    handleClientMessage(ws, message);
  });
});