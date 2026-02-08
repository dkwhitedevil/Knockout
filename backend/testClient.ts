import WebSocket from "ws";

/**
 * Test client for STEP-2 WebSocket validation
 * Simulates player joining a match with Sui blockchain validation
 */

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testWebSocket(matchId: string, player: string) {
  return new Promise((resolve) => {
    const ws = new WebSocket("ws://localhost:4000");

    ws.on("open", () => {
      console.log(`\n📤 Sending join request...`);
      console.log(`   matchId: ${matchId}`);
      console.log(`   player:  ${player}`);

      ws.send(
        JSON.stringify({
          type: "join",
          matchId,
          player,
        })
      );
    });

    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      console.log(`\n✅ Received from server:`, msg);

      if (msg.type === "error") {
        console.log(`\n❌ Error: ${msg.message}`);
      } else if (msg.type === "player_joined") {
        console.log(`\n✅ Successfully joined! Players in room: ${msg.count}`);
      }

      ws.close();
      resolve(true);
    });

    ws.on("error", (err) => {
      console.error("\n❌ WebSocket error:", err.message);
      resolve(false);
    });

    ws.on("close", () => {
      setTimeout(() => resolve(true), 100);
    });
  });
}

async function main() {
  console.log("\n🎮 KNOCKOUT STEP-2 — WebSocket Client Test");
  console.log("=".repeat(50));

  // Test 1: Valid player (should work if match exists on chain)
  console.log("\n📝 TEST 1 — Valid Player from Match");
  const validMatch =
    process.argv[2] || "0x1234567890abcdef1234567890abcdef";
  const validPlayer =
    process.argv[3] || "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  await testWebSocket(validMatch, validPlayer);

  await sleep(1000);

  // Test 2: Invalid player (should reject)
  console.log("\n\n📝 TEST 2 — Invalid Player (Not in Match)");
  const fakePlayer =
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

  await testWebSocket(validMatch, fakePlayer);

  console.log("\n" + "=".repeat(50));
  console.log("✨ Test complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
