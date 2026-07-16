# PoW Lending Protocol

PoW Lending Protocol is a decentralized DeFi protocol designed to evaluate and issue loans based on verifiable qualitative proof-of-work (such as GitHub commits or written reports). It utilizes GenLayer Intelligent Contracts to perform validator consensus to evaluate the legitimacy of submissions.

## Features

- **Validator-Driven Proof-of-Work Verification**: Uses GenLayer validators to form network consensus on the quality and substantive nature of user work submissions before approving loans.
- **Liquidity Pools**: LPs can provide capital to risk-tiered pools to earn yield.
- **Prediction Markets**: Speculate on the outcome (Repay vs Default) of individual loans using consensus-resolved markets.
- **ZK Identity Verification**: Submit encrypted identity proofs for sybil resistance.
- **On-Chain Ledger**: View all active loan applications, requested amounts, and their consensus-verified statuses directly from the smart contract state.
- **Modern Interface**: Built with React and Tailwind CSS featuring a sleek, high-contrast dark mode aesthetic.
- **Web3 Wallet Support**: Directly interacts with the GenLayer Studio Network using `genlayer-js`.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Blockchain SDK**: `genlayer-js`
- **Smart Contracts**: GenLayer Python VM

## How to Run

1. **Connect Wallet**: Make sure your Web3 wallet (MetaMask, OKX, Rabby) is configured to connect to the GenLayer Studio Network.
2. **Deploy Contract**: Click "Deploy Contract" to deploy `PoWLendingProtocol.py` to the network.
3. **Interact**: 
   - Create new Liquidity Pools and deposit capital.
   - Create new loan applications by submitting an identity, amount, and proof of work (link to commits or a report).
   - Trigger the network verification to have AI leaders and validators analyze the submission deterministically.
   - Place bets in the Prediction Markets on the outcome of pending loans.

