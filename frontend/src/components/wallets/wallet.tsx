import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Wallet() {
  return (
    <div className="flex items-center">
      <ConnectButton
        showBalance={false}
        accountStatus={{ smallScreen: "address", largeScreen: "address" }}
        chainStatus="none"
      />
    </div>
  );
}
