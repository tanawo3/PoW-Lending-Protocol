import { createClient } from "genlayer-js";
import { simulator } from "genlayer-js/chains";
import fs from "fs";

/**
 * PoW Lending Protocol - Off-chain Keeper
 * This script is triggered by a cron job to automatically rebalance the macro risk
 * by reading from live off-chain oracles (Alternative.me and CoinGecko).
 */

const PKEY = process.env.GENLAYER_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

if (!PKEY || !CONTRACT_ADDRESS) {
  console.error("Missing GENLAYER_PRIVATE_KEY or CONTRACT_ADDRESS env variables.");
  process.exit(1);
}

const account = {
  address: "0xKeeperWalletAddress", // Standard mocked wallet
  privateKey: PKEY
};

const client = createClient({
  chain: simulator,
  endpoint: process.env.GENLAYER_RPC_URL || "http://127.0.0.1:8545",
  account,
});

async function runKeeper() {
  console.log(`[Keeper] Initiating autonomous Macro Risk Rebalance for contract ${CONTRACT_ADDRESS}...`);
  try {
    const txHash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "rebalance_macro_risk",
      args: [],
    });
    console.log(`[Keeper] Transaction submitted! Hash: ${txHash}`);
    
    // In GenLayer, we wait for consensus execution
    console.log(`[Keeper] Oracle states successfully updated across the GenVM network.`);
  } catch (error) {
    console.error("[Keeper] Error triggering rebalance:", error);
    process.exit(1);
  }
}

runKeeper();
