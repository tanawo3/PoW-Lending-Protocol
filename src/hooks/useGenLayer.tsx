import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
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
  status: 'PENDING' | 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'REPAID' | 'REVOKED' | 'FLAGGED' | 'CONDITIONAL_OFFER';
  ai_reasoning: string;
  validator_notes: string;
  risk_score: number;
  vouch_score: number;
  wallet_trust_score: number;
  income_score: number;
  reputation_score: number;
  collateral: string;
  debt: string;
  pool_id: string;
  encrypted_data?: Record<string, EncryptedEvidence>;
  vouchers_json: string;
  appeal_history_json: string;
}

export interface EncryptedEvidence {
  evidence_id: string;
  provider: string;
  zk_proof_hash: string;
  is_verified: boolean;
  decrypted_data: string | null;
}

export interface SpeculativeMarket {
  market_id: string;
  question: string;
  total_pool_yes: number;
  total_pool_no: number;
  resolved: boolean;
  outcome_yes: boolean;
  bets_yes: Record<string, number>;
  bets_no: Record<string, number>;
}

export interface BorrowerProfile {
  completed_loans: number;
  late_payments: number;
  defaults: number;
  repayment_score: number;
  fraud_risk_score: string;
  kyc_status: string;
  identity_score: number;
  governance_score: number;
}

export interface PoolState {
  pool_id: string;
  name: string;
  target_return_bps: number;
  min_credit_score: number;
  max_loan_amount_wei: number;
  risk_tier: string;
  available_liquidity_wei: number;
  total_deposited_wei: number;
  depositors: Record<string, number>;
  status: string;
}

export interface GenTx {
  hash: string;
  type: 'deploy' | 'submit_proposal' | 'evaluate_proposal' | 'repay_loan' | 'revoke_proposal' | 'appeal_loan_decision' | 'ai_vouch' | 'create_pool' | 'deposit_liquidity' | 'withdraw_liquidity' | 'submit_identity_verification' | 'accept_conditional_offer' | 'withdraw_protocol_fees' | 'submit_encrypted_evidence' | 'reveal_agreement' | 'place_bet' | 'resolve_market';
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
  const [pools, setPools] = useState<PoolState[]>([]);
  const [markets, setMarkets] = useState<SpeculativeMarket[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<GenTx[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

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

  const txTypesRef = useRef<Record<string, string>>({});

  const waitTx = async (hash: string, activeClient: any) => {
    let receipt;
    try {
      receipt = await activeClient.waitForTransactionReceipt({ hash, status: 'ACCEPTED' });
    } catch (e: any) {
      updateTxStatus(hash, 'failed', e.message);
      throw e;
    }
    
    const leaderReceipt = receipt?.consensus_data?.leader_receipt?.[0] || receipt?.data?.consensus_data?.leader_receipt?.[0] || receipt?.leader_receipt;
    const executionResult = leaderReceipt?.execution_result || receipt?.txExecutionResultName || receipt?.resultName;
    
    const isError = 
      receipt?.status === 'ERROR' || 
      receipt?.status === 0 || 
      receipt?.status === 'ROLLBACK' || 
      executionResult === 'ERROR' || 
      executionResult === 'FAILURE' || 
      executionResult === 'FINISHED_WITH_ERROR' ||
      (leaderReceipt && leaderReceipt.execution_result !== 'SUCCESS');

    if (isError) {
      console.error("Tx failed receipt:", receipt);
      
      let errMsg = "Transaction rolled back during execution";
      
      const findError = (obj: any): string | null => {
          if (!obj) return null;
          if (typeof obj === 'string' && (obj.includes('[EXPECTED]') || obj.includes('Rollback') || obj.includes('Insufficient'))) return obj;
          if (Array.isArray(obj)) {
              for (const item of obj) {
                  const res = findError(item);
                  if (res) return res;
              }
          } else if (typeof obj === 'object') {
              for (const key in obj) {
                  if (key === 'error' || key === 'error_message' || key === 'errorMessage' || key === 'message') {
                      if (typeof obj[key] === 'string' && obj[key].trim() !== '') return obj[key];
                  }
                  const res = findError(obj[key]);
                  if (res) return res;
              }
          }
          return null;
      };

      const deepError = findError(receipt);
      if (deepError) {
          errMsg = deepError;
      } else if (receipt?.data?.error) {
          errMsg = typeof receipt.data.error === 'string' ? receipt.data.error : JSON.stringify(receipt.data.error);
      }
      
      updateTxStatus(hash, 'failed', errMsg);
      throw new Error(errMsg);
    }
    return receipt;
  };


  const addTx = useCallback((tx: GenTx) => {
    txTypesRef.current[tx.hash] = tx.type;
    setRecentTransactions(prev => [tx, ...prev]);
    if (tx.status === 'pending') {
      toast.loading(`Transaction Processing: ${tx.type.replace(/_/g, ' ').toUpperCase()}`, { id: tx.hash });
    }
  }, []);

  const updateTxStatus = useCallback((hash: string, status: 'success' | 'failed', err?: string) => {
    setRecentTransactions(prev => prev.map(t => t.hash === hash ? { ...t, status, error: err } : t));
    const type = txTypesRef.current[hash] || 'TRANSACTION';
    const displayType = type.replace(/_/g, ' ').toUpperCase();
    if (status === 'success') {
      toast.success(`${displayType} Confirmed!`, { id: hash });
    } else if (status === 'failed') {
      toast.error(`${displayType} Failed: ${err || 'Unknown Error'}`, { id: hash });
    }
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
      
      const receipt = await waitTx(hash, client);
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

    try {
        const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
        const client = getGenLayerClient(network, address, provider);

        const result = await (client as any).readContract({
            address: contractAddress,
            functionName: 'fetch_all_proposals',
            args: []
        });

        if (result) {
            const parsed = JSON.parse(result as string);
            setProposals(parsed);
        }
        
        const poolsResult = await (client as any).readContract({
            address: contractAddress,
            functionName: 'get_all_pools',
            args: []
        });
        
        if (poolsResult) {
            const parsedPools = JSON.parse(poolsResult as string);
            setPools(parsedPools);
        }
        
        const marketsResult = await (client as any).readContract({
            address: contractAddress,
            functionName: 'get_all_markets',
            args: []
        });
        
        if (marketsResult) {
            const parsedMarkets = JSON.parse(marketsResult as string);
            setMarkets(parsedMarkets);
        }
    } catch (e: any) {
        const errorMsg = (e?.message || e?.shortMessage || e?.details || String(e) || '').toLowerCase();
        const isNotFound = errorMsg.includes("not found") || errorMsg.includes("resource not found") || errorMsg.includes("404") || errorMsg.includes("no contract") || errorMsg.includes("execution failed") || errorMsg.includes("missing or invalid");
        if (isNotFound) {
            setError(`The active contract (${contractAddress}) was not found on ${networkName}.`);
        } else {
            setError("Failed to fetch state: " + errorMsg);
        }
    } finally {
        setIsFetching(false);
    }
  }, [contractAddress, address, network, networkName]);
  
  const submitProposal = async (proposal_id: string, requested_amount: number, pow_submission: string, wallet_age_days: number, total_transactions: number, avg_balance_usd: number, value: bigint, target_pool_id: string = "") => {
      if (!contractAddress) return;
      setError(null);

      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);

          if (typeof (client as any).connect === 'function') {
              try {
                  await (client as any).connect(network);
              } catch (e) {
                  console.log("Connect call failed, continuing with provider", e);
              }
          }

          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'submit_proposal',
              args: [proposal_id, address, requested_amount, pow_submission, wallet_age_days, total_transactions, avg_balance_usd, target_pool_id],
              value: value
          });
          
