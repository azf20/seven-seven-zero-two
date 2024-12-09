import { useState } from "react";
import { formatEther } from "viem";
import { Modal } from "~~/components/common/Modal";
import { Address } from "~~/components/scaffold-eth";
import { useEIP7702BatchTransactor } from "~~/hooks/eip-7702/useEIP7702BatchTransactor";
import { WalletData } from "~~/hooks/useBurnerWallets";


interface BalanceDisplayProps {
  value: string;
  label: string;
  onRequest?: () => void;
  disabled?: boolean;
}

const BalanceDisplay = ({ value, label, onRequest, disabled }: BalanceDisplayProps) => (
  <div className="flex items-center gap-2 text-sm sm:text-base">
    <span className="truncate">
      {Number(Number(value).toFixed(5))} <span className="sm:hidden">{label}</span>
    </span>
    {onRequest && (
      <button
        onClick={onRequest}
        className="bg-blue-500 hover:bg-blue-700 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm disabled:opacity-50 flex-shrink-0"
        disabled={disabled}
      >
        +
      </button>
    )}
  </div>
);

interface WalletInformationProps {
  wallet: WalletData;
  allWallets: WalletData[];
  createNewWallet: () => Promise<void>;
}

export const EIP7702BatchTransactor = ({ wallet, allWallets, createNewWallet }: WalletInformationProps) => {
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const {
    isDelegated,
    balance,
    freeTokenBalance,
    buyableTokenBalance,
    handleRequestEth,
    handleRequestFreeToken,
    handleRequestBuyableToken,
    dropTokens,
    moveEverything,
    isLoading,
  } = useEIP7702BatchTransactor(wallet);

  const hasBalance = Number(formatEther(balance)) > 0;
  const hasAnyAssets =
    hasBalance || Number(formatEther(freeTokenBalance)) > 0 || Number(formatEther(buyableTokenBalance)) > 0;

  const handleMove = async (destinationAddress: string) => {
    await moveEverything(destinationAddress);
    setIsMoveModalOpen(false);
  };

  return (
    <>
      <div className="border p-2 sm:p-4 rounded grid grid-cols-1 sm:grid-cols-6 gap-2 sm:gap-4">
        <div className="text-sm sm:text-base">
          <Address address={wallet.address} />
        </div>
        <div className="text-left sm:text-left">
          <span className="sm:hidden">{"EIP-7702 "}</span>
          {isDelegated ? "✅" : "❌"}
        </div>
        <BalanceDisplay
          value={formatEther(balance)}
          label="ETH"
          onRequest={hasBalance ? handleRequestEth : undefined}
          disabled={isLoading}
        />
        <BalanceDisplay
          value={formatEther(freeTokenBalance)}
          label="Free Tokens"
          onRequest={hasBalance ? handleRequestFreeToken : undefined}
          disabled={isLoading}
        />
        <BalanceDisplay
          value={formatEther(buyableTokenBalance)}
          label="Buyable Tokens"
          onRequest={hasBalance ? handleRequestBuyableToken : undefined}
          disabled={isLoading}
        />
        <div className="flex gap-2 justify-center sm:justify-start">
          {!hasAnyAssets && (
            <button
              onClick={dropTokens}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 sm:py-2 sm:px-4 rounded text-sm sm:text-base"
              disabled={isLoading}
            >
              Drop
            </button>
          )}
          {hasAnyAssets && (
            <button
              onClick={() => setIsMoveModalOpen(true)}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-1 px-3 sm:py-2 sm:px-4 rounded text-sm sm:text-base"
              disabled={isLoading}
            >
              Move
            </button>
          )}
        </div>
      </div>

      <Modal isOpen={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)} title="Select Destination Wallet">
        <div className="space-y-2">
          {allWallets
            .filter(w => w.address !== wallet.address)
            .map(destinationWallet => (
              <button
                key={destinationWallet.address}
                onClick={() => handleMove(destinationWallet.address)}
                className="w-full text-left p-2 hover:bg-blue-600 rounded disabled:opacity-50 text-sm sm:text-base"
                disabled={isLoading}
              >
                <Address disableAddressLink={true} address={destinationWallet.address} />
              </button>
            ))}
          <button
            onClick={async () => {
              await createNewWallet();
            }}
            className="w-full text-left p-2 bg-blue-500 hover:bg-blue-700 text-white rounded disabled:opacity-50 text-sm sm:text-base"
            disabled={isLoading}
          >
            + Create New Burner Wallet
          </button>
        </div>
      </Modal>
    </>
  );
};