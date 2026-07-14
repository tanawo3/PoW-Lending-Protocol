import { useState, useCallback, useEffect } from 'react';
import { getGenLayerClient, GLOBAL_CONTRACT_ADDRESS, GenLayerNetwork } from '../utils/networkConfig';
import contractCode from '../../contracts/PoWLendingProtocol.py?raw';

const stripErrorPrefix = (msg: string) => {
  if (!msg) return msg;
  return msg.replace(/\[(EXPECTED|EXTERNAL|TRANSIENT|LLM_ERROR)\]\s*/g, '').trim();
};

export interface ProposalState {
  proposal_id: string;
  borrower: string;
  requested_amount: number;
  pow_submission: string;
  state: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'REPAID' | 'REVOKED' | 'FLAGGED';
  validator_notes: string;
  risk_score: number;
  collateral: string;
  debt: string;
}

export interface GenTx {
  hash: string;
  type: 'deploy' | 'submit_proposal' | 'evaluate_proposal' | 'repay_loan' | 'revoke_proposal';
  proposal_id?: string;
  status: 'pending' | 'success' | 'failed';
  error?: string;
  timestamp: number;
}

function isValidContractAddress(val: string, senderAddress: string): boolean {
  if (typeof val !== 'string') return false;
  const clean = val.trim().toLowerCase();
  if (!clean.startsWith('0x') || clean.length !== 42) return false;
  if (!/^0x[0-9a-f]{40}$/.test(clean)) return false;
  
  const systemAddresses = [
    '0x0000000000000000000000000000000000000000',
    '0xb7278a61aa25c888815afc32ad3cc52ff24fe575',
    '0x88b0f18613db92bf970ffe264e02496e20a74d16',
    '0x63fa5e0bb10fb6fa98f44726c5518223f767687a',
    '0x21737aa4bea8ff12e202bf1bab23751a95617533',
    '0x1f595c0d549de0812f127508ea1039636cfa62cc',
    '0x0f739dd8f5322b9547c7d19a9621bc2ac8df4089',
    '0x6caff6769d70824745ad895663409dc70ab5b28e',
    '0x0d9d1d74d72fa5eb94bcf746c8fccb312a722c9b',
    '0x4a4449e617f8d10fded0b461cadef83939e821a5',
    '0xf205868bf5db79d2162843742D18D0900A9E462a',
    '0x7134d05af13a14c0b66Fe129fb930b1d0C420e33',
    '0xbb8c35aa878d09b9830aff9e5aac6492bfbd5471',
    '0x0112bf6e83497965a5fdd6dad1e447a6E004271D',
    '0x85d7bf947a512fc640c75327a780c90847267697'
  ];

  if (systemAddresses.includes(clean)) return false;
  if (senderAddress && clean === senderAddress.toLowerCase()) return false;
  return true;
}

function findDeployedAddress(obj: any, senderAddress: string): string | null {
  if (!obj) return null;
  
  const directFields = [
    obj.txDataDecoded?.contractAddress,
    obj.tx_data_decoded?.contractAddress,
    obj.tx_data_decoded?.contract_address,
    obj.recipient,
    obj.recipient_address,
    obj.contractAddress,
    obj.contract_address,
    obj.to_address,
    obj.to,
    obj.data?.contract_address,
    obj.data?.contractAddress,
    obj.data?.recipient,
    obj.data?.to,
    obj.data?.to_address
  ];

  for (const addr of directFields) {
    if (addr && typeof addr === 'string' && isValidContractAddress(addr, senderAddress)) {
      return addr;
    }
  }

  const candidates: string[] = [];
  function scan(val: any) {
    if (!val) return;
    if (typeof val === 'string') {
      if (isValidContractAddress(val, senderAddress)) {
        candidates.push(val);
      }
    } else if (typeof val === 'object') {
      for (const k in val) {
        if (Object.prototype.hasOwnProperty.call(val, k)) {
          scan(val[k]);
        }
      }
    }
  }
  scan(obj);
  
  return candidates.length > 0 ? candidates[0] : null;
}

