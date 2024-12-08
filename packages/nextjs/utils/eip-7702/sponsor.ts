import { getAFundedLocalAccount } from ".";

export const getSponsor = async (chainId: number) => {
  if (chainId === 31337) {
    return await getAFundedLocalAccount();
  }
  return null; // Odyssey sequencer to sponsor
};
