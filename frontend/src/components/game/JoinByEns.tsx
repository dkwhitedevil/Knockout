import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useResolveEns } from "@/hooks/useResolveEns";

export default function JoinByEns() {
  const [ens, setEns] = useState("");
  const { address: opponent, isLoading } = useResolveEns(ens);
  const { address: me } = useAccount();

  const isValid = ens.includes(".eth") && opponent && !isLoading;

  useEffect(() => {
    console.log("📋 JoinByEns State:", {
      inputEns: ens,
      opponentAddress: opponent,
      isLoading,
      isValid,
      myAddress: me,
    });
  }, [ens, opponent, isLoading, isValid, me]);

  const handleJoin = () => {
    if (!opponent) {
      alert("Could not resolve ENS name. Please check and try again.");
      return;
    }

    if (opponent.toLowerCase() === me?.toLowerCase()) {
      alert("You cannot play against yourself!");
      return;
    }

    console.log("🎮 Create match between:", me, opponent);
    alert("Match created using ENS 🎉");
  };

  return (
    <div className="space-y-3 border p-4 rounded">
      <h3 className="font-bold text-sm">Join by ENS Name</h3>

      <input
        value={ens}
        onChange={(e) => setEns(e.target.value)}
        placeholder="vitalik.eth"
        className="border p-2 w-full text-sm rounded"
      />

      <button
        onClick={handleJoin}
        disabled={!isValid}
        className={`w-full px-4 py-2 font-bold text-sm transition-opacity ${
          isValid
            ? "bg-primary text-white cursor-pointer"
            : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
        }`}
      >
        {isLoading ? "Resolving..." : isValid ? "Join Match →" : "Enter ENS name"}
      </button>

      {opponent && isValid && (
        <p className="text-xs font-mono opacity-60 break-all">✓ Resolved: {opponent}</p>
      )}
    </div>
  );
}
