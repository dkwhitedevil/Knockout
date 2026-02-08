# 🎮 KNOCKOUT Testnet Flow — COMPLETE READY-TO-EXECUTE

## ✅ Your Setup

```
Authority Wallet (Player 1):
0x57a81b62acd3f11e6bb6e973873173b1883367095faeac06218b8e341ebd45a9

New Wallets Created:
Player 2: 0xd5ae0a0c23e195d5fa946f2a7dbe48cf2f80dd8d145e3f72e54b83e4653fceb4
Player 3: 0x75e219453cac26e1bc3180fac182d707727cba873aaab9f9320d7ba06404c091
Player 4: 0xcd0f9fd1667e7aa268fa23f99c0e12494ec0a6389d40f1c1a1f148e58fcc144a

Your Contract Package ID:
0x53258a48aba231b5daa055e8be010fa4a63e5a79e2d6caa38e738053d66f6b48
```

---

## 🚀 EXECUTE THESE COMMANDS IN ORDER

### STEP 0: Wait for Testnet SUI

The faucet was triggered. Wait **30-60 seconds** for players 2, 3, 4 to receive SUI.

Then verify:
```bash
sui client switch --address 0xd5ae0a0c23e195d5fa946f2a7dbe48cf2f80dd8d145e3f72e54b83e4653fceb4
sui client balance
# Should show: 0.5 SUI or similar
```

If no balance after 60 seconds:
```bash
# Manually request from faucet
curl --location --request POST 'https://faucet.testnet.sui.io/gas' \
  --header 'Content-Type: application/json' \
  --data-raw '{"FixedAmountRequest": {"recipient": "0xd5ae0a0c23e195d5fa946f2a7dbe48cf2f80dd8d145e3f72e54b83e4653fceb4"}}'
```

Repeat for players 3 and 4 if needed.

---

### STEP 1️⃣ CREATE MATCH (Copy-Paste Below)

Switch to Player 1 and create match:

```bash
PACKAGE="0x53258a48aba231b5daa055e8be010fa4a63e5a79e2d6caa38e738053d66f6b48"
AUTHORITY="0x57a81b62acd3f11e6bb6e973873173b1883367095faeac06218b8e341ebd45a9"

# Switch to Player 1
sui client switch --address $AUTHORITY

# Get a coin
COIN=$(sui client gas --json | jq '.[] | select(.gasAmount > 100000000)' | jq -r '.gasCoinId' | head -1)

# Create match
sui client call \
  --package $PACKAGE \
  --module game \
  --function create_match \
  --args $AUTHORITY 100000000 4 $COIN \
  --gas-budget 100000000
```

**📍 Copy the MATCH_ID from output** (from "Created Objects"):

```bash
MATCH_ID="0x..." # COPY FROM OUTPUT ABOVE
```

**Verify match created:**
```bash
sui client object $MATCH_ID
```

---

### STEP 2️⃣ PLAYER 2 JOINS

```bash
PACKAGE="0x53258a48aba231b5daa055e8be010fa4a63e5a79e2d6caa38e738053d66f6b48"
PLAYER2="0xd5ae0a0c23e195d5fa946f2a7dbe48cf2f80dd8d145e3f72e54b83e4653fceb4"
MATCH_ID="0x..." # Use your match ID from step 1

# Switch to Player 2
sui client switch --address $PLAYER2

# Get a coin
COIN=$(sui client gas --json | jq '.[] | select(.gasAmount > 100000000)' | jq -r '.gasCoinId' | head -1)

# Join match
sui client call \
  --package $PACKAGE \
  --module game \
  --function join_match \
  --args $MATCH_ID $COIN \
  --gas-budget 100000000
```

---

### STEP 3️⃣ PLAYER 3 JOINS

```bash
PACKAGE="0x53258a48aba231b5daa055e8be010fa4a63e5a79e2d6caa38e738053d66f6b48"
PLAYER3="0x75e219453cac26e1bc3180fac182d707727cba873aaab9f9320d7ba06404c091"
MATCH_ID="0x..." # Use your match ID

# Switch to Player 3
sui client switch --address $PLAYER3

# Get a coin
COIN=$(sui client gas --json | jq '.[] | select(.gasAmount > 100000000)' | jq -r '.gasCoinId' | head -1)

# Join match
sui client call \
  --package $PACKAGE \
  --module game \
  --function join_match \
  --args $MATCH_ID $COIN \
  --gas-budget 100000000
```

