import { wagmiConnectors } from "./wagmiConnectors";
import { Chain, createClient, fallback, http } from "viem";
import { hardhat, mainnet } from "viem/chains";
import { createConfig } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

const { targetNetworks } = scaffoldConfig;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = [targetNetworks[0], ...[...targetNetworks.slice(1), mainnet]] as [Chain, ...Chain[]];

export const wagmiConfig = createConfig({
  chains: enabledChains,
  connectors: wagmiConnectors,
  transports: Object.fromEntries(
    enabledChains.map(chain => [
      chain.id,
      fallback([http(), http(getAlchemyHttpUrl(chain.id))].filter(Boolean))
    ])
  )
});
