// Sui client factory (network-aware)
import { SuiJsonRpcClient, JsonRpcHTTPTransport, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { WebSocket } from 'ws';

// Read environment variables in a browser-safe way (Vite uses import.meta.env)
const ENV: Record<string, any> = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : (typeof process !== 'undefined' && process.env ? process.env : {});

const NETWORK = String(ENV.VITE_SUI_NETWORK || ENV.REACT_APP_SUI_NETWORK || 'testnet').toLowerCase();

// Create transport and client with proper SDK v2.3.1 API
const url = getJsonRpcFullnodeUrl(NETWORK as 'testnet' | 'mainnet' | 'devnet');
const transport = new JsonRpcHTTPTransport({ url });

export const suiClient = new SuiJsonRpcClient({
  transport,
  network: NETWORK as 'testnet' | 'mainnet' | 'devnet',
});

export default suiClient;

const YELLOW_SERVER_URL = 'ws://localhost:8081';
let yellowServerConnection: WebSocket | null = null;

export function connectToYellowServer() {
  if (!yellowServerConnection || yellowServerConnection.readyState !== WebSocket.OPEN) {
    yellowServerConnection = new WebSocket(YELLOW_SERVER_URL);

    yellowServerConnection.onopen = () => {
      console.log('✅ Connected to Yellow Server');
    };

    yellowServerConnection.onmessage = (event) => {
      console.log('📨 Message from Yellow Server:', event.data);
      const message = JSON.parse(event.data);

      // Handle server messages here
      if (message.type === 'session_created') {
        console.log('Session created:', message);
      } else if (message.type === 'payment') {
        console.log('Payment processed:', message);
      } else if (message.type === 'error') {
        console.error('Error from server:', message.error);
      }
    };

    yellowServerConnection.onclose = () => {
      console.log('🔴 Disconnected from Yellow Server');
    };

    yellowServerConnection.onerror = (error) => {
      console.error('❌ Yellow Server connection error:', error);
    };
  }
}

export function sendMessageToYellowServer(message: object) {
  if (yellowServerConnection && yellowServerConnection.readyState === WebSocket.OPEN) {
    yellowServerConnection.send(JSON.stringify(message));
  } else {
    console.error('❌ Yellow Server connection is not open');
  }
}