---

### STEP 4️⃣ PLAYER 4 JOINS

```bash
PACKAGE="0x53258a48aba231b5daa055e8be010fa4a63e5a79e2d6caa38e738053d66f6b48"
PLAYER4="0xcd0f9fd1667e7aa268fa23f99c0e12494ec0a6389d40f1c1a1f148e58fcc144a"
MATCH_ID="0x..." # Use your match ID

# Switch to Player 4
sui client switch --address $PLAYER4

# Get a coin
COIN=$(sui client gas --json | jq '.[] | select(.gasAmount > 100000000)' | jq -r '.gasCoinId' | head -1)

# Join match
sui client call \
  --package $PACKAGE \
  --module game \
  --function join_match \
  --args $MATCH_ID $COIN \
  --gas-budget 100000000
```

---

### STEP 5️⃣ VERIFY MATCH IS FULL & STARTED

```bash
MATCH_ID="0x..." # Use your match ID

sui client object $MATCH_ID
```

**You must see:**
```
started: true  ✅
players: 4 addresses  ✅
escrow: 400000000  ✅
```

---

### STEP 6️⃣ TEST BACKEND WEBSOCKET VALIDATION

Open a **new terminal** and run:

```bash
cd /Users/dineshkumar/Projects/Knockout/backend

MATCH_ID="0x..."  # Your match ID
PLAYER1="0x57a81b62acd3f11e6bb6e973873173b1883367095faeac06218b8e341ebd45a9"

# Test with valid player (should succeed)
npx ts-node testClient.ts $MATCH_ID $PLAYER1
```

**Expected output:**
```
✅ Successfully joined! Players in room: 1
```

Test with fake player (should fail):
```bash
npx ts-node testClient.ts $MATCH_ID 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
```

**Expected output:**
```
❌ Error: Invalid player or match not started
```

---

### STEP 7️⃣ SETTLE MATCH (AUTHORITY ONLY)

Authority declares Player 1 as winner:

```bash
PACKAGE="0x53258a48aba231b5daa055e8be010fa4a63e5a79e2d6caa38e738053d66f6b48"
AUTHORITY="0x57a81b62acd3f11e6bb6e973873173b1883367095faeac06218b8e341ebd45a9"
WINNER="0x57a81b62acd3f11e6bb6e973873173b1883367095faeac06218b8e341ebd45a9"
MATCH_ID="0x..." # Your match ID

# Switch to authority
sui client switch --address $AUTHORITY

# Get a coin
COIN=$(sui client gas --json | jq '.[] | select(.gasAmount > 100000000)' | jq -r '.gasCoinId' | head -1)

# Finish match
sui client call \
  --package $PACKAGE \
  --module game \
  --function finish_match \
  --args $MATCH_ID $WINNER \
  --gas-budget 100000000
```

---

### STEP 8️⃣ VERIFY WINNER RECEIVED PAYOUT

```bash
WINNER="0x57a81b62acd3f11e6bb6e973873173b1883367095faeac06218b8e341ebd45a9"

# Check balance
sui client balance $WINNER

# Should show increase of 0.4 SUI from escrow
```

---

## ✅ SUCCESS CHECKLIST

- [ ] Players 2, 3, 4 funded with testnet SUI
- [ ] Match created with Player 1
- [ ] Players 2, 3, 4 successfully joined
- [ ] Match shows `started: true` and 4 players
- [ ] Backend WebSocket accepted Player 1, rejected fake player
- [ ] Authority settled match with Player 1 as winner
- [ ] Winner balance increased by 0.4 SUI

---

## 🎉 If All Steps Pass

Your **full Web3 game pipeline is REAL**:

```
✅ Create match on-chain
✅ Players pay entry fees
✅ Smart contract auto-settles on full
✅ Backend validates players
✅ Winner receives escrow
```

**This is hackathon-winning code.** 🏆

---

## 🚀 Next: STEP-3 Game Loop

Once testnet flow is confirmed, we build:

**"build STEP-3 game loop"**

This adds real-time gameplay with automatic winner detection.

