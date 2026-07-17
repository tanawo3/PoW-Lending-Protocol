import { useState, useCallback, useEffect } from 'react';
import { getGenLayerClient, GLOBAL_CONTRACT_ADDRESS, GenLayerNetwork } from '../utils/networkConfig';
import contractCode from '../../contracts/PoWLendingProtocol.py?raw';
import { ToastMessage, ToastType } from '../components/Toast';

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
    localStorage.getItem('POW_CONTRACT_ADDRESS_V3') || GLOBAL_CONTRACT_ADDRESS
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

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (network === 'bradbury') setNetworkName('Genlayer Bradbury Testnet');
    else if (network === 'studionet') setNetworkName('Genlayer Studio Network');
    else setNetworkName('Genlayer Localnet');

    const saved = localStorage.getItem('POW_CONTRACT_FINAL');
    if (saved) {
      setContractAddress(saved);
    }
    setError(null);
  }, [network]);

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
      
      const receiptObj: any = await (client as any).waitForTransactionReceipt({ hash });
      if (receiptObj && receiptObj.status !== 'ACCEPTED') throw new Error(`Deploy reverted: ${receiptObj.status}`);
      const deployedAddress = findDeployedAddress(receiptObj, address);

      if (receiptObj && deployedAddress) {
          setContractAddress(deployedAddress);
          localStorage.setItem('POW_CONTRACT_FINAL', deployedAddress);
          updateTxStatus(hash, 'success');
          addToast("Contract deployed successfully", 'success');
      } else {
          updateTxStatus(hash, 'failed', 'Receipt did not contain contractAddress');
          setError("Smart contract deployment did not return a valid address. Check explorer or transaction status.");
          addToast("Deployment failed", 'error');
      }
    } catch (e: any) {
      const errorDetails = e?.message || e?.shortMessage || e?.details || String(e);
      updateTxStatus('deploy_failed', 'failed', 'Error: ' + errorDetails);
      setError("Failed to deploy contract. GenVM Error Trace: " + stripErrorPrefix(errorDetails));
      addToast("Deployment failed", 'error');
    } finally {
      setIsDeploying(false);
    }
  }, [address, network, addTx, updateTxStatus, addToast]);

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
              args: [pow_submission, requested_amount, target_pool_id]
          });
          
          addTx({
            hash,
            type: 'submit_proposal',
            proposal_id,
            status: 'pending',
            timestamp: Date.now()
          });

          const receiptObj: any = await (client as any).waitForTransactionReceipt({ hash });
          if (receiptObj && receiptObj.status !== 'ACCEPTED') throw new Error(`Transaction reverted: ${receiptObj.status}`);
          updateTxStatus(hash, 'success');
          await fetchProposals();
          addToast("Proposal submitted successfully!", 'success');
      } catch (e: any) {
          setError("Failed to send submit_proposal transaction: " + stripErrorPrefix(e.message));
          addToast("Submission failed: " + stripErrorPrefix(e.message), 'error');
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

          const receiptObj: any = await (client as any).waitForTransactionReceipt({ hash });
          if (receiptObj && receiptObj.status !== 'ACCEPTED') throw new Error(`Transaction reverted: ${receiptObj.status}`);
          updateTxStatus(hash, 'success');
          await fetchProposals();
          addToast("Proposal evaluated successfully!", 'success');
      } catch (e: any) {
          setError("Consensus execution failed: " + stripErrorPrefix(e.message));
          addToast("Evaluation failed: " + stripErrorPrefix(e.message), 'error');
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
          const receiptObj: any = await (client as any).waitForTransactionReceipt({ hash });
          if (receiptObj && receiptObj.status !== 'ACCEPTED') throw new Error(`Transaction reverted: ${receiptObj.status}`);
          updateTxStatus(hash, 'success');
          await fetchProposals();
          addToast("Loan repaid successfully!", 'success');
      } catch (e: any) {
          setError("Failed to repay loan: " + stripErrorPrefix(e.message));
          addToast("Repayment failed: " + stripErrorPrefix(e.message), 'error');
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
          const receiptObj: any = await (client as any).waitForTransactionReceipt({ hash });
          if (receiptObj && receiptObj.status !== 'ACCEPTED') throw new Error(`Transaction reverted: ${receiptObj.status}`);
          updateTxStatus(hash, 'success');
          await fetchProposals();
          addToast("Appeal submitted successfully!", 'success');
      } catch (e: any) {
          setError("Appeal failed: " + stripErrorPrefix(e.message));
          addToast("Appeal failed: " + stripErrorPrefix(e.message), 'error');
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
          const receiptObj: any = await (client as any).waitForTransactionReceipt({ hash });
          if (receiptObj && receiptObj.status !== 'ACCEPTED') throw new Error(`Transaction reverted: ${receiptObj.status}`);
          updateTxStatus(hash, 'success');
          await fetchProposals();
      } catch (e: any) {
          setError("Failed to revoke: " + stripErrorPrefix(e.message));
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
          const receiptObj: any = await (client as any).waitForTransactionReceipt({ hash });
          if (receiptObj && receiptObj.status !== 'ACCEPTED') throw new Error(`Transaction reverted: ${receiptObj.status}`);
          updateTxStatus(hash, 'success');
          await fetchProposals();
          addToast(`Successfully deposited ${Number(amount)/10**18} GEN`, 'success');
      } catch (e: any) {
          setError("Deposit failed: " + stripErrorPrefix(e.message));
          addToast("Deposit failed: " + stripErrorPrefix(e.message), 'error');
      } finally {
          setIsEvaluating(false);
      }
  };


  const submitIdentityVerification = async (ipfsHash: string) => {
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
              args: [ipfsHash]
          });
          addTx({ hash, type: 'submit_identity_verification', status: 'pending', timestamp: Date.now() });
          const receiptObj: any = await (client as any).waitForTransactionReceipt({ hash });
          if (receiptObj && receiptObj.status !== 'ACCEPTED') throw new Error(`Transaction reverted: ${receiptObj.status}`);
          updateTxStatus(hash, 'success');
          addToast("Identity verified successfully!", 'success');
      } catch (e: any) {
          setError("Verification failed: " + stripErrorPrefix(e.message));
          addToast("Verification failed: " + stripErrorPrefix(e.message), 'error');
      } finally {
          setIsEvaluating(false);
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
          const receiptObj: any = await (client as any).waitForTransactionReceipt({ hash });
          if (receiptObj && receiptObj.status !== 'ACCEPTED') throw new Error(`Transaction reverted: ${receiptObj.status}`);
          updateTxStatus(hash, 'success');
          addToast("Proposal marked as default.", 'success');
      } catch (e: any) {
          setError("Failed to mark default: " + stripErrorPrefix(e.message));
          addToast("Failed to mark default: " + stripErrorPrefix(e.message), 'error');
      } finally {
          setIsEvaluating(false);
      }
  };



  const submitEncryptedEvidence = async (proposal_id: string, encrypted_payload: string) => {
      if (!contractAddress) return;
      setError(null);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'submit_encrypted_evidence',
              args: [proposal_id, encrypted_payload]
          });
          addTx({ hash, type: 'submit_encrypted_evidence', proposal_id, status: 'pending', timestamp: Date.now() });
          const receiptObj: any = await (client as any).waitForTransactionReceipt({ hash });
          if (receiptObj && receiptObj.status !== 'ACCEPTED') throw new Error(`Transaction reverted: ${receiptObj.status}`);
          updateTxStatus(hash, 'success');
          await fetchProposals();
          addToast("Encrypted evidence submitted successfully!", 'success');
      } catch (e: any) {
          setError("Failed to submit encrypted evidence: " + stripErrorPrefix(e.message));
          addToast("Failed to submit evidence: " + stripErrorPrefix(e.message), 'error');
      }
  };

  const revealAgreement = async (proposal_id: string, plaintext: string) => {
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
              args: [proposal_id, plaintext, "salt_123"]
          });
          addTx({ hash, type: 'reveal_agreement', proposal_id, status: 'pending', timestamp: Date.now() });
          const receiptObj: any = await (client as any).waitForTransactionReceipt({ hash });
          if (receiptObj && receiptObj.status !== 'ACCEPTED') throw new Error(`Transaction reverted: ${receiptObj.status}`);
          updateTxStatus(hash, 'success');
          await fetchProposals();
          addToast("Agreement revealed successfully!", 'success');
      } catch (e: any) {
          setError("Failed to reveal agreement: " + stripErrorPrefix(e.message));
          addToast("Failed to reveal agreement: " + stripErrorPrefix(e.message), 'error');
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
          const receiptObj: any = await (client as any).waitForTransactionReceipt({ hash });
          if (receiptObj && receiptObj.status !== 'ACCEPTED') throw new Error(`Transaction reverted: ${receiptObj.status}`);
          updateTxStatus(hash, 'success');
          await fetchProposals();
          addToast("Bet placed successfully!", 'success');
      } catch (e: any) {
          setError("Failed to place bet: " + stripErrorPrefix(e.message));
          addToast("Failed to place bet: " + stripErrorPrefix(e.message), 'error');
      }
  };

  const resolveMarket = async (market_id: string, outcome_yes: boolean) => {
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
              args: [market_id, outcome_yes]
          });
          addTx({ hash, type: 'resolve_market', status: 'pending', timestamp: Date.now() });
          const receiptObj: any = await (client as any).waitForTransactionReceipt({ hash });
          if (receiptObj && receiptObj.status !== 'ACCEPTED') throw new Error(`Transaction reverted: ${receiptObj.status}`);
          updateTxStatus(hash, 'success');
          await fetchProposals();
          addToast("Market resolved successfully!", 'success');
      } catch (e: any) {
          setError("Failed to resolve market: " + stripErrorPrefix(e.message));
          addToast("Failed to resolve market: " + stripErrorPrefix(e.message), 'error');
      } finally {
          setIsEvaluating(false);
      }
  };

  const createPool = async (name: string, risk_tolerance_bps: number, min_deposit: number) => {
      if (!contractAddress) return;
      setError(null);
      try {
          const provider = window.ethereum || (window as any).okxwallet || (window as any).rabby;
          const client = getGenLayerClient(network, address, provider);
          const hash = await (client as any).writeContract({
              address: contractAddress,
              account: address ? { address } : undefined,
              functionName: 'create_pool',
              args: [name, risk_tolerance_bps, min_deposit]
          });
          addTx({ hash, type: 'create_pool', status: 'pending', timestamp: Date.now() });
          const receiptObj: any = await (client as any).waitForTransactionReceipt({ hash });
          if (receiptObj && receiptObj.status !== 'ACCEPTED') throw new Error(`Transaction reverted: ${receiptObj.status}`);
          updateTxStatus(hash, 'success');
          await fetchProposals();
          addToast("Pool created successfully!", 'success');
      } catch (e: any) {
          setError("Failed to create pool: " + stripErrorPrefix(e.message));
          addToast("Failed to create pool: " + stripErrorPrefix(e.message), 'error');
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
    createPool,
    depositLiquidity,
    submitIdentityVerification,
    markDefault,
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
    toasts,
    addToast,
    removeToast
  };
};
