import { createClient } from 'genlayer-js';
import { localnet, studionet, testnetBradbury } from 'genlayer-js/chains';

export const GLOBAL_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

export type GenLayerNetwork = 'localnet' | 'studionet' | 'bradbury';

export const getGenLayerClient = (network: GenLayerNetwork = 'localnet', accountAddress?: string, provider?: any) => {
  let chain = localnet;
  if (network === 'studionet') {
    chain = studionet;
  } else if (network === 'bradbury') {
    chain = testnetBradbury;
  }
  
  let account: any = undefined;
  if (accountAddress && accountAddress.trim() !== '') {
    // Return a function to make typeof config.account !== "object" evaluate to true,
    // which forces isAddress to true in getCustomTransportConfig,
    // but assign an address property to satisfy genlayer-js validateAccount and _encodeAddTransactionData requirements.
    account = Object.assign(() => {}, { address: accountAddress });
  }

  return createClient({
    chain,
    account,
    provider,
  });
};
