import { createClient } from 'genlayer-js';
import { localnet } from 'genlayer-js/chains';
import fs from 'fs';

const client = createClient({ chain: localnet, account: Object.assign(() => {}, { address: '0x1234567890123456789012345678901234567890' }) });

const code = `
import genlayer.std as gl

@gl.evm.contract_interface
class DummyContract:
    def __init__(self):
        pass

    @gl.public.write
    def fail_me(self):
        raise gl.vm.UserError("[EXPECTED] Insufficient treasury balance")
`;

async function run() {
  try {
    console.log("Deploying dummy contract...");
    const deployHash = await client.deployContract({
      code: code,
      args: []
    });
    
    console.log("Waiting for deploy receipt...");
    const deployReceipt = await client.waitForTransactionReceipt({ hash: deployHash, status: 'FINALIZED' });
    const address = deployReceipt.contractAddress || deployReceipt.data?.contract_address;
    console.log("Deployed at:", address);
    
    console.log("Calling fail_me()...");
    const callHash = await client.writeContract({
      address: address,
      functionName: 'fail_me',
      args: []
    });
    
    console.log("Waiting for call receipt...", callHash);
    const callReceipt = await client.waitForTransactionReceipt({ hash: callHash, status: 'ACCEPTED' });
    
    console.log("Fetching full tx...");
    const tx = await client.getTransaction({ hash: callHash }).catch(() => null);
    
    fs.writeFileSync('receipt.json', JSON.stringify({ receipt: callReceipt, tx: tx }, null, 2));
    console.log("Saved to receipt.json!");
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
