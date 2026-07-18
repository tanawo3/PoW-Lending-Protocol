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
  console.log("=== Starting PoW Lending Protocol ULTIMATE E2E Test ===\n");
  
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
  
  const receipt = await client.waitForTransactionReceipt({ hash: deployHash, status: 'ACCEPTED', interval: 5000, retries: 60 });
  const address = receipt?.txDataDecoded?.contractAddress ?? receipt?.data?.contract_address ?? receipt?.contractAddress;
  if (!address) throw new Error("Deployment failed, address not found.");
  console.log(`✅ Successfully deployed to: ${address}\n`);

  // 2. Create Pool
  console.log("[2] Initializing Liquidity Pool (Alpha Fund)...");
  const poolHash = await client.writeContract({
    address, abi: [], functionName: 'create_pool',
    args: ['Alpha Fund', 500, 7000, 100000n, 2, 'Safe Web3 Builders']
  });
  await waitForConsensus(client, poolHash);
  console.log("✅ Liquidity Pool Created!\n");

  // ==========================================
  // PATH A: Good Loan Lifecycle (Happy Path)
  // ==========================================
  console.log("[3] PATH A: Good Loan Lifecycle (Submit -> Evaluate -> Accept -> Repay)");
  const loan1 = `LOAN-GOOD-${Date.now()}`;
  const s1 = await client.writeContract({
    address, abi: [], functionName: 'submit_proposal',
    args: [loan1, account.address, 500, 'https://github.com/tanawo3/PoW-Lending-Protocol', 365, 150, 100, 'Alpha Fund'],
    value: 100000n // Collateral
  });
  await waitForConsensus(client, s1);
  
  console.log("  -> Triggering AI Evaluation...");
  const ev1 = await client.writeContract({ address, abi: [], functionName: 'evaluate_proposal', args: [loan1] });
  await waitForConsensus(client, ev1);
  
  console.log("  -> Accepting Offer...");
  const ac1 = await client.writeContract({ address, abi: [], functionName: 'accept_conditional_offer', args: [loan1] });
  await waitForConsensus(client, ac1);
  
  // Read Debt for Repayment
  const pJson1 = await readWithRetry(client, address, 'fetch_all_proposals', [0, 50]);
  const p1 = JSON.parse(pJson1).find(p => p.request_id === loan1);
  const debt1 = BigInt(p1.debt);

  console.log(`  -> Repaying Loan (Debt: ${debt1} Wei)...`);
  const rp1 = await client.writeContract({ address, abi: [], functionName: 'repay_loan', args: [loan1], value: debt1 });
  await waitForConsensus(client, rp1);
  console.log("✅ PATH A Complete!\n");

  // ==========================================
  // PATH B: Default Lifecycle
  // ==========================================
  console.log("[4] PATH B: Default Lifecycle (Submit -> Evaluate -> Accept -> Default)");
  const loan2 = `LOAN-DEF-${Date.now()}`;
  const s2 = await client.writeContract({
    address, abi: [], functionName: 'submit_proposal',
    args: [loan2, account.address, 500, 'https://github.com/tanawo3/PoW-Lending-Protocol', 365, 150, 100, 'Alpha Fund'],
    value: 100000n // Collateral
  });
  await waitForConsensus(client, s2);
  
  console.log("  -> Triggering AI Evaluation...");
  const ev2 = await client.writeContract({ address, abi: [], functionName: 'evaluate_proposal', args: [loan2] });
  await waitForConsensus(client, ev2);

  console.log("  -> Accepting Offer...");
  const ac2 = await client.writeContract({ address, abi: [], functionName: 'accept_conditional_offer', args: [loan2] });
  await waitForConsensus(client, ac2);

  console.log("  -> Marking as Default...");
  const def2 = await client.writeContract({ address, abi: [], functionName: 'mark_default', args: [loan2] });
  await waitForConsensus(client, def2);
  console.log("✅ PATH B Complete!\n");

  // ==========================================
  // PATH C: Bad Loan & Appeal Lifecycle
  // ==========================================
  console.log("[5] PATH C: Bad Loan & Appeal Lifecycle (Submit Bad -> Evaluate -> Appeal)");
  const loan3 = `LOAN-BAD-${Date.now()}`;
  const s3 = await client.writeContract({
    address, abi: [], functionName: 'submit_proposal',
    args: [loan3, account.address, 50000, 'empty', 1, 0, 0, 'Alpha Fund'],
    value: 1000n // Very low collateral
  });
  await waitForConsensus(client, s3);
  
  console.log("  -> Triggering AI Evaluation (Expecting REJECTED)...");
  const ev3 = await client.writeContract({ address, abi: [], functionName: 'evaluate_proposal', args: [loan3] });
  await waitForConsensus(client, ev3);

  console.log("  -> Appealing Decision with Dispute Evidence...");
  const ap3 = await client.writeContract({ address, abi: [], functionName: 'appeal_loan_decision', args: [loan3, 'Wait, I actually have 500 merged PRs here: github.com/tanawo3/PoW-Lending-Protocol'] });
  await waitForConsensus(client, ap3);
  console.log("✅ PATH C Complete!\n");

  // ==========================================
  // PATH D: Peripheral & Advanced Features Lifecycle
  // ==========================================
  console.log("[6] PATH D: Peripheral & Advanced Features Lifecycle");
  
  console.log("  -> Identity & Roles...");
  const idHash = await client.writeContract({ address, abi: [], functionName: 'submit_identity_verification', args: ['docHash', 'selfieHash', 'poaHash'] });
  await waitForConsensus(client, idHash);
  const roleHash = await client.writeContract({ address, abi: [], functionName: 'grant_role', args: [account.address, 'AUDITOR'] });
  await waitForConsensus(client, roleHash);

  console.log("  -> Liquidity Management...");
  const depHash = await client.writeContract({ address, abi: [], functionName: 'deposit_liquidity', args: ['Alpha Fund'], value: 1000n });
  await waitForConsensus(client, depHash);
  const withHash = await client.writeContract({ address, abi: [], functionName: 'withdraw_liquidity', args: ['Alpha Fund', 500] });
  await waitForConsensus(client, withHash);
  const rebHash = await client.writeContract({ address, abi: [], functionName: 'rebalance_macro_risk', args: [] });
  await waitForConsensus(client, rebHash);

  console.log("  -> Creating LOAN-4 for Advanced Features...");
  const loan4 = `LOAN-ADV-${Date.now()}`;
  const s4 = await client.writeContract({ address, abi: [], functionName: 'submit_proposal', args: [loan4, account.address, 500, 'github.com/tanawo3/PoW', 365, 150, 100, 'Alpha Fund'], value: 1000n });
  await waitForConsensus(client, s4);

  console.log("  -> Social Vouching & ZK Evidence...");
  const vouchHash = await client.writeContract({ address, abi: [], functionName: 'ai_vouch', args: [loan4, 'I vouch for this borrower, they are legit.'] });
  await waitForConsensus(client, vouchHash);
  const zkHash = await client.writeContract({ address, abi: [], functionName: 'submit_encrypted_evidence', args: [loan4, '0xencryptedPayload123'] });
  await waitForConsensus(client, zkHash);
  const revHash = await client.writeContract({ address, abi: [], functionName: 'reveal_agreement', args: [loan4, 'plaintext terms', 'salt123'] });
  await waitForConsensus(client, revHash);

  console.log("  -> Prediction Markets (Betting)...");
  const betHash = await client.writeContract({ address, abi: [], functionName: 'place_bet', args: [loan4, 'REPAY'], value: 500n });
  await waitForConsensus(client, betHash);

  console.log("  -> Resolving Market & Revoking Proposal...");
  const rmHash = await client.writeContract({ address, abi: [], functionName: 'resolve_market', args: [loan4, 'REPAY'] });
  await waitForConsensus(client, rmHash);
  const revokeHash = await client.writeContract({ address, abi: [], functionName: 'revoke_proposal', args: [loan4] });
  await waitForConsensus(client, revokeHash);

  console.log("  -> Withdrawing Protocol Fees & Revoking Roles...");
  // Withdraw 1 unit of fee, assuming some accumulated during PATH A
  const feeHash = await client.writeContract({ address, abi: [], functionName: 'withdraw_protocol_fees', args: [1] });
  await waitForConsensus(client, feeHash);
  
  const revokeRoleHash = await client.writeContract({ address, abi: [], functionName: 'revoke_role', args: [account.address] });
  await waitForConsensus(client, revokeRoleHash);

  console.log("✅ PATH D Complete!\n");

  console.log("=== All 20/20 Methods Tested Successfully! ===");
}

if (process.argv[1] && process.argv[1].endsWith('live-test.mjs')) {
  main().catch(err => {
    console.error("\n❌ Test Failed:");
    console.error(err);
    process.exit(1);
  });
}
