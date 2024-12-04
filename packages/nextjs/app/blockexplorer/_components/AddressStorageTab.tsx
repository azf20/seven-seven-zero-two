"use client";

import { useCallback, useEffect, useState } from "react";
import { Address, toHex } from "viem";
import { usePublicClient } from "wagmi";


export const AddressStorageTab = ({ address, nonce = 0 }: { address: Address; nonce?: number }) => {
  const [storage, setStorage] = useState<string[]>([]);

  const publicClient = usePublicClient();

  const fetchStorage = useCallback(async () => {
    try {
      const storageData = [];
      let idx = 0;

      while (true) {
        const storageAtPosition = await publicClient?.getStorageAt({
          address: address,
          slot: toHex(idx),
        });

        if (storageAtPosition === "0x" + "0".repeat(64)) break;

        if (storageAtPosition) {
          storageData.push(storageAtPosition);
        }

        idx++;
      }
      setStorage(storageData);
    } catch (error) {
      console.error("Failed to fetch storage:", error);
    }
  }, [address, publicClient]);

  useEffect(() => {
    let timeoutId: number;
    if (address && nonce > 0) {
      timeoutId = window.setTimeout(() => {
        fetchStorage();
      }, 500);
    }
    return () => clearTimeout(timeoutId);
  }, [address, nonce, fetchStorage]);

  return (
    <div className="flex flex-col gap-3">
      <div className="mockup-code overflow-auto max-h-[500px]">
        <pre className="px-5 whitespace-pre-wrap break-words">
          {storage.length ? (
            storage.map((data, i) => (
              <div key={i}>
                <strong>Storage Slot {i}:</strong> {data}
              </div>
            ))
          ) : (
            <div>No variables found in storage</div>
          )}
        </pre>
      </div>
    </div>
  );
};