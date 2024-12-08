"use client";

import { useEffect, useState } from "react";
import { openDB } from "idb";
import { concat, encodeFunctionData, encodePacked, formatEther, keccak256, maxUint256, size, zeroAddress } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { waitForTransactionReceipt } from "viem/actions";
import { useBalance, useChainId, useChains, useReadContracts } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import deployedContracts from "~~/contracts/deployedContracts";
import { useEoaDelegationAddress } from "~~/hooks/eip-7702/useEoaDelegationAddress";
import { get7702WalletClient } from "~~/utils/eip-7702/burnerWallet";
import { getSponsor } from "~~/utils/eip-7702/sponsor";

const DB_NAME = "BurnerWalletsDB";
const STORE_NAME = "wallets";

interface WalletData {
  address: string;
  privateKey: `0x${string}`;
}

interface BalanceDisplayProps {
  value: string;
  label: string;
  onRequest?: () => void;
}

const BalanceDisplay = ({ value, label, onRequest }: BalanceDisplayProps) => (
  <div className="flex items-center gap-2">
    {value} {label}
    {onRequest && (
      <button
        onClick={onRequest}
        className="bg-blue-500 hover:bg-blue-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
      >
        +
      </button>
    )}
  </div>
);

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceWallet: WalletData;
  destinationWallets: WalletData[];
  onMove: (destinationAddress: string) => void;
}

const MoveModal = ({ isOpen, onClose, sourceWallet, destinationWallets, onMove }: MoveModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-blue-500 text-white p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4">Select Destination Wallet</h2>
        <div className="space-y-2">
          {destinationWallets
            .filter(w => w.address !== sourceWallet.address)
            .map(wallet => (
              <button
                key={wallet.address}
                onClick={() => onMove(wallet.address)}
                className="w-full text-left p-2 hover:bg-blue-600 rounded"
              >
                <Address address={wallet.address} />
              </button>
            ))}
        </div>
        <button onClick={onClose} className="mt-4 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded">
          Cancel
        </button>
      </div>
    </div>
  );
};