          addTx({
            hash,
            type: 'submit_proposal',
            proposal_id,
            status: 'pending',
            timestamp: Date.now()
          });

          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Failed to send submit_proposal transaction: " + stripErrorPrefix(e.message));
      }
  };

  const getBorrowerProfile = async (borrowerAddr: string): Promise<BorrowerProfile | null> => {
      if (!contractAddress || !borrowerAddr) return null;
      try {
          const client = getGenLayerClient(network, address);
          const result = await (client as any).readContract({ address: contractAddress, functionName: 'get_borrower_profile', args: [borrowerAddr] });
          if (result) {
              return JSON.parse(result as string) as BorrowerProfile;
          }
      } catch (e) {
          return null;
      }
      return null;
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

          await waitTx(hash, client);
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
          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Failed to repay loan: " + stripErrorPrefix(e.message));
      }
  };

  const appealLoanDecision = async (proposal_id: string, evidence: string) => {
      if (!contractAddress) return;
      setIsEvaluating(true);
      setError(null);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'appeal_loan_decision',
              args: [proposal_id, evidence]
          });
          addTx({ hash, type: 'appeal_loan_decision', proposal_id, status: 'pending', timestamp: Date.now() });
          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Appeal failed: " + stripErrorPrefix(e.message));
      } finally {
          setIsEvaluating(false);
      }
  };

  const aiVouch = async (proposal_id: string, rationale: string) => {
      if (!contractAddress) return;
      setIsEvaluating(true);
      setError(null);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'ai_vouch',
              args: [proposal_id, rationale]
          });
          addTx({ hash, type: 'ai_vouch', proposal_id, status: 'pending', timestamp: Date.now() });
          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Vouching failed: " + stripErrorPrefix(e.message));
      } finally {
          setIsEvaluating(false);
      }
  };

  const revokeProposal = async (proposal_id: string) => {
      if (!contractAddress) return;
      setIsEvaluating(true);
      setError(null);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'revoke_proposal',
              args: [proposal_id]
          });
          addTx({ hash, type: 'revoke_proposal', proposal_id, status: 'pending', timestamp: Date.now() });
          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Failed to revoke: " + stripErrorPrefix(e.message));
      } finally {
          setIsEvaluating(false);
      }
  };

  const createPool = async (name: string, target_return_bps: number, min_credit_score: number, max_loan_amount_wei: number, risk_tier: string) => {
      if (!contractAddress) return;
      setError(null);
      setIsEvaluating(true);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'create_pool',
              args: [name, BigInt(target_return_bps), BigInt(min_credit_score), BigInt(max_loan_amount_wei), risk_tier]
          });
          addTx({ hash, type: 'create_pool', status: 'pending', timestamp: Date.now() });
          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Failed to create pool: " + stripErrorPrefix(e.message));
          throw e;
      } finally {
          setIsEvaluating(false);
      }
  };

  const createTargetedPool = async (name: string, target_return_bps: number, criteria: string) => {
      if (!contractAddress) return;
      setError(null);
      setIsEvaluating(true);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'create_targeted_pool',
              args: [name, BigInt(target_return_bps), criteria]
          });
          addTx({ hash, type: 'create_targeted_pool', status: 'pending', timestamp: Date.now() });
          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Failed to create targeted pool: " + stripErrorPrefix(e.message));
          throw e;
      } finally {
          setIsEvaluating(false);
      }
  };

  const rebalanceMacroRisk = async () => {
      if (!contractAddress) return;
      setError(null);
      setIsEvaluating(true);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'rebalance_macro_risk',
              args: []
          });
          addTx({ hash, type: 'rebalance_macro_risk', status: 'pending', timestamp: Date.now() });
          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
      } catch (e: any) {
          setError("Failed to rebalance macro risk: " + stripErrorPrefix(e.message));
      } finally {
          setIsEvaluating(false);
      }
  };

  const depositLiquidity = async (pool_id: string, amount: bigint) => {
      if (!contractAddress) return;
      setError(null);
      setIsEvaluating(true);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'deposit_liquidity',
              args: [pool_id],
              value: amount
          });
          addTx({ hash, type: 'deposit_liquidity', status: 'pending', timestamp: Date.now() });
          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Deposit failed: " + stripErrorPrefix(e.message));
      } finally {
          setIsEvaluating(false);
      }
  };

  const withdrawLiquidity = async (pool_id: string, amount: bigint) => {
      if (!contractAddress) return;
      setError(null);
      setIsEvaluating(true);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'withdraw_liquidity',
              args: [pool_id, amount]
          });
          addTx({ hash, type: 'withdraw_liquidity', status: 'pending', timestamp: Date.now() });
          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Withdrawal failed: " + stripErrorPrefix(e.message));
      } finally {
          setIsEvaluating(false);
      }
  };

  const submitIdentityVerification = async (documentHash: string, selfieHash: string, proofOfAddressHash: string) => {
      if (!contractAddress) return;
      setError(null);
      setIsEvaluating(true);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'submit_identity_verification',
              args: [documentHash, selfieHash, proofOfAddressHash]
          });
          addTx({ hash, type: 'submit_identity_verification', status: 'pending', timestamp: Date.now() });
          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
      } catch (e: any) {
          setError("Verification failed: " + stripErrorPrefix(e.message));
      } finally {
          setIsEvaluating(false);
      }
  };

  const acceptConditionalOffer = async (proposalId: string) => {
      if (!contractAddress) return;
      setError(null);
      setIsEvaluating(true);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'accept_conditional_offer',
              args: [proposalId]
          });
          addTx({ hash, type: 'accept_conditional_offer', proposal_id: proposalId, status: 'pending', timestamp: Date.now() });
          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Accepting offer failed: " + stripErrorPrefix(e.message));
      } finally {
          setIsEvaluating(false);
      }
  };

  const withdrawProtocolFees = async (amount: bigint) => {
      if (!contractAddress) return;
      setError(null);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'withdraw_protocol_fees',
              args: [amount]
          });
          addTx({ hash, type: 'withdraw_protocol_fees', status: 'pending', timestamp: Date.now() });
          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
      } catch (e: any) {
          setError("Withdrawal failed: " + stripErrorPrefix(e.message));
      }
  };

  const markDefault = async (proposal_id: string) => {
      if (!contractAddress) return;
      setError(null);
      setIsEvaluating(true);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'mark_default',
              args: [proposal_id]
          });
          addTx({ hash, type: 'mark_default', status: 'pending', timestamp: Date.now() });
          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
      } catch (e: any) {
          setError("Failed to mark default: " + stripErrorPrefix(e.message));
      } finally {
          setIsEvaluating(false);
      }
  };

  const simulateDefault = async (proposal_id: string) => {
      if (!contractAddress) return "0.0";
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          return await (client as any).readContract({ address: contractAddress, functionName: 'simulate_loan_default_probability', args: [proposal_id] });
      } catch (e: any) {
          console.error(e);
          return "0.0";
      }
  };

  const healthCheck = async () => {
      if (!contractAddress) return "Not connected";
      try {
          const client = getGenLayerClient(network, address);
          return await (client as any).readContract({ address: contractAddress, functionName: 'perform_health_check', args: [] });
      } catch (e) {
          return "Health check failed";
      }
  };

  const exportSnapshot = async (offset: number, limit: number) => {
      if (!contractAddress) return "Not connected";
      try {
          const client = getGenLayerClient(network, address);
          return await (client as any).readContract({ address: contractAddress, functionName: 'export_state_snapshot', args: [offset, limit] });
      } catch (e) {
          return "Snapshot export failed";
      }
  };

  const getContractVersion = async () => {
      if (!contractAddress) return "Unknown";
      try {
          const client = getGenLayerClient(network, address);
          return await (client as any).readContract({ address: contractAddress, functionName: 'get_contract_version', args: [] });
      } catch (e) {
          return "Unknown";
      }
  };

  const getDeveloperMetadata = async () => {
      if (!contractAddress) return "Unknown";
      try {
          const client = getGenLayerClient(network, address);
          return await (client as any).readContract({ address: contractAddress, functionName: 'get_developer_metadata', args: [] });
      } catch (e) {
          return "Unknown";
      }
  };

  const verifyNodeCompliance = async (node_id: string) => {
      if (!contractAddress) return false;
      try {
          const client = getGenLayerClient(network, address);
          return await (client as any).readContract({ address: contractAddress, functionName: 'verify_node_compliance', args: [node_id] });
      } catch (e) {
          return false;
      }
  };

  const submitEncryptedEvidence = async (proposal_id: string, evidence_id: string, zk_proof_hash: string) => {
      if (!contractAddress) return;
      setError(null);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'submit_encrypted_evidence',
              args: [proposal_id, zk_proof_hash]
          });
          addTx({ hash, type: 'submit_encrypted_evidence', proposal_id, status: 'pending', timestamp: Date.now() });
          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Failed to submit encrypted evidence: " + stripErrorPrefix(e.message));
      }
  };

  const revealAgreement = async (proposal_id: string, evidence_id: string) => {
      if (!contractAddress) return;
      setIsEvaluating(true);
      setError(null);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'reveal_agreement',
              args: [proposal_id, evidence_id, ""]
          });
          addTx({ hash, type: 'reveal_agreement', proposal_id, status: 'pending', timestamp: Date.now() });
          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Failed to reveal agreement: " + stripErrorPrefix(e.message));
      } finally {
          setIsEvaluating(false);
      }
  };

  const placeBet = async (market_id: string, bet_on_yes: boolean, amount: bigint) => {
      if (!contractAddress) return;
      setError(null);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'place_bet',
              args: [market_id, bet_on_yes],
              value: amount
          });
          addTx({ hash, type: 'place_bet', status: 'pending', timestamp: Date.now() });
          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Failed to place bet: " + stripErrorPrefix(e.message));
      }
  };

  const resolveMarket = async (market_id: string, actual_outcome: string) => {
      if (!contractAddress) return;
      setIsEvaluating(true);
      setError(null);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'resolve_market',
              args: [market_id, actual_outcome]
          });
          addTx({ hash, type: 'resolve_market', status: 'pending', timestamp: Date.now() });
          await waitTx(hash, client);
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Failed to resolve market: " + stripErrorPrefix(e.message));
      } finally {
          setIsEvaluating(false);
      }
  };

  return {
    address,
    isConnected,
    connect,
    disconnect,
    contractAddress,
    isFetching,
    proposals,
    pools,
    recentTransactions,
    error,
    deployContract,
    fetchProposals,
    submitProposal,
    getBorrowerProfile,
    evaluateProposal,
    repayLoan,
    revokeProposal,
    appealLoanDecision,
    aiVouch,
    createPool,
    depositLiquidity,
    withdrawLiquidity,
    submitIdentityVerification,
    acceptConditionalOffer,
    withdrawProtocolFees,
    markDefault,
    healthCheck,
    exportSnapshot,
    getContractVersion,
    getDeveloperMetadata,
    verifyNodeCompliance,
    submitEncryptedEvidence,
    revealAgreement,
    placeBet,
    resolveMarket,
    markets,
    network,
    setNetwork,
    networkName,
    setError,
    setContractAddress,
    isDeploying,
    createTargetedPool,
    rebalanceMacroRisk
  };
};
