import { Chain, createWalletClient } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { anvil } from "viem/chains";
import { eip7702Actions } from "viem/experimental";
import { http } from "wagmi";

export const getBurnerPk = () => {
  if (typeof window !== "undefined") {
    const burnerPk = localStorage.getItem("burnerWallet.pk");
    return (burnerPk || generatePrivateKey()) as `0x${string}`;
  }
  return generatePrivateKey() as `0x${string}`;
};

export const get7702BurnerWalletClient = (chain: Chain = anvil) => {
  const account = privateKeyToAccount(getBurnerPk());
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(),
  }).extend(eip7702Actions());

  return walletClient;
};
