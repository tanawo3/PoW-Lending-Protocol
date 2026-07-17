import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createClient, createAccount } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env for deployment keys
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const pk = process.env.GENLAYER_PRIVATE_KEY;
  if (!pk) throw new Error("GENLAYER_PRIVATE_KEY is missing from environment");
  
  const account = createAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
  const client = createClient({ chain: testnetBradbury, account });
  const code = readFileSync(path.join(__dirname, '../contracts/PoWLendingProtocol.py'), 'utf-8');

  console.log("Deploying PoW Lending Protocol...");
  const hash = await client.deployContract({ code, args: [] });
  console.log("Tx Hash:", hash);
  
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: 'ACCEPTED',
    interval: 5000,
    retries: 60,
  });

  const address =
    receipt?.txDataDecoded?.contractAddress ??
    receipt?.data?.contract_address ??
    receipt?.contractAddress;
    
  if (!address) {
    throw new Error("Deployment failed, address not found in receipt.");
  }
  
  console.log("Successfully Deployed to:", address);

  // Update frontend/.env file
  const frontendEnvPath = path.join(__dirname, '../frontend/.env');
  let envContent = '';
  if (existsSync(frontendEnvPath)) {
    envContent = readFileSync(frontendEnvPath, 'utf-8');
  }

  const envRegex = /^VITE_PROTOCOL_ADDRESS=.*$/m;
  const newEnvLine = `VITE_PROTOCOL_ADDRESS=${address}`;

  if (envRegex.test(envContent)) {
    envContent = envContent.replace(envRegex, newEnvLine);
  } else {
    envContent += `\n${newEnvLine}\n`;
  }

  writeFileSync(frontendEnvPath, envContent, 'utf-8');
  console.log("Updated frontend/.env with VITE_PROTOCOL_ADDRESS.");
}

main().catch(console.error);
