import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient, createAccount } from 'genlayer-js';
import { simulator } from 'genlayer-js/chains';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function waitForConsensus(client, hash, { timeoutMs = 420000, intervalMs = 6000 } = {}) {
  const start = Date.now();
  const done = new Set(['ACCEPTED', 'FINALIZED']);
  const failed = new Set(['UNDETERMINED', 'CANCELED']);
  let last = '';
  
  console.log(`Waiting for consensus on tx ${hash}...`);
  while (Date.now() - start < timeoutMs) {
    let tx;
    try {
      tx = await client.getTransaction({ hash });
    } catch {
      await sleep(intervalMs);
      continue;
    }
    
    const status = tx?.statusName ?? String(tx?.status ?? '');
    if (status && status !== last) {
      process.stdout.write(`  …${status}\n`);
      last = status;
    }
    if (done.has(status)) return tx;
    if (failed.has(status)) throw new Error(`transaction ${status}`);
    
    await sleep(intervalMs);
  }
  throw new Error('timed out waiting for consensus');
}

export async function readWithRetry(client, address, functionName, args = []) {
  for (let i = 0; i < 5; i++) {
    try {
      return await client.readContract({ address, functionName, args });
    } catch (err) {
      const msg = String(err?.message ?? err);
      if (/rate limit|exceeds defined limit|429/i.test(msg) && i < 4) {
        await sleep(1500 * (i + 1));
        continue;
      }
      throw err;
    }
  }
}

async function main() {
  console.log("=== Starting PoW Lending Protocol Live E2E Test ===\n");
  
  const pk = process.env.GENLAYER_PRIVATE_KEY;
  if (!pk) throw new Error("GENLAYER_PRIVATE_KEY is missing from environment. Please add it to .env");
  
  const account = createAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
  const client = createClient({ chain: simulator, account });
  
  const code = readFileSync(path.join(__dirname, '../contracts/PoWLendingProtocol.py'), 'utf-8');

  // 1. Deploy Contract
  console.log("[1] Deploying PoWLendingProtocol...");
  const deployHash = await client.deployContract({ 
      abi: [],
      bytecode: `0x${Buffer.from(code, 'utf8').toString('hex')}`,
      args: [] 
  });
  
  const receipt = await client.waitForTransactionReceipt({
    hash: deployHash,
    status: 'ACCEPTED',
    interval: 5000,
    retries: 60,
  });

  const address = receipt?.txDataDecoded?.contractAddress ?? receipt?.data?.contract_address ?? receipt?.contractAddress;
  if (!address) throw new Error("Deployment failed, address not found.");
  console.log(`✅ Successfully deployed to: ${address}\n`);

  // 2. Create Pool
  console.log("[2] Initializing Liquidity Pool (Alpha Fund)...");
  const poolHash = await client.writeContract({
    address,
    abi: [],
    functionName: 'create_pool',
    args: ['Alpha Fund', 500, 7000, 100000n, 2, 'Safe Web3 Builders']
  });
  await waitForConsensus(client, poolHash);
  console.log("✅ Liquidity Pool Created!\n");

  // Verify Pool
  const poolsJson = await readWithRetry(client, address, 'get_all_pools');
  const pools = JSON.parse(poolsJson);
  if (!pools || pools.length === 0) throw new Error("Pool was not found in state");
  console.log(`Verified Pool in state: ${pools[0].name} (Target Return: ${pools[0].target_return_bps} BPS)\n`);

  // 3. Create Proposal
  console.log("[3] Submitting Loan Proposal with GitHub Evidence...");
  const reqId = `LOAN-${Date.now()}`;
  // submit_proposal(proposal_id, borrower, requested_amount, pow_submission, wallet_age_days, total_transactions, avg_balance_usd, target_pool_id)
  const loanHash = await client.writeContract({
    address,
    abi: [],
    functionName: 'submit_proposal',
    args: [reqId, account.address, 500, 'https://github.com/tanawo3/PoW-Lending-Protocol', 365, 150, 100, 'Alpha Fund']
  });
  await waitForConsensus(client, loanHash);
  console.log("✅ Loan Proposal Submitted & Acknowledged by Validators!\n");

  // Verify Proposal
  const proposalsJson = await readWithRetry(client, address, 'fetch_all_proposals', [0, 50]);
  const proposals = JSON.parse(proposalsJson);
  if (!proposals || proposals.length === 0) throw new Error("Proposal was not found in state");
  console.log(`Verified Proposal in state: ${proposals[0].request_id} (Status: ${proposals[0].status})\n`);

  console.log("=== All E2E Tests Passed Successfully! ===");
}

if (process.argv[1] && process.argv[1].endsWith('live-test.mjs')) {
  main().catch(err => {
    console.error("\n❌ Test Failed:");
    console.error(err);
    process.exit(1);
  });
}