const WalletInformation = ({ wallet, allWallets }: { wallet: WalletData; allWallets: WalletData[] }) => {
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const { isDelegated } = useEoaDelegationAddress(wallet.address);
  const chainId = useChainId();
  const chains = useChains();
  const chain = chains.find(c => c.id === chainId);
  const balance = useBalance({
    address: wallet.address,
  });

  const walletClient = get7702WalletClient({ privateKey: wallet.privateKey, chain });

  const freeTokenInfo = deployedContracts[31337]?.FreeToken;
  const buyableTokenInfo = deployedContracts[31337]?.BuyableToken;
  const faucetInfo = deployedContracts[31337]?.Faucet;
  const batcherInfo = deployedContracts[31337]?.Batcher;

  const result = useReadContracts({
    contracts: [
      {
        abi: freeTokenInfo.abi,
        address: freeTokenInfo.address,
        functionName: "balanceOf",
        args: [wallet.address],
      },
      {
        abi: buyableTokenInfo.abi,
        address: buyableTokenInfo.address,
        functionName: "balanceOf",
        args: [wallet.address],
      },
      {
        abi: freeTokenInfo.abi,
        address: freeTokenInfo.address,
        functionName: "allowance",
        args: [wallet.address, buyableTokenInfo.address],
      },
      {
        abi: batcherInfo.abi,
        address: isDelegated ? wallet.address : batcherInfo.address,
        functionName: "nonce",
      },
    ],
  });

  const handleRequestEth = () => {
    console.log("Requesting ETH for", wallet.address);
    walletClient.writeContract({
      abi: faucetInfo.abi,
      address: faucetInfo.address,
      functionName: "drip",
      args: [wallet.address as `0x${string}`],
      chain,
      account: walletClient.account,
    });
  };

  const handleRequestFreeToken = () => {
    console.log("Requesting Free tokens for", wallet.address);
    walletClient.writeContract({
      abi: freeTokenInfo.abi,
      address: freeTokenInfo.address,
      functionName: "mint",
      args: [wallet.address],
      chain,
      account: walletClient.account,
    });
  };

  const handleRequestBuyableToken = () => {
    console.log("Requesting Buyable tokens for", wallet.address);
    console.log(result.data?.[2].result);
    if (result.data?.[2].result === 0n) {
      console.log("Approving Free tokens for Buyable tokens");
      walletClient.writeContract({
        abi: freeTokenInfo.abi,
        address: freeTokenInfo.address,
        functionName: "approve",
        args: [buyableTokenInfo.address, maxUint256],
        chain,
        account: walletClient.account,
      });
    } else {
      console.log("Minting Buyable tokens");
      walletClient.writeContract({
        abi: buyableTokenInfo.abi,
        address: buyableTokenInfo.address,
        functionName: "mint",
        args: [wallet.address],
        chain,
        account: walletClient.account,
      });
    }
  };

  const dropTokens = async () => {
    const sponsor = await getSponsor(chainId);

    const authorization = await walletClient.signAuthorization({
      contractAddress: batcherInfo.address,
      delegate: true,
    });

    const calls = [
      {
        to: freeTokenInfo.address,
        value: 0n,
        data: encodeFunctionData({
          abi: freeTokenInfo.abi,
          functionName: "mint",
          args: [wallet.address],
        }),
      },
      {
        to: freeTokenInfo.address,
        value: 0n,
        data: encodeFunctionData({
          abi: freeTokenInfo.abi,
          functionName: "approve",
          args: [buyableTokenInfo.address, maxUint256],
        }),
      },
      {
        to: buyableTokenInfo.address,
        value: 0n,
        data: encodeFunctionData({
          abi: buyableTokenInfo.abi,
          functionName: "mint",
          args: [wallet.address],
        }),
      },
      {
        to: faucetInfo.address,
        value: 0n,
        data: encodeFunctionData({
          abi: faucetInfo.abi,
          functionName: "drip",
          args: [wallet.address],
        }),
      },
    ];

    // Encode calls into format required by the contract.
    const calls_encoded = concat(
      calls.map(call =>
        encodePacked(
          ["uint8", "address", "uint256", "uint256", "bytes"],
          [0, call.to, call.value ?? 0n, BigInt(size(call.data ?? "0x")), call.data ?? "0x"],
        ),
      ),
    );

    // Compute digest to sign for the execute function.
    const digest = keccak256(encodePacked(["uint256", "bytes"], [result.data?.[3].result ?? 0n, calls_encoded]));

    const signature = await walletClient.signMessage({
      message: { raw: digest },
    });

    const hash = await walletClient.writeContract({
      abi: batcherInfo.abi,
      address: wallet.address,
      functionName: "execute",
      args: [calls_encoded, signature],
      authorizationList: [authorization],
      account: sponsor,
    });

    const receipt = await waitForTransactionReceipt(walletClient, { hash });
    console.log(receipt);
  };

  const moveEverything = async (destinationAddress: string) => {
    const sponsor = await getSponsor(chainId);

    const authorization = await walletClient.signAuthorization({
      contractAddress: batcherInfo.address,
      delegate: true,
    });

    const calls = [
      {
        to: freeTokenInfo.address,
        value: 0n,
        data: encodeFunctionData({
          abi: freeTokenInfo.abi,
          functionName: "transfer",
          args: [destinationAddress, result.data?.[0].result || 0n],
        }),
      },
      {
        to: buyableTokenInfo.address,
        value: 0n,
        data: encodeFunctionData({
          abi: buyableTokenInfo.abi,
          functionName: "transfer",
          args: [destinationAddress, result.data?.[1].result || 0n],
        }),
      },
      {
        to: destinationAddress,
        value: balance.data?.value ?? 0n,
      },
    ];

    // Encode calls into format required by the contract.
    const calls_encoded = concat(
      calls.map(call =>
        encodePacked(
          ["uint8", "address", "uint256", "uint256", "bytes"],
          [0, call.to, call.value ?? 0n, BigInt(size(call.data ?? "0x")), call.data ?? "0x"],
        ),
      ),
    );

    // Compute digest to sign for the execute function.
    const digest = keccak256(encodePacked(["uint256", "bytes"], [result.data?.[3].result ?? 0n, calls_encoded]));

    const signature = await walletClient.signMessage({
      message: { raw: digest },
    });

    const hash = await walletClient.writeContract({
      abi: batcherInfo.abi,
      address: wallet.address,
      functionName: "execute",
      args: [calls_encoded, signature],
      authorizationList: [authorization],
      account: sponsor,
    });

    const receipt = await waitForTransactionReceipt(walletClient, { hash });
    console.log(receipt);
  };

  const handleMove = async (destinationAddress: string) => {
    await moveEverything(destinationAddress);
  };

  return (
    <>
      <div className="border p-4 rounded grid grid-cols-6 gap-4">
        <Address address={wallet.address} disableAddressLink={true} />
        <div>{isDelegated ? "✅" : "❌"}</div>
        <BalanceDisplay value={formatEther(balance.data?.value ?? 0n)} label="ETH" onRequest={handleRequestEth} />
        <BalanceDisplay
          value={formatEther(result.data?.[0].result || 0n)}
          label="Free Tokens"
          onRequest={handleRequestFreeToken}
        />
        <BalanceDisplay
          value={formatEther(result.data?.[1].result || 0n)}
          label="Buyable Tokens"
          onRequest={handleRequestBuyableToken}
        />
        <div className="flex gap-2">
          <button
            onClick={dropTokens}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Drop tokens
          </button>
          <button
            onClick={() => setIsMoveModalOpen(true)}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Move
          </button>
        </div>
      </div>
      <MoveModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        sourceWallet={wallet}
        destinationWallets={allWallets}
        onMove={handleMove}
      />
    </>
  );
};

