import { useEffect, useState } from "react";
import { openDB } from "idb";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const DB_NAME = "BurnerWalletsDB";
const STORE_NAME = "wallets";

export interface WalletData {
  address: string;
  privateKey: `0x${string}`;
  createdAt: number;
}

export function useBurnerWallets() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [error, setError] = useState<string>("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      initDB();
      setInitialized(true);
    }
  }, [initialized]);

  const initDB = async () => {
    try {
      const db = await openDB(DB_NAME, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "address" });
          }
        },
      });

      // const existingPK = localStorage.getItem("burnerWallet.pk");
      // if (existingPK) {
      //   const account = privateKeyToAccount(`${existingPK}` as `0x${string}`);
      //   // Check if wallet already exists in DB
      //   // const existingWallet = await db.get(STORE_NAME, account.address);
      //   // if (!existingWallet) {
      //   //   await db.put(STORE_NAME, {
      //   //     address: account.address,
      //   //     privateKey: existingPK,
      //   //     createdAt: Date.now(),
      //   //   });
      //   // }
      // }

      // Get final wallet list after all creations
      const allWallets = await db.getAll(STORE_NAME);
      setWallets(
        allWallets
          .map(w => ({
            address: w.address,
            privateKey: w.privateKey,
            createdAt: w.createdAt,
          }))
          .sort((a, b) => Number(a.createdAt) - Number(b.createdAt)),
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
        createdAt: Date.now(),
      });
      setWallets(prev => [
        ...prev,
        {
          address: account.address,
          privateKey,
          createdAt: Date.now(),
        },
      ]);
    } catch (err) {
      setError("Failed to create new wallet");
      console.error(err);
    }
  };

  return { wallets, error, createNewWallet };
}
