"use client";

import { useState } from "react";
import { useChainId } from "wagmi";
import { EIP7702BatchTransactor } from "~~/components/eip-7702/EIP7702BatchTransactor";
import deployedContracts from "~~/contracts/deployedContracts";
import { useBurnerWallets } from "~~/hooks/useBurnerWallets";
import { getExplorerLink } from "~~/utils/scaffold-eth/transaction";


export default function BurnerWalletsPage() {
  const { wallets, error, createNewWallet } = useBurnerWallets();
  const [showDetails, setShowDetails] = useState(false);
  const chainId = useChainId();

  // Add these contract addresses and chainId
  const BATCHER_ADDRESS = deployedContracts[chainId as keyof typeof deployedContracts]?.Batcher.address;
  const FAUCET_ADDRESS = deployedContracts[chainId as keyof typeof deployedContracts]?.Faucet.address;
  const FREE_TOKEN_ADDRESS = deployedContracts[chainId as keyof typeof deployedContracts]?.FreeToken.address;
  const BUYABLE_TOKEN_ADDRESS = deployedContracts[chainId as keyof typeof deployedContracts]?.BuyableToken.address;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Batch transactions</h1>
      <p className="text-sm">
        This demonstrates EOA batch transactions with EIP-7702.{" "}
        <button onClick={() => setShowDetails(!showDetails)} className="text-blue-500 hover:text-blue-700 text-sm">
          {showDetails ? "Show less" : "Learn more"}
        </button>
      </p>

      {showDetails && (
        <div className="mb-4">
          <p className="text-sm mb-4">
            There are three contracts of interest - a Faucet, which drips ETH, a FreeToken, which is airdropped free of
            charge, and a BuyableToken, which can be bought with FreeTokens.
          </p>
          <p className="text-sm mb-4">
            The functionality is enabled by a Batcher contract, which makes multiple calls if the msg.sender is the EOA,
            or if the EOA has signed a hash of the batch.
          </p>
          <p className="text-sm mb-4">
            {`Clicking "Drop" authorises the Batcher as the delegate contract, and calls the Faucet contract, the FreeToken contract, and the
            BuyableToken contract to get ETH, FreeTokens, and BuyableTokens. This includes approving the BuyableToken to spend the
            FreeTokens (i.e. the famous approve-interact pattern, in one transaction)`}
          </p>
          <p className="text-sm mb-4">
            {`If you click "Move", you select another Burner wallet that you want to transfer all of your assets to, again in one transaction.`}
          </p>
          <p className="text-sm mb-4">
            {`If you have ETH in a burner, you can interact with the individual contracts by clicking "+". Note that there is a maximum approval 
            in the "Drop" transaction, so you won't need further approvals to buy BuyableTokens.`}
          </p>
        </div>
      )}

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {/* Header row */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-4 mb-2 font-bold">
        <div className="hidden sm:block">Address</div>
        <div>
          <a
            href={getExplorerLink(BATCHER_ADDRESS, chainId, "address")}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500"
          >
            7702 Contract ↗
          </a>
        </div>
        <div>
          <a
            href={getExplorerLink(FAUCET_ADDRESS, chainId, "address")}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500"
          >
            ETH Balance ↗
          </a>
        </div>
        <div>
          <a
            href={getExplorerLink(FREE_TOKEN_ADDRESS, chainId, "address")}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500"
          >
            Free Tokens ↗
          </a>
        </div>
        <div>
          <a
            href={getExplorerLink(BUYABLE_TOKEN_ADDRESS, chainId, "address")}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500"
          >
            Buyable Tokens ↗
          </a>
        </div>
        <div className="hidden sm:block">Actions</div>
      </div>

      <div className="space-y-2">
        {wallets.map(wallet => (
          <EIP7702BatchTransactor
            key={wallet.address}
            wallet={wallet}
            allWallets={wallets}
            createNewWallet={createNewWallet}
          />
        ))}
      </div>
      <button
        onClick={createNewWallet}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
      >
        Create New Wallet
      </button>
    </div>
  );
}