#!/bin/bash
# 🎮 KNOCKOUT — Full Testnet Flow (Ready to Execute)
# Copy these commands one by one into your terminal

echo "🎮 KNOCKOUT STEP-2 — Complete Testnet Flow"
echo "==========================================="
echo ""
echo "✅ Setup Summary:"
echo "   Authority: 0x57a81b62acd3f11e6bb6e973873173b1883367095faeac06218b8e341ebd45a9"
echo "   Package:   0x53258a48aba231b5daa055e8be010fa4a63e5a79e2d6caa38e738053d66f6b48"
echo ""
echo "Players created:"
echo "   Player 1: 0x57a81b62acd3f11e6bb6e973873173b1883367095faeac06218b8e341ebd45a9"
echo "   Player 2: 0xd5ae0a0c23e195d5fa946f2a7dbe48cf2f80dd8d145e3f72e54b83e4653fceb4"
echo "   Player 3: 0x75e219453cac26e1bc3180fac182d707727cba873aaab9f9320d7ba06404c091"
echo "   Player 4: 0xcd0f9fd1667e7aa268fa23f99c0e12494ec0a6389d40f1c1a1f148e58fcc144a"
echo ""
echo "==========================================="
echo ""
echo "MAKE SURE ALL PLAYERS HAVE TESTNET SUI:"
echo "Wait 30 seconds for faucet to process, then:"
echo ""

PLAYER1="0x57a81b62acd3f11e6bb6e973873173b1883367095faeac06218b8e341ebd45a9"
PLAYER2="0xd5ae0a0c23e195d5fa946f2a7dbe48cf2f80dd8d145e3f72e54b83e4653fceb4"
PLAYER3="0x75e219453cac26e1bc3180fac182d707727cba873aaab9f9320d7ba06404c091"
PLAYER4="0xcd0f9fd1667e7aa268fa23f99c0e12494ec0a6389d40f1c1a1f148e58fcc144a"

PACKAGE="0x53258a48aba231b5daa055e8be010fa4a63e5a79e2d6caa38e738053d66f6b48"

echo "sudo -u $(whoami) sui client switch --address $PLAYER1 && sui client balance"
