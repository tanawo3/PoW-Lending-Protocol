# PoW Lending Protocol

# PoW Lending Protocol

**Live Demo:** [Vercel Link Here]
**Video Walkthrough:** [YouTube/Loom Link Here]

## What It Does
PoW Lending Protocol is a decentralized DeFi lending platform that issues undercollateralized loans based on **Proof of Work** rather than traditional capital collateral. Users submit links to their GitHub repositories or off-chain work. The smart contract uses GenLayer's AI to fetch this real-world data, analyze the quality of the work, and deterministically issue a credit score and loan terms.

## The Trust Problem It Solves
Traditional DeFi protocols require 150%+ overcollateralization because smart contracts cannot "trust" a wallet's real-world reputation or off-chain skills. 
This protocol solves the trust problem by using GenLayer's consensus to trustlessly read off-chain qualitative data (GitHub commits, market fear & greed index). Instead of locking up $15k to borrow $10k, a builder can prove their value through their open-source contributions, which are evaluated and verified by the network validators.

## Key Features
- **Validator-Driven Proof-of-Work Verification**: Uses `gl.nondet.web.get` to fetch GitHub data and form network consensus on the borrower's code quality.
- **Pre-Vote Fraud Radar**: Sybil resistance via AI heuristic analysis of wallet telemetry.
- **Macro Risk Rebalancing**: Fetches live BTC prices and the Fear & Greed Index from external APIs to dynamically adjust protocol interest rates.
- **Liquidity Pools & Prediction Markets**: LPs can provide capital, and speculators can bet on whether a loan will default based on the AI's published reasoning.
- **Appeals & Social Vouching**: Rejected applicants can appeal to a Supreme Arbitrator AI, or have trusted wallets "vouch" for them.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Blockchain SDK**: `genlayer-js`
- **Smart Contracts**: GenLayer Python VM

## How to Use

2. **Deploy Contract**: Navigate to the `scripts/` directory and use the deployment script to deploy `contracts/PoWLendingProtocol.py` to the network.
3. **Start Frontend**: Navigate to the `frontend/` directory and run `npm install` and `npm run dev`.
4. **Trigger Macro Risk**: In the UI, click "Rebalance Macro Risk" to have the contract fetch real-world data and set the global interest rate.
5. **Submit a Loan**: Enter an amount and your GitHub repository URL. The contract will evaluate your code and either approve or reject your loan.
6. **Provide Liquidity / Speculate**: Deposit ATTO into Liquidity Pools or place bets in the Prediction Markets on pending loans.

