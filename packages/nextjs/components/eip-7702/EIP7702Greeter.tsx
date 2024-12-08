"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AccountCodeAndStorage } from "./AccountCodeAndStorage";
import { TransactionReceipt, encodePacked, keccak256 } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { useAccount, useBlockNumber, useChainId, useReadContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { useEoaDelegationAddress } from "~~/hooks/eip-7702/useEoaDelegationAddress";
import { get7702WalletClient } from "~~/utils/eip-7702/burnerWallet";
import { getSponsor } from "~~/utils/eip-7702/sponsor";

const DynamicAddress = dynamic(() => import("~~/components/scaffold-eth").then(mod => mod.Address), {
  ssr: false,
});

export const EIP7702Greeter = () => {
  const { address: connectedAddress, chain } = useAccount();
  const [newGreeting, setNewGreeting] = useState("");
  const [displayGreeting, setDisplayGreeting] = useState("");
  const [storageNonce, setStorageNonce] = useState(0);
  const chainId = useChainId();
  const walletClient = get7702WalletClient({ chain });
  const account = walletClient.account;

  const contractAddress = deployedContracts[chainId as keyof typeof deployedContracts]?.YourContract.address;
  const abi = deployedContracts[chainId as keyof typeof deployedContracts]?.YourContract.abi;

  const { isDelegated, delegatedAddress, checkDelegation, code } = useEoaDelegationAddress(account?.address);

  const [writeContractHash, setWriteContractHash] = useState<string | null>(null);
  const [writeContractReceipt, setWriteContractReceipt] = useState<TransactionReceipt | null>(null);

  const { data: greeting, refetch: refetchGreeting } = useReadContract({
    abi,
    address: account.address,
    functionName: "greeting",
    query: {
      enabled: delegatedAddress === contractAddress,
    },
  });

  const { data: blockNumber } = useBlockNumber({ watch: true });
  const { data: totalCounter, refetch: refetchTotalCounter } = useReadContract({
    abi,
    address: account.address,
    functionName: "totalCounter",
    query: {
      enabled: isDelegated,
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refetchTotalCounter();
  }, [blockNumber, refetchTotalCounter]);

  useEffect(() => {
    refetchGreeting();
    setStorageNonce(storageNonce + 1);
  }, [totalCounter]);

  useEffect(() => {
    setDisplayGreeting(greeting || "");
  }, [greeting]);

  const activate = async () => {
    setIsLoading(true);
    const sponsor = await getSponsor(chainId);
    const authorization = await walletClient.signAuthorization({
      contractAddress,
      delegate: true,
    });

    const initialGreeting = "Hello world";

    const signature = await walletClient.signMessage({
      message: {
        raw: keccak256(
          encodePacked(["address", "uint256", "string"], [account.address, totalCounter || 0n, initialGreeting]),
        ),
      },
    });

    if (authorization) {
      const hash = await walletClient.writeContract({
        abi,
        functionName: "setGreeting",
        args: [initialGreeting, signature],
        address: account.address,
        authorizationList: [authorization],
        account: sponsor,
      });
      const receipt = await waitForTransactionReceipt(walletClient, { hash });
      setWriteContractHash(hash);
      setWriteContractReceipt(receipt);
      checkDelegation?.();
    }
    setIsLoading(false);
  };

  const revoke = async () => {
    const sponsor = await getSponsor(chainId);
    const authorization = await walletClient.signAuthorization({
      contractAddress: "0x0000000000000000000000000000000000000000",
      delegate: true,
    });
    if (authorization) {
      const hash = await walletClient.sendTransaction({
        to: account.address,
        authorizationList: [authorization],
        account: sponsor,
      });
      const receipt = await waitForTransactionReceipt(walletClient, { hash });
      setWriteContractHash(hash);
      setWriteContractReceipt(receipt);
      checkDelegation?.();
    }
  };

  const updateGreeting = async () => {
    if (!newGreeting) return;
    setIsLoading(true);
    setWriteContractHash(null);
    setWriteContractReceipt(null);
    const sponsor = await getSponsor(chainId);

    const signature = await walletClient.signMessage({
      message: {
        raw: keccak256(
          encodePacked(["address", "uint256", "string"], [account.address, totalCounter || 0n, newGreeting]),
        ),
      },
    });

    const hash = await walletClient.writeContract({
      abi,
      address: account.address,
      functionName: "setGreeting",
      args: [newGreeting, signature],
      account: sponsor,
    });
    setWriteContractHash(hash);
    const receipt = await waitForTransactionReceipt(walletClient, { hash });
    setWriteContractReceipt(receipt);
    setNewGreeting("");
    setDisplayGreeting("Pending...");
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-base-200 rounded-2xl shadow-lg max-w-2xl mx-auto">
      {/* Address Display Section */}
      <div className="flex flex-col gap-3 bg-base-100 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <p className="font-semibold text-base-content/80">Greeter contract:</p>
          <DynamicAddress address={contractAddress} />
        </div>
        <div className="flex items-center gap-3">
          <p className="font-semibold text-base-content/80">Burner EOA:</p>
          {connectedAddress && <DynamicAddress address={connectedAddress} />}
          <span
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              isDelegated ? "bg-success/20 text-success" : "bg-base-300 text-base-content/70"
            }`}
          >
            {isDelegated ? "7702 Enabled" : "EOA"}
          </span>
        </div>
      </div>

      {/* Greeting Display */}
      {greeting && (
        <div className="bg-base-100 p-4 rounded-xl">
          <span className="font-medium text-base-content/80">Greeting:</span> {displayGreeting}
        </div>
      )}

      {/* Input and Buttons Section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
        {delegatedAddress === contractAddress ? (
          <>
            <input
              type="text"
              placeholder="Enter new greeting"
              value={newGreeting}
              onChange={e => setNewGreeting(e.target.value)}
              className="input input-bordered input-primary flex-grow min-w-0"
            />
            <button onClick={updateGreeting} className="btn btn-primary whitespace-nowrap" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Greeting"}
            </button>
            <button onClick={revoke} className="btn btn-error whitespace-nowrap" disabled={isLoading}>
              Revoke 7702
            </button>
          </>
        ) : (
          <button onClick={activate} className="btn btn-primary" disabled={isLoading}>
            {isLoading ? "Activating..." : "Activate 7702"}
          </button>
        )}
      </div>

      {/* Transaction Status */}
      {(writeContractHash || writeContractReceipt) && (
        <div className="bg-base-100 p-4 rounded-xl space-y-2">
          {writeContractHash && (
            <div className="text-sm">
              Tx:{" "}
              <a
                href={
                  chainId === 31337
                    ? `/blockexplorer/transaction/${writeContractHash}`
                    : `https://odyssey-explorer.ithaca.xyz/tx/${writeContractHash}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                {writeContractHash}
              </a>
            </div>
          )}
          {writeContractReceipt && (
            <div className="text-sm font-medium">
              Status:{" "}
              <span className={writeContractReceipt.status === "success" ? "text-success" : "text-error"}>
                {writeContractReceipt.status === "success" ? "Success ✅" : "Failed ❌"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Account Code & Storage Section */}
      <div className="bg-base-100 p-4 rounded-xl">
        <AccountCodeAndStorage code={code} address={account.address} storageNonce={storageNonce} />
      </div>
    </div>
  );
};