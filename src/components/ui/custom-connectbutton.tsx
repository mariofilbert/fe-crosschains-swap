import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function CustomConnectButton({ label = 'Connect Wallet' }) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected = ready && account && chain;

        return (
          <div
            aria-hidden={!ready}
            style={{
              opacity: ready ? 1 : 0,
              pointerEvents: ready ? 'auto' : 'none',
              userSelect: ready ? 'auto' : 'none',
            }}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className="bg-[#1A88F8] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#1476D8] transition"
              >
                {label}
              </button>
            ) : (
              <div className="text-white text-sm">{account.displayName}</div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
