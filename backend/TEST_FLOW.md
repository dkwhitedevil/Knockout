# 🎮 KNOCKOUT — Full Game Flow Terminal Test

**Status**: STEP-2 Backend Server ✅ Running on port 4000

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- ✅ **Contract published on testnet** (save package ID)
- ✅ **4 testnet wallets with SUI** (0.5+ SUI each recommended)
- ✅ **Backend STEP-2 running**: `npx ts-node server.ts` (already running)
- ✅ **Know your current wallet address**: `sui client active-address`

---

## 🚀 Full Testnet Flow (Step-by-Step)

### **STEP 1: Create Match** (Player 1 creates + enters)

```bash
# Set your variables
PACKAGE_ID="0x53258a48aba231b5daa055e8be010fa4a63e5a79e2d6caa38e738053d66f6b48"
AUTHORITY=$(sui client active-address)
MATCH_CREATOR=$(sui client active-address)

# Get a coin to pay entry fee
COIN_OBJECT=$(sui client objects --owned | grep "0x" | head -1 | awk '{print $1}')

# Create the match
sui client call \
  --package $PACKAGE_ID \
  --module game \
  --function create_match \
  --args $AUTHORITY 100000000 4 $COIN_OBJECT \
  --gas-budget 100000000
```

**Copy the MATCH_ID from output:**
```bash
MATCH_ID="0x..." # from "Created Objects"
```

**Verify match state:**
```bash
sui client object $MATCH_ID
```

Should show:
```
started: false
players: [1 address - yours]
escrow: 100000000
```

---

### **STEP 2: Join Match with 3 More Players**

For each of Players 2, 3, and 4:

```bash
# Switch to Player 2
sui client switch --address <PLAYER2_ADDRESS>

# Get a SUI coin
COIN_OBJECT=$(sui client objects --owned | grep "0x" | head -1 | awk '{print $1}')

# Join the match
sui client call \
  --package $PACKAGE_ID \
  --module game \
  --function join_match \
  --args $MATCH_ID $COIN_OBJECT \
  --gas-budget 100000000
```

**Repeat for PLAYER3 and PLAYER4.**

---

### **STEP 3: Verify Match Started**

After all 4 players join:

```bash
sui client object $MATCH_ID
```

**Must show:**
```
started: true  ✅
players: 4 addresses
escrow: 400000000 (0.4 SUI)
```

✅ **On-chain flow correct → Match escrow locked**

---

### **STEP 4: Test Backend WebSocket Validation**

Open a new terminal and test the server response:

```bash
# Run the client test (requires MATCH_ID and PLAYER1_ADDRESS)
cd /Users/dineshkumar/Projects/Knockout/backend

npx ts-node testClient.ts $MATCH_ID $PLAYER1_ADDRESS
```

**Expected output:**
```
✅ Successfully joined! Players in room: 1
❌ Error: Invalid player or match not started (for fake player)
```

✅ **STEP-2 bridge working → Server validates against Sui**

---

### **STEP 5: Finish Match (Authority Only)**

Switch back to authority wallet:

```bash
sui client switch --address $AUTHORITY

# Get a SUI coin for gas
COIN_OBJECT=$(sui client objects --owned | grep "0x" | head -1 | awk '{print $1}')

# Call finish_match with PLAYER1 as winner
sui client call \
  --package $PACKAGE_ID \
  --module game \
  --function finish_match \
  --args $MATCH_ID $PLAYER1_ADDRESS \
  --gas-budget 100000000
```

---

### **STEP 6: Verify Winner Received Payout**

Check Player 1's balance before and after:

```bash
# Check winner balance
sui client balance $PLAYER1_ADDRESS

# Compare to earlier balance — should be +0.4 SUI
```

✅ **Full economic circle complete → Winner gets escrow**

---

## 🎯 Success Criteria

| Step | Expected Result | Status |
|------|-----------------|--------|
| 1 | Match created, 1 player inside | ⬜ |
| 2 | 4 players joined, escrow = 0.4 SUI | ⬜ |
| 3 | `started: true` on-chain | ⬜ |
| 4 | Server accepts valid player, rejects invalid | ⬜ |
| 5 | Authority can settle match | ⬜ |
| 6 | Winner balance increased by 0.4 SUI | ⬜ |

---

## 🔥 If ALL Pass → You have a REAL Web3 game

```
✅ On-chain escrow holding funds
✅ Web3 player validation
✅ Blockchain settlement with payout
```

**This is hackathon-winning infrastructure.**

---

## 📝 Useful Commands

```bash
# Check current wallet
sui client active-address

# List wallets
sui client addresses

# Switch wallet
sui client switch --address <ADDRESS>

# Check balance
sui client balance <ADDRESS>

# See owned objects
sui client objects --owned

# Read object
sui client object <OBJECT_ID>

# Get testnet faucet
curl --location --request POST 'https://faucet.testnet.sui.io/gas' \
  --header 'Content-Type: application/json' \
  --data-raw '{"FixedAmountRequest": {"recipient": "'$(sui client active-address)'"}}'
```

---

## 🚀 Next: STEP-3

After confirming all steps pass, we build:

**Real-time gameplay + automatic winner settling**

That completes the full multiplayer loop:
```
join → play → auto-settle → payout
```

**Say: "Terminal flow passed" when ready for STEP-3**

