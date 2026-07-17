import { createClient, createAccount } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load frontend env for contract address
dotenv.config({ path: path.join(__dirname, '../frontend/.env') });
// Load root env for private key
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const pk = process.env.GENLAYER_PRIVATE_KEY;
  if (!pk) throw new Error("GENLAYER_PRIVATE_KEY missing");
  
  const contractAddress = process.env.VITE_PROTOCOL_ADDRESS;
  if (!contractAddress) throw new Error("VITE_PROTOCOL_ADDRESS missing in frontend/.env. Deploy first.");

  const account = createAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
  const client = createClient({ chain: testnetBradbury, account });

  console.log(`Seeding data for contract: ${contractAddress}`);
  
  // 1. Initialize a Pool
  console.log("Initializing Alpha Yield Pool...");
  await client.writeContract({
    address: contractAddress,
    functionName: 'initialize_pool',
    args: ['pool_001', 'Alpha Yield', 500, 7000, 10000000000, 3, '{"strict": true}']
  });
  
  // 2. Add Liquidity
  console.log("Providing liquidity...");
  await client.writeContract({
    address: contractAddress,
    functionName: 'provide_liquidity',
    args: ['pool_001'],
    value: 5000000n
  });

  console.log("Seeding complete! The UI is now ready for presentation.");
}

main().catch(console.error);
