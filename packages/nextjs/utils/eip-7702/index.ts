import { Address, PublicClient, WalletClient, createWalletClient, http, parseEther } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";


export interface DelegationData {
  isDelegated: boolean;
  delegatedAddress?: string;
  code?: string;
}

/**
 * Checks if an address is a contract and extracts delegation data if it's an EIP-7702 contract
 */
export const checkEoaDelegation = async (address: Address, publicClient: PublicClient): Promise<DelegationData> => {
  if (!address) return { isDelegated: false };

  try {
    const contractCode = await publicClient.getCode({ address });
    const isDelegated = contractCode !== undefined && contractCode !== "0x";

    let delegatedAddress: string | undefined;
    if (contractCode?.startsWith("0xef0100")) {
      delegatedAddress = `0x${contractCode.slice(8)}`;
    }

    return { isDelegated, delegatedAddress, code: contractCode };
  } catch (error) {
    console.error("Error checking EIP-7702 delegation:", error);
    return { isDelegated: false };
  }
};

export const getAFundedLocalAccount = async (fundingAmount = "0.01") => {
  const ephemeralAccount = privateKeyToAccount(generatePrivateKey());

  const localWalletClient = createWalletClient({
    chain: hardhat,
    transport: http(),
  });

  const addresses = await localWalletClient.getAddresses();

  await localWalletClient.sendTransaction({
    to: ephemeralAccount.address,
    value: parseEther(fundingAmount),
    account: addresses[0],
  });
  return ephemeralAccount;
};