export default function BurnerWalletsPage() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [error, setError] = useState<string>("");
  const chainId = useChainId();
  const chains = useChains();
  const chain = chains.find(c => c.id === chainId);

  useEffect(() => {
    initDB();
  }, []);

  const initDB = async () => {
    try {
      const db = await openDB(DB_NAME, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "address" });
          }
        },
      });

      // Check localStorage for existing burner wallet and add to IndexedDB
      const existingPK = localStorage.getItem("burnerWallet.pk");
      if (existingPK) {
        const account = privateKeyToAccount(`${existingPK}` as `0x${string}`);
        await db.put(STORE_NAME, {
          address: account.address,
          privateKey: existingPK,
        });
      }

      // Load all wallet addresses
      const allWallets = await db.getAll(STORE_NAME);
      setWallets(
        allWallets.map(w => ({
          address: w.address,
          privateKey: w.privateKey,
        })),
      );
    } catch (err) {
      setError("Failed to initialize database");
      console.error(err);
    }
  };

  const createNewWallet = async () => {
    try {
      const privateKey = generatePrivateKey();
      const account = privateKeyToAccount(privateKey);

      const db = await openDB(DB_NAME, 1);
      await db.put(STORE_NAME, {
        address: account.address,
        privateKey: privateKey,
      });
      setWallets(prev => [...prev, { address: account.address, privateKey }]);
    } catch (err) {
      setError("Failed to create new wallet");
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Burner Wallets</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <button
        onClick={createNewWallet}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Create New Wallet
      </button>

      {/* Header row */}
      <div className="grid grid-cols-6 gap-4 mb-2 font-bold">
        <div>Address</div>
        <div>7702 Activated</div>
        <div>ETH Balance</div>
        <div>Free Tokens</div>
        <div>Buyable Tokens</div>
        <div>Actions</div>
      </div>

      <div className="space-y-2">
        {wallets.map(wallet => (
          <WalletInformation key={wallet.address} wallet={wallet} allWallets={wallets} />
        ))}
      </div>
    </div>
  );
}