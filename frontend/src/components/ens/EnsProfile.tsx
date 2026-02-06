import React, { useEffect } from "react";
import { useAccount, useEnsAvatar, useEnsName } from "wagmi";
import { sepolia } from "wagmi/chains";

export default function EnsProfile() {
  const { address, isConnected } = useAccount();

  const { data: name, isLoading: nameLoading, error: nameError } = useEnsName({
    address: address as `0x${string}` | undefined,
    chainId: sepolia.id, // ⭐ Sepolia ENS
  });

  const { data: avatar, isLoading: avatarLoading } = useEnsAvatar({
    name: name || undefined,
    chainId: sepolia.id, // ⭐ Match Sepolia
  });

  useEffect(() => {
    console.log("🔍 ENS Profile Debug:", {
      address,
      isConnected,
      name,
      nameLoading,
      nameError,
      avatar,
    });
  }, [address, name, nameLoading, nameError, avatar, isConnected]);

  useEffect(() => {
    if (nameError) {
      console.warn("❌ ENS lookup error:", nameError);
    }
  }, [nameError]);

  if (!isConnected || !address) {
    return (
      <div className="flex items-center gap-3 border p-2 rounded opacity-50">
        <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse" />
        <div className="flex flex-col flex-1">
          <div className="h-4 bg-gray-300 rounded w-24 animate-pulse" />
          <div className="h-3 bg-gray-300 rounded w-32 mt-1 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border p-2 rounded">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="ENS avatar" className="w-8 h-8 rounded-full" />
      ) : (
        <div className="w-8 h-8 bg-primary text-white flex items-center justify-center text-xs font-bold">
          {address?.slice(2, 4).toUpperCase()}
        </div>
      )}

      <div className="flex flex-col min-w-0">
        <span className="font-bold truncate">
          {nameLoading ? "Loading..." : name ?? `${address?.slice(0, 6)}...${address?.slice(-4)}`}
        </span>
        <span className="text-xs opacity-60 font-mono truncate">{address}</span>
      </div>
    </div>
  );
}
