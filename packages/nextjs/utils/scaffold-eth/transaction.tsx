import { toast } from "react-toastify";

export const getExplorerLink = (hash: string, chainId: number, type: "tx" | "address" = "tx") =>
  chainId === 31337
    ? `/blockexplorer/${type === "tx" ? "transaction" : "address"}/${hash}`
    : `https://odyssey-explorer.ithaca.xyz/${type === "tx" ? "tx" : "address"}/${hash}`;

export const showTransactionToast = (hash: string, chainId: number, type: "success" | "info" = "success") => {
  toast[type](
    <div>
      <p>{`Transaction ${type === "success" ? "Confirmed" : "Pending"}`}</p>
      <p className="text-sm">
        <a href={getExplorerLink(hash, chainId)} target="_blank" rel="noopener noreferrer" className="underline">
          {`${hash.slice(0, 6)}...${hash.slice(-4)}: view on explorer`}
        </a>
      </p>
    </div>,
  );
};