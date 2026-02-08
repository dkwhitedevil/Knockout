import { WebSocketServer } from 'ws';

const PORT: number = 8081;
const wss = new WebSocketServer({ port: PORT });

console.log(`🟢 Mock Yellow Server is running on ws://localhost:${PORT}`);

wss.on('connection', (ws: WebSocket) => {
  console.log('✅ Client connected');

  ws.on('message', (message: string) => {
    console.log('📨 Received:', message);

    try {
      const parsedMessage = JSON.parse(message);

      // Handle different message types
      if (parsedMessage.type === 'session') {
        ws.send(
          JSON.stringify({
            type: 'session_created',
            sessionId: 'mock-session-id',
            participants: parsedMessage.participants,
          })
        );
        console.log('✅ Session created and response sent');
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
  });

  ws.on('close', () => {
    console.log('🔴 Client disconnected');
  });
});