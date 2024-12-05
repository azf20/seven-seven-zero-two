# EIP-7702 Demo with 🏗 Scaffold-ETH 2

This repository is a proof-of-concept for [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702).

## Features
- Burner wallet: stored in the browser's local storage
- Implementation contract: a simple greeter contract, edited to support EIP-7702 EOA smart accounts
- Activation: signs the authorization message to use the implementation contract's code and makes an initial greeting update
- Updating your greeting: gaslessley update the greeting to a new value of your choosing
- Sponsored transactions: all transactions are sponsored (by the sequencer on Odyssey, by a faucet mechanism locally)
- A look under the hood: you can see the associated code and storage slot changes!

### Miscellaneous notes

- The Ithaca examples are great, but with all the delegation and authorization in the smart contract as well as the EIP-7702 spec and Viem implementation, it was a little hard to understand what was happening in each step. This much dumber example hopefully demonstrates the bare bones of EIP-7702.
- This is currently burner wallets only, as JSON-RPC accounts are [not currently supported](https://github.com/wevm/viem/blob/b0e755155f1bdaf2e9e609736c3f4998a441e702/src/experimental/eip7702/actions/signAuthorization.ts#L101) by Viem.
- Your smart contrat will need a fallback function or your EOA will no longer be able to receive ETH! (But you can still call a regular sendTransaction with value)
- Transactions from the local anvil node's inbuilt accounts didn't work as expected (instead using ephemeral faucet-funded accounts in local development to mimic the sequencer sponsor)
- In moving to Odyssey, it was slightly tricky to get sponsored transactions to work, as the sponsored transactions seemed to fail silently (i.e. if the Greeting signature was invalid), which was made more difficult as...
- If the initial transaction to initiate the delegation includes contract calls, those won't currently show up on the Odyssey block explorer (which is a reminder that various tooling in the ecosystem will need to be updated to support this new pattern)
- This functionality breaks some assumptions:
  - EOAs can now run code
  - Certain smart contracts can have a signing key
  - You can no longer revoke ownership of all smart account

### Potential extensions:
- Demonstrate revocation
- More "useful" functionality in the delegated smart contract :) (e.g. approve and swap, generic multisig functionality, sub-permissions)
- Interacting with multiple EOA smart accounts in one transaction (e.g. to withdraw from all your EOAs at once!)

### References

- [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702)
- [Viem EIP-7702](https://viem.sh/experimental/eip7702)
- [EXP-0001: Account Delegation with EIP-7702](https://www.ithaca.xyz/writings/exp-0001)
- [ORC-0001: Sequencer-sponsored Transactions](https://www.ithaca.xyz/writings/orc-0001)

> Many thanks to Viem and Ithaca for the supporting tooling and documentation!

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v18.18)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

Install dependencies:

```
yarn install
```

To run on the [Odyssey Testnet](https://app.conduit.xyz/published/view/odyssey), using the predeployed contract:

```
yarn start
```

Running locally:

Create an `.env` file in `/packages/nextjs`:

```
NEXT_PUBLIC_ENVIRONMENT=localhost
```

Run a local anvil node:
```
yarn chain
```

Deploy the contract:

```
yarn deploy
```

Start the Next.js app:

```
yarn start
```