export const useGenLayer = () => {
  const [address, setAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [contractAddress, setContractAddress] = useState<string>(
    localStorage.getItem('POW_CONTRACT_ADDRESS_V2') || GLOBAL_CONTRACT_ADDRESS
  );
  const [network, setNetwork] = useState<GenLayerNetwork>('studionet');
  const [networkName, setNetworkName] = useState<string>('Genlayer Studio Network');
  
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  
  const [proposals, setProposals] = useState<ProposalState[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<GenTx[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (network === 'bradbury') setNetworkName('Genlayer Bradbury Testnet');
    else if (network === 'studionet') setNetworkName('Genlayer Studio Network');
    else setNetworkName('Genlayer Localnet');

    setContractAddress(localStorage.getItem('POW_CONTRACT_ADDRESS_V2') || GLOBAL_CONTRACT_ADDRESS);
    setError(null);
  }, [network, setContractAddress]);

  const connect = useCallback(async () => {
    setError(null);
    const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
    
    if (!provider) {
      setError("No Web3 wallet detected. Please install MetaMask, Rabby, or OKX Wallet to interact with GenLayer.");
      return;
    }
    
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
      }
    } catch (e: any) {
      setError(e.message || "Wallet connection failed");
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress('');
    setIsConnected(false);
  }, []);

  const addTx = useCallback((tx: GenTx) => {
    setRecentTransactions(prev => [tx, ...prev]);
  }, []);

  const updateTxStatus = useCallback((hash: string, status: 'success' | 'failed', err?: string) => {
    setRecentTransactions(prev => prev.map(t => t.hash === hash ? { ...t, status, error: err } : t));
  }, []);

  const deployContract = useCallback(async () => {
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }
    
    setIsDeploying(true);
    setError(null);
    
    try {
      const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
      const client = getGenLayerClient(network, address, provider);

      if (typeof (client as any).connect === 'function') {
        try {
          await (client as any).connect(network);
        } catch (connErr: any) {
          // Silent connect failure handling
        }
      }
      
      const hash = await (client as any).deployContract({
        account: address ? { address } : undefined,
        code: contractCode as string,
        args: [],
      });

      addTx({
        hash,
        type: 'deploy',
        status: 'pending',
        timestamp: Date.now()
      });
      
      const receipt = await (client as any).waitForTransactionReceipt({ hash, status: 'ACCEPTED' });
      const deployedAddress = findDeployedAddress(receipt, address);

      if (receipt && deployedAddress) {
          setContractAddress(deployedAddress);
          localStorage.setItem('POW_CONTRACT_ADDRESS_V2', deployedAddress);
          updateTxStatus(hash, 'success');
      } else {
          updateTxStatus(hash, 'failed', 'Receipt did not contain contractAddress');
          setError("Smart contract deployment did not return a valid address. Check explorer or transaction status.");
      }
    } catch (e: any) {
      setError(e.message || "Failed to deploy contract. Ensure your wallet is connected, set to correct chain ID, and has testnet GEN tokens.");
    } finally {
      setIsDeploying(false);
    }
  }, [address, network, addTx, updateTxStatus]);

  const fetchProposals = useCallback(async () => {
    if (!contractAddress || contractAddress === "") return;
    
    setIsFetching(true);
    setError(null);

    let retries = 15;
    let delayMs = 2000;
    let result: any = null;
    let lastError: any = null;

    while (retries > 0) {
      try {
        const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
        const client = getGenLayerClient(network, address, provider);
        
        result = await (client as any).readContract({
            address: contractAddress,
            functionName: 'fetch_all_proposals',
            args: []
        });
        break;
      } catch (e: any) {
        lastError = e;
        const errorMsg = (e?.message || e?.shortMessage || e?.details || String(e) || '').toLowerCase();
        const isNotFound = errorMsg.includes("not found") || errorMsg.includes("resource not found") || errorMsg.includes("404") || errorMsg.includes("no contract") || errorMsg.includes("execution failed") || errorMsg.includes("missing or invalid");
        if (isNotFound && retries > 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          retries--;
          delayMs *= 1.2;
        } else {
          break;
        }
      }
    }

    if (result) {
      try {
        const rawData = typeof result === 'string' ? JSON.parse(result) : result;
        const parsed: ProposalState[] = Object.values(rawData).map((m: any) => {
          const item = typeof m === 'string' ? JSON.parse(m) : m;
          return {
            ...item,
            state: item.status === 'PENDING' ? 'PENDING_VERIFICATION' : item.status,
            validator_notes: item.ai_reasoning || ''
          };
        });
        setProposals(parsed);
      } catch (parseErr: any) {
        setError("Failed to parse proposals state: " + parseErr.message);
      }
      setIsFetching(false);
      return;
    }

    const errorMsg = lastError?.message || lastError?.details || String(lastError) || '';
    const errorMsgLower = errorMsg.toLowerCase();
    const isNotFound = errorMsgLower.includes("not found") || errorMsgLower.includes("resource not found") || errorMsgLower.includes("404") || errorMsgLower.includes("no contract") || errorMsgLower.includes("execution failed") || errorMsgLower.includes("missing or invalid");
    if (isNotFound) {
      setError(`The active contract (${contractAddress}) was not found on ${networkName}. It might still be propagating on-chain, or it may belong to a different network. Please wait a few moments and try refreshing.`);
      setProposals([]);
    } else {
      setError("Failed to fetch proposals from the active contract: " + errorMsg);
    }
    setIsFetching(false);
  }, [contractAddress, address, network, networkName]);
  
  const submitProposal = async (proposal_id: string, borrower: string, requested_amount: number, pow_submission: string, value: bigint) => {
      if (!contractAddress) return;
      setError(null);

      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);

          if (typeof (client as any).connect === 'function') {
              try {
                  await (client as any).connect(network);
              } catch (connErr: any) {
                  // Silent connect failure handling
              }
          }

          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'submit_proposal',
              args: [proposal_id, borrower, requested_amount, pow_submission],
              value: value
          });
          
          addTx({
            hash,
            type: 'submit_proposal',
            proposal_id,
            status: 'pending',
            timestamp: Date.now()
          });

          await (client as any).waitForTransactionReceipt({ hash, status: 'ACCEPTED' });
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Failed to send submit_proposal transaction: " + stripErrorPrefix(e.message));
      }
  };

  const evaluateProposal = async (proposal_id: string) => {
      if (!contractAddress) return;
      setIsEvaluating(true);
      setError(null);

      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);

          if (typeof (client as any).connect === 'function') {
              try {
                  await (client as any).connect(network);
              } catch (connErr: any) {
                  // Silent connect failure handling
              }
          }

          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'evaluate_proposal',
              args: [proposal_id]
          });
          
          addTx({
            hash,
            type: 'evaluate_proposal',
            proposal_id,
            status: 'pending',
            timestamp: Date.now()
          });

          await (client as any).waitForTransactionReceipt({ hash, status: 'ACCEPTED' });
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Consensus execution failed: " + stripErrorPrefix(e.message));
      } finally {
          setIsEvaluating(false);
      }
  };

  const repayLoan = async (proposalId: string, amount: bigint) => {
      if (!contractAddress) return;
      setError(null);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          if (typeof (client as any).connect === 'function') {
              try { await (client as any).connect(network); } catch (connErr: any) {}
          }
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'repay_loan',
              args: [proposalId],
              value: amount
          });
          addTx({ hash, type: 'repay_loan', status: 'pending', timestamp: Date.now() });
          await (client as any).waitForTransactionReceipt({ hash, status: 'ACCEPTED' });
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Failed to repay loan: " + stripErrorPrefix(e.message));
      }
  };

  return {
    address,
    isConnected,
    connect,
    disconnect,
    contractAddress,
    setContractAddress,
    deployContract,
    isDeploying,
    isEvaluating,
    isFetching,
    proposals,
    fetchProposals,
    submitProposal,
    evaluateProposal,
    repayLoan,
    network,
    setNetwork,
    networkName,
    recentTransactions,
    error,
    setError
  };
};

