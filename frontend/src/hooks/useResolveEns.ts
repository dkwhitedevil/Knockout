import { useEnsAddress } from "wagmi";
import { useEffect } from "react";
import { sepolia } from "wagmi/chains";

export function useResolveEns(name?: string) {
  const { data: address, isLoading, error } = useEnsAddress({
    name: name || undefined,
    chainId: sepolia.id,   // ⭐ Sepolia ENS
  });

  useEffect(() => {
    console.log("🔍 ENS Resolution Debug:", {
      inputName: name,
      resolvedAddress: address,
      isLoading,
      error,
    });
  }, [name, address, isLoading, error]);

  if (error) {
    console.warn("❌ ENS resolution error:", error);
  }

  return { address, isLoading, error };
}