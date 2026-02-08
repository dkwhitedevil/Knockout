#!/bin/bash
# 🎮 KNOCKOUT — Full Testnet Flow Execution Script
# This script walks you through the complete game flow on testnet
# You'll need: Contract deployed, 4+ testnet wallets with SUI

set -e

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "🎮 KNOCKOUT STEP-2 — Complete Testnet Flow"
echo "══════════════════════════════════════════════════════════════════"
echo ""

# ============ SETUP ============
echo "📋 SETUP: Configure these values"
echo ""
echo "You need:"
echo "  1. Contract PACKAGE_ID (from deployment)"
echo "  2. Authority address (match creator)"
echo "  3. Four player addresses (with testnet SUI)"
echo ""

# Prompt for values
read -p "Enter CONTRACT PACKAGE_ID: " PACKAGE_ID
read -p "Enter AUTHORITY address (or press Enter for current): " AUTHORITY_INPUT

if [ -z "$AUTHORITY_INPUT" ]; then
    AUTHORITY=$(sui client active-address)
    echo "✅ Using current address: $AUTHORITY"
else
    AUTHORITY=$AUTHORITY_INPUT
fi

# Store these for reference
echo ""
echo "📝 Saving configuration..."
echo "PACKAGE_ID=$PACKAGE_ID" > testnet_flow.config
echo "AUTHORITY=$AUTHORITY" >> testnet_flow.config
echo "✅ Config saved to testnet_flow.config"

# ============ STEP 1: CREATE MATCH ============
echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "STEP 1️⃣ : CREATE MATCH"
echo "══════════════════════════════════════════════════════════════════"
echo ""

echo "Switching to authority wallet..."
sui client switch --address "$AUTHORITY"

echo ""
echo "Getting available coins..."
COINS=$(sui client gas --json | jq '.[] | select(.gasAmount > 100000000)' | jq -r '.gasCoinId' | head -1)

if [ -z "$COINS" ]; then
    echo "❌ No coins found. Request testnet SUI:"
    echo "curl --location --request POST 'https://faucet.testnet.sui.io/gas' \\"
    echo "  --header 'Content-Type: application/json' \\"
    echo "  --data-raw '{\"FixedAmountRequest\": {\"recipient\": \"'$AUTHORITY'\"}}'"
    exit 1
fi

COIN_OBJECT=$COINS
echo "✅ Using coin: $COIN_OBJECT"

echo ""
echo "📤 Creating match..."
echo ""
echo "Command:"
echo "sui client call \\"
echo "  --package $PACKAGE_ID \\"
echo "  --module game \\"
echo "  --function create_match \\"
echo "  --args $AUTHORITY 100000000 4 $COIN_OBJECT \\"
echo "  --gas-budget 100000000"
echo ""

MATCH_TX=$(sui client call \
  --package "$PACKAGE_ID" \
  --module game \
  --function create_match \
  --args "$AUTHORITY" 100000000 4 "$COIN_OBJECT" \
  --gas-budget 100000000 --json)

# Extract match ID from transaction
MATCH_ID=$(echo "$MATCH_TX" | jq -r '.objectChanges[] | select(.type=="Created") | .objectId' | grep -v "$AUTHORITY" | head -1)

if [ -z "$MATCH_ID" ]; then
    echo "❌ Failed to create match"
    echo "$MATCH_TX" | jq '.'
    exit 1
fi

echo "✅ Match created!"
echo "   MATCH_ID=$MATCH_ID"
echo ""
echo "Saving..."
echo "MATCH_ID=$MATCH_ID" >> testnet_flow.config

# Verify match
echo ""
echo "✓ Verifying match on chain..."
MATCH_OBJ=$(sui client object "$MATCH_ID" --json)
STARTED=$(echo "$MATCH_OBJ" | jq '.data.content.fields.started')
PLAYERS_COUNT=$(echo "$MATCH_OBJ" | jq '.data.content.fields.players | length')
ESCROW=$(echo "$MATCH_OBJ" | jq '.data.content.fields.escrow.value')

echo "   started: $STARTED (should be false)"
echo "   players: $PLAYERS_COUNT (should be 1)"
echo "   escrow: $ESCROW"

# ============ STEP 2: JOIN WITH 3 MORE PLAYERS ============
echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "STEP 2️⃣ : JOIN WITH 3 MORE PLAYERS"
echo "══════════════════════════════════════════════════════════════════"
echo ""

