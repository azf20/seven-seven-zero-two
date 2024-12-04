import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { DelegationData, checkEoaDelegation } from "~~/utils/eip-7702";

export const useEoaDelegationAddress = (address?: string) => {
  const [delegationData, setDelegationData] = useState<
    DelegationData & {
      checkDelegation?: () => Promise<void>;
    }
  >({
    isDelegated: false,
  });

  const publicClient = usePublicClient();

  useEffect(() => {
    const checkDelegation = async () => {
      if (!address || !publicClient) return;
      const data = await checkEoaDelegation(address, publicClient);
      setDelegationData(prev => ({ ...prev, ...data }));
    };

    checkDelegation();
    setDelegationData(prev => ({ ...prev, checkDelegation }));
  }, [address]);

  return delegationData;
};
