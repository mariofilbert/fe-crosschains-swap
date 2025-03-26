import CrossChainSwap from '@/components/cross-chain-swap';
import { ConnectButton } from '@rainbow-me/rainbowkit';
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-900 to-slate-800">
      <CrossChainSwap />
      {/* <ConnectButton /> */}
    </main>
  );
}
