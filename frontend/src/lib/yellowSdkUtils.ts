import { createAppSessionMessage, parseRPCResponse } from '@erc7824/nitrolite';

// Connect to Yellow Network (using sandbox for testing)
export function connectToYellowNetwork(onMessage: (message: any) => void, onError: (error: any) => void) {
  const ws = new WebSocket('wss://clearnet-sandbox.yellow.com/ws');

  ws.onopen = () => {
    console.log('✅ Connected to Yellow Network!');
  };

  ws.onmessage = (event) => {
    const message = parseRPCResponse(event.data);
    onMessage(message);
  };

  ws.onerror = (error) => {
    console.error('Connection error:', error);
    onError(error);
  };

  console.log('Connecting to Yellow Network...');
  return ws;
}

// Set up message signer for your wallet
export async function setupMessageSigner() {
  if (!window.ethereum) {
    throw new Error('Please install MetaMask');
  }

  // Request wallet connection
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });

  const userAddress = accounts[0];

  // Create message signer function
  const messageSigner = async (message: string) => {
    return await window.ethereum.request({
      method: 'personal_sign',
      params: [message, userAddress]
    });
  };

  console.log('✅ Wallet connected:', userAddress);
  return { userAddress, messageSigner };
}

// Create a session for your payment app
export async function createPaymentSession(ws: WebSocket, messageSigner: (message: string) => Promise<string>, userAddress: string, partnerAddress: string) {
  const appDefinition = {
    protocol: 'payment-app-v1',
    participants: [userAddress, partnerAddress],
    weights: [50, 50],
    quorum: 100,
    challenge: 0,
    nonce: Date.now()
  };

  const allocations = [
    { participant: userAddress, asset: 'usdc', amount: '800000' },
    { participant: partnerAddress, asset: 'usdc', amount: '200000' }
  ];

  const sessionMessage = await createAppSessionMessage(
    messageSigner,
    [{ definition: appDefinition, allocations }]
  );

  ws.send(sessionMessage);
  console.log('✅ Payment session created!');

  return { appDefinition, allocations };
}

// Send instant payments
export async function sendPayment(ws: WebSocket, messageSigner: (message: string) => Promise<string>, amount: bigint, recipient: string, userAddress: string) {
  const paymentData = {
    type: 'payment',
    amount: amount.toString(),
    recipient,
    timestamp: Date.now()
  };

  const signature = await messageSigner(JSON.stringify(paymentData));

  const signedPayment = {
    ...paymentData,
    signature,
    sender: userAddress
  };

  ws.send(JSON.stringify(signedPayment));
  console.log('💸 Payment sent instantly!');
}

// Update balance (example function for handling incoming payments)
export function updateBalance(amount: string, sender: string) {
  console.log(`Received ${amount} from ${sender}`);
  // Update your application state here
}