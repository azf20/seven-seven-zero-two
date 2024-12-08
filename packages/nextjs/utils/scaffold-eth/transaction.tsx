import { toast } from "react-toastify";

export const getExplorerLink = (hash: string, chainId: number) =>
  chainId === 31337 ? `/blockexplorer/transaction/${hash}` : `https://odyssey-explorer.ithaca.xyz/tx/${hash}`;

export const showTransactionToast = (hash: string, chainId: number) => {
  toast.success(
    <div>
      <p>Transaction Confirmed</p>
      <p className="text-sm">
        <a href={getExplorerLink(hash, chainId)} target="_blank" rel="noopener noreferrer" className="underline">
          {`${hash.slice(0, 6)}...${hash.slice(-4)}: view on explorer`}
        </a>
      </p>
    </div>,
  );
};
