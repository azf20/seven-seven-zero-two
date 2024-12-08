import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { maxUint256 } from "viem";
import { concat, encodeFunctionData, encodePacked, keccak256, size } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { useBalance, useChainId, useChains, useReadContracts } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { useEoaDelegationAddress } from "~~/hooks/eip-7702/useEoaDelegationAddress";
import { WalletData } from "~~/hooks/useBurnerWallets";
import { get7702WalletClient } from "~~/utils/eip-7702/burnerWallet";
import { getSponsor } from "~~/utils/eip-7702/sponsor";
import { showTransactionToast } from "~~/utils/scaffold-eth/transaction";

export function useEIP7702BatchTransactor(wallet: WalletData) {
  const [isLoading, setIsLoading] = useState(false);

  const { isDelegated, checkDelegation } = useEoaDelegationAddress(wallet.address);
  const chainId = useChainId();
  const chains = useChains();
  const chain = chains.find(c => c.id === chainId);
  const balance = useBalance({
    address: wallet.address,
  });

  const walletClient = get7702WalletClient({ privateKey: wallet.privateKey, chain });

  const freeTokenInfo = deployedContracts[chainId as keyof typeof deployedContracts]?.FreeToken;
  const buyableTokenInfo = deployedContracts[chainId as keyof typeof deployedContracts]?.BuyableToken;
  const faucetInfo = deployedContracts[chainId as keyof typeof deployedContracts]?.Faucet;
  const batcherInfo = deployedContracts[chainId as keyof typeof deployedContracts]?.Batcher;

  const { data, refetch } = useReadContracts({
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

  // Add effect to listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      balance.refetch();
      refetch();
      checkDelegation?.();
    };

    const eventName = `eip7702-refresh-${wallet.address}`;

    window.addEventListener(eventName, handleRefresh);
    return () => window.removeEventListener(eventName, handleRefresh);
  }, [balance, refetch, checkDelegation, wallet]);

  const localRefresh = () => {
    balance.refetch();
    refetch();
    checkDelegation?.();
  };

  const triggerRemoteRefresh = (walletAddress: string) => {
    window.dispatchEvent(new Event(`eip7702-refresh-${walletAddress}`));
  };

  const executeWrite = async ({
    abi,
    address,
    functionName,
    args,
  }: {
    abi: any;
    address: `0x${string}`;
    functionName: string;
    args: any[];
  }) => {
    setIsLoading(true);
    try {
      console.log(`Executing ${functionName} for ${wallet.address}`);
      const hash = await walletClient.writeContract({
        abi,
        address,
        functionName,
        args,
        chain,
        account: walletClient.account,
      });
      console.log("Transaction confirmed:", hash);
      showTransactionToast(hash, chainId, "info");
      await waitForTransactionReceipt(walletClient, { hash });
      showTransactionToast(hash, chainId);
    } catch (error) {
      console.error(error);
      toast.error(`Transaction failed: ${(error as Error).message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestEth = () =>
    executeWrite({
      abi: faucetInfo.abi,
      address: faucetInfo.address,
      functionName: "drip",
      args: [wallet.address as `0x${string}`],
    }).then(() => localRefresh());

  const handleRequestFreeToken = () =>
    executeWrite({
      abi: freeTokenInfo.abi,
      address: freeTokenInfo.address,
      functionName: "mint",
      args: [wallet.address],
    }).then(() => localRefresh());

  const handleRequestBuyableToken = async () => {
    if (data?.[2].result === 0n) {
      await executeWrite({
        abi: freeTokenInfo.abi,
        address: freeTokenInfo.address,
        functionName: "approve",
        args: [buyableTokenInfo.address, maxUint256],
      });
    }
    return executeWrite({
      abi: buyableTokenInfo.abi,
      address: buyableTokenInfo.address,
      functionName: "mint",
      args: [wallet.address],
    }).then(() => localRefresh());
  };

  const dropTokens = async () => {
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

    await executeBatchedCalls(calls).then(() => localRefresh());
  };

  const moveEverything = async (destinationAddress: string) => {
    const calls = [
      {
        to: freeTokenInfo.address,
        value: 0n,
        data: encodeFunctionData({
          abi: freeTokenInfo.abi,
          functionName: "transfer",
          args: [destinationAddress, data?.[0].result || 0n],
        }),
      },
      {
        to: buyableTokenInfo.address,
        value: 0n,
        data: encodeFunctionData({
          abi: buyableTokenInfo.abi,
          functionName: "transfer",
          args: [destinationAddress, data?.[1].result || 0n],
        }),
      },
      {
        to: destinationAddress,
        value: balance.data?.value ?? 0n,
      },
    ];

    await executeBatchedCalls(calls).then(() => {
      localRefresh();
      triggerRemoteRefresh(destinationAddress);
    });
  };

  const executeBatchedCalls = async (calls: { to: string; value: bigint; data?: `0x${string}` }[]) => {
    setIsLoading(true);
    try {
      const sponsor = await getSponsor(chainId);
      const authorization = await walletClient.signAuthorization({
        contractAddress: batcherInfo.address,
        delegate: true,
      });

      const calls_encoded = concat(
        calls.map(call =>
          encodePacked(
            ["uint8", "address", "uint256", "uint256", "bytes"],
            [0, call.to, call.value ?? 0n, BigInt(size(call.data ?? "0x")), call.data ?? "0x"],
          ),
        ),
      );

      const digest = keccak256(encodePacked(["uint256", "bytes"], [data?.[3].result ?? 0n, calls_encoded]));

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
      showTransactionToast(hash, chainId, "info");
      console.log("Transaction hash:", hash);
      await waitForTransactionReceipt(walletClient, { hash });
      showTransactionToast(hash, chainId);
    } catch (error) {
      console.error(error);
      toast.error(`Transaction failed: ${(error as Error).message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isDelegated,
    balance: balance.data?.value ?? 0n,
    freeTokenBalance: data?.[0].result || 0n,
    buyableTokenBalance: data?.[1].result || 0n,
    handleRequestEth,
    handleRequestFreeToken,
    handleRequestBuyableToken,
    dropTokens,
    moveEverything,
    isLoading,
  };
}
