import { useEffect, useState } from "react";
import { AddressStorageTab } from "~~/app/blockexplorer/_components/AddressStorageTab";

interface AccountCodeAndStorageProps {
  code: string | undefined;
  address: string;
  storageNonce: number;
}

export const AccountCodeAndStorage = ({ code, address, storageNonce }: AccountCodeAndStorageProps) => {
  const [showStorage, setShowStorage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStorage(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!showStorage) {
    return (
      <div className="mt-4">
        <span className="loading loading-spinner loading-sm ml-2"></span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-3 p-4 bg-base-200 rounded-xl">
        <h3 className="font-medium">Account Code & Storage</h3>
        <div className="mockup-code overflow-y-auto max-h-[200px]">
          <pre className="px-5">
            <code className="whitespace-pre-wrap overflow-auto break-words">
              <strong>Code:</strong>
              {code ? code : " N/A"}
            </code>
          </pre>
        </div>
        <AddressStorageTab address={address} nonce={storageNonce} />
      </div>
    </div>
  );
};
