import { useCurrentAccount } from '@mysten/dapp-kit';
import { BrowserProvider, verifyMessage } from 'ethers';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

import { BrutalButton } from '@/components/ui/BrutalButton';

export default function Wallet() {
  const suiAccount = useCurrentAccount();
  const suiAddress = suiAccount?.address ?? null;
  const { toast } = useToast();
  const [linking, setLinking] = useState(false);

  const handleLinkEthereum = async () => {
    setLinking(true);
    try {
      if (!suiAddress) throw new Error('Connect your Sui wallet first');
      if (!(window as any).ethereum) throw new Error('No Ethereum provider found');
      const provider = new BrowserProvider((window as any).ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const ethAddress = await signer.getAddress();

      // Resolve ENS name and avatar (best-effort)
      let ensName: string | null = null;
      let ensAvatar: string | null = null;
      try {
        ensName = await provider.lookupAddress(ethAddress);
        if (ensName) {
          const resolver = await provider.getResolver(ensName);
          if (resolver && resolver.getText) {
            try {
              ensAvatar = await resolver.getText('avatar');
            } catch {}
          }
        }
      } catch (e) {
        console.debug('ENS lookup failed', e);
      }

      // Sign linking message
      const timestamp = Date.now();
      const message = `Link Sui:${suiAddress} to Ethereum:${ethAddress}\nTimestamp:${timestamp}`;
      const signature = await signer.signMessage(message);
      const recovered = verifyMessage(message, signature);
      if (recovered.toLowerCase() !== ethAddress.toLowerCase()) throw new Error('Signature mismatch');

      const payload = {
        sui_address: suiAddress,
        eth_address: ethAddress,
        ens_name: ensName,
        ens_avatar: ensAvatar,
        created_at: new Date().toISOString(),
      };

      
      toast({ title: 'Identity linked', description: 'Sui and Ethereum identities linked successfully.' });
      try {
        // broadcast to the app that an identity was linked so other components can update
        window.dispatchEvent(new CustomEvent('identity:linked', { detail: payload }));
      } catch (e) {
        console.debug('Could not dispatch identity:linked event', e);
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Linking failed', description: e?.message ?? String(e) });
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="flex items-center">
      <BrutalButton
        variant="primary"
        size="default"
        shadow="accent"
        onClick={handleLinkEthereum}
        disabled={!suiAddress || linking}
        style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
      >
        {linking ? 'Linking…' : 'Link Ethereum'}
      </BrutalButton>
    </div>
  );
}
