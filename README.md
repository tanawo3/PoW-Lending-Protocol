# PoW Lending Protocol

An uncollateralized lending protocol powered by **GenLayer Intelligent Smart Contracts**.

## Overview
Traditional DeFi requires massive overcollateralization (e.g., lock $150 to borrow $100). The PoW Lending Protocol leverages GenLayer's AI subjective consensus engine to underwrite loans based on a developer's real-world Proof-of-Work (GitHub pull requests, code quality, DAO participation) without requiring capital collateral.

## Features
- **AI Underwriting:** GenLayer validators fetch your GitHub repository, analyze the codebase, and reach consensus on your credit score and interest rate.
- **Speculative Default Markets:** A built-in prediction market where users can bet on loan defaults, providing decentralized insurance for liquidity providers.
- **Zero-Knowledge Evidence:** Borrowers can submit private, encrypted financial evidence.
- **Holistic Solvency Mathematics:** Real-time health factor calculations that freeze protocol interactions if Debt-to-Collateral ratios exceed limits.
- **100% Deterministic Execution:** The entire protocol uses strict integer division and deterministic PRNG seeded UI generation to guarantee Zero Consensus Divergence across nodes.

## Ecosystem Parity
This project enforces "Holistic Parity". 
The deployment scripts synchronize automatically with the frontend.

### 1. Installation
Install the root and frontend dependencies:
```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Setup
Create a `.env` file in the root directory:
```env
GENLAYER_PRIVATE_KEY=0x_YOUR_PRIVATE_KEY
```

### 3. Deploy Contract & Sync
Run the automated deployment script. This will compile the GenVM contract, deploy it to GenLayer testnet, and automatically inject the new contract address into your `frontend/.env` file.
```bash
npm run deploy
```

### 4. Run the WebApp
```bash
npm run dev
```

## Security
- Follows the Checks-Effects-Interactions (CEI) Pattern for GenVM safely.
- Avoids dictionary/list mutations to comply with GenVM State Transitions.
- Implements `debugTraceTransaction` fallbacks for CORS-restricted environments.

## License
MIT License