echo "You need 3 more testnet wallets. Do you have them ready? (yes/no)"
read -p "> " HAVE_WALLETS

if [ "$HAVE_WALLETS" != "yes" ]; then
    echo ""
    echo "📝 To get testnet addresses:"
    echo "   sui client new-address ed25519  # Create 3 new wallets"
    echo ""
    echo "📝 To get testnet SUI:"
    echo "   curl --location --request POST 'https://faucet.testnet.sui.io/gas' \\"
    echo "   --header 'Content-Type: application/json' \\"
    echo "   --data-raw '{\"FixedAmountRequest\": {\"recipient\": \"<ADDRESS>\"}}'"
    echo ""
    echo "Run this again when ready with 3 addresses."
    exit 0
fi

for i in 2 3 4; do
    echo ""
    echo "Player $i:"
    read -p "Enter PLAYER${i}_ADDRESS: " PLAYER_ADDR
    read -p "Enter PLAYER${i}_COIN_ID: " PLAYER_COIN

    echo "Switching to player $i..."
    sui client switch --address "$PLAYER_ADDR"

    echo "Calling join_match..."
    sui client call \
      --package "$PACKAGE_ID" \
      --module game \
      --function join_match \
      --args "$MATCH_ID" "$PLAYER_COIN" \
      --gas-budget 100000000

    echo "✅ Player $i joined"
    echo "PLAYER${i}_ADDRESS=$PLAYER_ADDR" >> testnet_flow.config
done

# ============ STEP 3: VERIFY MATCH STARTED ============
echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "STEP 3️⃣ : VERIFY MATCH STARTED"
echo "══════════════════════════════════════════════════════════════════"
echo ""

echo "Checking match on chain..."
MATCH_OBJ=$(sui client object "$MATCH_ID" --json)
STARTED=$(echo "$MATCH_OBJ" | jq '.data.content.fields.started')
PLAYERS_COUNT=$(echo "$MATCH_OBJ" | jq '.data.content.fields.players | length')
ESCROW=$(echo "$MATCH_OBJ" | jq '.data.content.fields.escrow.value')

echo "   started: $STARTED (should be true ✓)"
echo "   players: $PLAYERS_COUNT (should be 4 ✓)"
echo "   escrow: $ESCROW (should be 400000000 ✓)"

if [ "$STARTED" == "true" ] && [ "$PLAYERS_COUNT" -eq 4 ]; then
    echo "✅ Match successfully started!"
else
    echo "❌ Match not properly initialized"
    exit 1
fi

# ============ STEP 4: TEST BACKEND WEBSOCKET ============
echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "STEP 4️⃣ : TEST BACKEND WEBSOCKET VALIDATION"
echo "══════════════════════════════════════════════════════════════════"
echo ""

PLAYER1=$(sui client active-address)

echo "Testing WebSocket validation..."
echo ""
echo "Command:"
echo "cd /Users/dineshkumar/Projects/Knockout/backend"
echo "npx ts-node testClient.ts $MATCH_ID $PLAYER1"
echo ""

read -p "Run this now? (yes/no) > " RUN_WS

if [ "$RUN_WS" == "yes" ]; then
    cd /Users/dineshkumar/Projects/Knockout/backend
    npx ts-node testClient.ts "$MATCH_ID" "$PLAYER1"
    cd -
fi

# ============ STEP 5: FINISH MATCH ============
echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "STEP 5️⃣ : FINISH MATCH (AUTHORITY ONLY)"
echo "══════════════════════════════════════════════════════════════════"
echo ""

read -p "Enter WINNER_ADDRESS: " WINNER

echo "Switching to authority..."
sui client switch --address "$AUTHORITY"

echo ""
echo "Calling finish_match..."
sui client call \
  --package "$PACKAGE_ID" \
  --module game \
  --function finish_match \
  --args "$MATCH_ID" "$WINNER" \
  --gas-budget 100000000

echo "✅ Match finished!"

# ============ STEP 6: VERIFY PAYOUT ============
echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "STEP 6️⃣ : VERIFY WINNER PAYOUT"
echo "══════════════════════════════════════════════════════════════════"
echo ""

echo "Checking winner balance..."
sui client balance "$WINNER"

echo ""
echo "✅ Full game flow complete!"
echo ""
echo "📊 Configuration saved in: testnet_flow.config"
cat testnet_flow.config

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "🎉 SUCCESS! Your Web3 game is working"
echo "══════════════════════════════════════════════════════════════════"
echo ""
