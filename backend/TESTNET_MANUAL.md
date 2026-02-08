# 🎮 KNOCKOUT — Testnet Manual Flow Guide

## Prerequisites

Before starting, you need:

1. ✅ **Contract published on Sui testnet**
2. ✅ **4+ testnet wallets with SUI** (at least 0.5 SUI each)
3. ✅ **Package ID from contract deployment**

---

## 🚀 Step-by-Step Testnet Execution

### BEFORE YOU START

Get your values ready:

```bash
# Get your current address
AUTHORITY=$(sui client active-address)

# Get list of all your addresses
sui client addresses

# Get your testnet contract package ID (from deployment output)
PACKAGE_ID="0x..." # You have this from move deployment

# Get a coin from your current wallet
COIN=$(sui client gas --json | jq '.[] | select(.gasAmount > 100000000)' | jq -r '.gasCoinId' | head -1)
```

If you don't have testnet SUI, get it from the faucet:
```bash
curl --location --request POST 'https://faucet.testnet.sui.io/gas' \
  --header 'Content-Type: application/json' \
  --data-raw '{"FixedAmountRequest": {"recipient": "'$(sui client active-address)'"}}'
```

---

## STEP 1️⃣ CREATE MATCH (Player 1 creates)

```bash
# Set variables
AUTHORITY=$(sui client active-address)
PACKAGE_ID="0x..." # YOUR package ID
COIN=$(sui client gas --json | jq '.[] | select(.gasAmount > 100000000)' | jq -r '.gasCoinId' | head -1)

# Create match
sui client call \
  --package $PACKAGE_ID \
  --module game \
  --function create_match \
  --args $AUTHORITY 100000000 4 $COIN \
  --gas-budget 100000000
```

**Expected output:**
```
Transaction executed successfully
Created Objects:
  0x... <- MATCH_ID (copy this!)
```

**Save the MATCH_ID:**
```bash
MATCH_ID="0x..." # from above
```

**Verify:**
```bash
sui client object $MATCH_ID
```

You should see:
```
started: false
players: [1 address - yours]
escrow: 100000000
```

---

## STEP 2️⃣ JOIN WITH PLAYER 2

```bash
# Switch to Player 2 wallet
sui client switch --address <PLAYER2_ADDRESS>

# Get a coin
COIN=$(sui client gas --json | jq '.[] | select(.gasAmount > 100000000)' | jq -r '.gasCoinId' | head -1)

# Join the match
sui client call \
  --package $PACKAGE_ID \
  --module game \
  --function join_match \
  --args $MATCH_ID $COIN \
  --gas-budget 100000000
```

**Expected:** Transaction succeeds

---

## STEP 3️⃣ JOIN WITH PLAYER 3

```bash
# Switch to Player 3 wallet
sui client switch --address <PLAYER3_ADDRESS>

# Get a coin
COIN=$(sui client gas --json | jq '.[] | select(.gasAmount > 100000000)' | jq -r '.gasCoinId' | head -1)

# Join the match
sui client call \
  --package $PACKAGE_ID \
  --module game \
  --function join_match \
  --args $MATCH_ID $COIN \
  --gas-budget 100000000
```

---

## STEP 4️⃣ JOIN WITH PLAYER 4

```bash
# Switch to Player 4 wallet
sui client switch --address <PLAYER4_ADDRESS>

# Get a coin
COIN=$(sui client gas --json | jq '.[] | select(.gasAmount > 100000000)' | jq -r '.gasCoinId' | head -1)

# Join the match
sui client call \
  --package $PACKAGE_ID \
  --module game \
  --function join_match \
  --args $MATCH_ID $COIN \
  --gas-budget 100000000
```

---

## STEP 5️⃣ VERIFY MATCH IS FULL & STARTED

```bash
sui client object $MATCH_ID
```

**Must show:**
```
started: true        ✅
players: 4 addresses ✅
escrow: 400000000    ✅ (0.4 SUI)
```

If `started` is still `false`, players didn't join correctly.

---

## STEP 6️⃣ TEST BACKEND WEBSOCKET VALIDATION

The backend should now accept players from this match.

```bash
# In a new terminal, run:
cd /Users/dineshkumar/Projects/Knockout/backend

# Test with Player 1's address
PLAYER1=<PLAYER1_ADDRESS>  # from step 1
npx ts-node testClient.ts $MATCH_ID $PLAYER1
```

**Expected output:**
```
✅ Successfully joined! Players in room: 1
```

Try with a fake address (should fail):
```bash
npx ts-node testClient.ts $MATCH_ID 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
```

**Expected output:**
```
❌ Error: Invalid player or match not started
```

---

## STEP 7️⃣ FINISH MATCH (Authority only)

Authority settles the match and declares a winner.

```bash
# Switch to authority wallet
sui client switch --address $AUTHORITY

# Get a coin for gas
COIN=$(sui client gas --json | jq '.[] | select(.gasAmount > 100000000)' | jq -r '.gasCoinId' | head -1)

# Call finish_match with a winner (e.g., PLAYER1)
WINNER=<PLAYER1_ADDRESS>

sui client call \
  --package $PACKAGE_ID \
  --module game \
  --function finish_match \
  --args $MATCH_ID $WINNER \
  --gas-budget 100000000
```

**Expected:** Transaction succeeds

---

## STEP 8️⃣ VERIFY WINNER RECEIVED PAYOUT

```bash
# Check balance before (should have been lower)
sui client balance $WINNER

# Expected: +0.4 SUI (the escrow amount)
```

---

## ✅ Complete Success Criteria

If all steps succeeded:

- [ ] Match created with 1 player
- [ ] Players 2, 3, 4 joined successfully
- [ ] Match shows `started: true, players: 4`
- [ ] Escrow shows `400000000 MIST` (0.4 SUI)
- [ ] Backend accepted valid player with WebSocket
- [ ] Backend rejected fake player address
- [ ] Authority finished match with winner
- [ ] Winner balance increased by 0.4 SUI

---

## 🎉 You're Done!

Your Web3 multiplayer game is **fully operational on testnet**.

The complete flow works:
```
create → join → validate → settle → payout
```

This is **hackathon-winning infrastructure**.

---

## 🚀 Next: STEP-3 Game Loop

To make the game **fully playable** with real-time turns:

Request: **"build STEP-3 game loop"**

This adds:
- Real-time move validation
- Automatic winner detection
- One-click settlement
- Instant payouts

