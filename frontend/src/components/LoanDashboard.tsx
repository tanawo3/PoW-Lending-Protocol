import React, { useState, useEffect } from 'react';
import { Tooltip } from './Tooltip';
import { useGenLayer, ProposalState } from '../hooks/useGenLayer';
import { generateDeterministicHash } from '../utils/determinism';
import { SimulatedIPFSUploader } from './SimulatedIPFSUploader';
import { Send, RefreshCw, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LoanDashboard: React.FC<{ genLayer: ReturnType<typeof useGenLayer> }> = ({ genLayer }) => {
  const [proposalId, setProposalId] = useState('');
  const [borrower, setBorrower] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [powSubmission, setPowSubmission] = useState('');
  const [githubContributions, setGithubContributions] = useState('');
  const [daoVotes, setDaoVotes] = useState('');
  // Use deterministic hashes based on user address so they remain stable across renders
  const [documentHash, setDocumentHash] = useState('doc_' + generateDeterministicHash(account + 'doc'));
  const [selfieHash, setSelfieHash] = useState('selfie_' + generateDeterministicHash(account + 'selfie'));
  const [proofOfAddressHash, setProofOfAddressHash] = useState('poa_' + generateDeterministicHash(account + 'poa'));
  const [walletAgeDays, setWalletAgeDays] = useState('365');
  const [totalTx, setTotalTx] = useState('50');
  const [avgBalance, setAvgBalance] = useState('1500');
  const [treasuryBalance, setTreasuryBalance] = useState('0');
  const [targetPoolId, setTargetPoolId] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('0');
  const [disputeEvidence, setDisputeEvidence] = useState<{ [id: string]: string }>({});
  const [vouchRationale, setVouchRationale] = useState<{ [id: string]: string }>({});
  const [adminOutput, setAdminOutput] = useState<string>('');
  const [adminInput, setAdminInput] = useState<string>('');
  const [evidenceId, setEvidenceId] = useState<{ [id: string]: string }>({});
  const [zkHash, setZkHash] = useState<{ [id: string]: string }>({});
  
  const [borrowerProfile, setBorrowerProfile] = useState<any>(null);

  useEffect(() => {
    if (genLayer.address) {
      genLayer.getBorrowerProfile(genLayer.address).then(setBorrowerProfile);
    }
  }, [genLayer.address, genLayer.contractAddress, genLayer.proposals, genLayer.stateVersion]);
  
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalId || !requestedAmount || !powSubmission) return;

    const payloadObj = { evidence: powSubmission, github_contributions: githubContributions, dao_votes: daoVotes };
    const payloadStr = JSON.stringify(payloadObj);
    
    await genLayer.submitProposal(
      proposalId, 
      parseInt(requestedAmount, 10), 
      payloadStr, 
      parseInt(walletAgeDays, 10), 
      parseInt(totalTx, 10), 
      parseInt(avgBalance, 10), 
      BigInt(collateralAmount),
      targetPoolId
    );
    setProposalId(''); setRequestedAmount(''); setPowSubmission(''); setGithubContributions(''); setDaoVotes(''); setCollateralAmount('0'); setTargetPoolId('');
  };

  const handleEvaluate = async (id: string) => {
    await genLayer.evaluateProposal(id);
  };

  const totalProposals = genLayer.proposals.length;
  const approvedCount = genLayer.proposals.filter(p => p.status === 'APPROVED').length;
  const pendingCount = genLayer.proposals.filter(p => p.status === 'PENDING').length;

  const revealUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  const staggerContainer = {
    visible: { transition: { staggerChildren: 0.2 } }
  };

  return (
    <div className="w-full flex flex-col gap-16 font-sans pb-24">
      
      {/* Borrower Profile View */}
      {borrowerProfile && (
        <motion.div variants={revealUp} initial="hidden" animate="visible" className="brutalist-border bg-[var(--text-main)] text-[var(--bg-primary)] p-8 md:p-12 relative overflow-hidden group">
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none"></div>
          <h3 className="font-display font-bold text-3xl md:text-4xl mb-2 uppercase border-b border-[var(--bg-primary)]/20 pb-4">Entity Persistent Profile</h3>
          <p className="font-mono text-[10px] text-[var(--bg-primary)]/60 mt-1 mb-6 leading-relaxed italic">Your on-chain identity. Complete KYC verification below to unlock enhanced credit scoring and lower interest rates.</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--bg-primary)]/60">Repayment Score</span>
              <div className="font-display font-bold text-4xl">{borrowerProfile.repayment_score}/100</div>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--bg-primary)]/60">Completed Loans</span>
              <div className="font-display font-bold text-4xl">{borrowerProfile.completed_loans}</div>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--bg-primary)]/60">Late Payments</span>
              <div className="font-display font-bold text-4xl">{borrowerProfile.late_payments}</div>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--bg-primary)]/60">Defaults</span>
              <div className="font-display font-bold text-4xl">{borrowerProfile.defaults}</div>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--bg-primary)]/60">Fraud Risk</span>
              <div className={`font-display font-bold text-4xl ${borrowerProfile.fraud_risk_score === 'CRITICAL' ? 'text-red-500' : ''}`}>{borrowerProfile.fraud_risk_score}</div>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--bg-primary)]/60">Gov Score</span>
              <div className="font-display font-bold text-4xl">{borrowerProfile.governance_score}</div>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--bg-primary)]/60">KYC Status</span>
              <div className="font-display font-bold text-2xl mt-2">{borrowerProfile.kyc_status}</div>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--bg-primary)]/60">Identity Score</span>
              <div className="font-display font-bold text-4xl text-green-400 mt-2">{borrowerProfile.identity_score}</div>
            </div>
          </div>
          
          {borrowerProfile.kyc_status !== 'NONE' && borrowerProfile.kyc_reasoning && (
             <div className="mt-4 pt-4 border-t border-[var(--bg-primary)]/20">
               <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--bg-primary)]/60 block mb-2">AI Verification Notes</span>
               <p className="text-sm italic">{borrowerProfile.kyc_reasoning}</p>
             </div>
          )}
          
          {borrowerProfile.kyc_status === 'NONE' && (
            <div className="mt-8 pt-8 border-t border-[var(--bg-primary)]/20 flex flex-col gap-4">
              <p className="font-mono text-[10px] text-[var(--bg-primary)]/60 mt-1 mb-3 leading-relaxed italic">Click 'Verify Identity' to submit your document hashes to the AI KYC Oracle. The validators will reach consensus on your identity verification. Once verified, your KYC Status and Identity Score will update automatically.</p>
              <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--bg-primary)]/60 block mb-2">Simulated Doc Hash</span>
                <input type="text" readOnly value={documentHash} className="w-full bg-transparent border-b border-[var(--bg-primary)]/30 py-2 text-sm text-[var(--bg-primary)] focus:outline-none" />
              </div>
              <div className="flex-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--bg-primary)]/60 block mb-2">Simulated Selfie Hash</span>
                <input type="text" readOnly value={selfieHash} className="w-full bg-transparent border-b border-[var(--bg-primary)]/30 py-2 text-sm text-[var(--bg-primary)] focus:outline-none" />
              </div>
              <div className="flex-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--bg-primary)]/60 block mb-2">Simulated PoA Hash</span>
                <input type="text" readOnly value={proofOfAddressHash} className="w-full bg-transparent border-b border-[var(--bg-primary)]/30 py-2 text-sm text-[var(--bg-primary)] focus:outline-none" />
              </div>
              <button 
                onClick={() => genLayer.submitIdentityVerification(documentHash, selfieHash, proofOfAddressHash)}
                disabled={genLayer.isEvaluating}
                className="px-6 py-2 border border-[var(--bg-primary)] text-[var(--bg-primary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-main)] font-mono text-xs tracking-widest uppercase transition-colors"
              >
                {genLayer.isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Verify Identity (AI)"}
              </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Top Metrics Grid - Gapless Bento style */}
      <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 lg:grid-cols-4 border border-[var(--text-main)] bg-[var(--text-main)] gap-[1px]">
        <motion.div variants={revealUp} className="p-12 md:p-16 flex flex-col justify-between min-h-[300px] relative overflow-hidden group bg-[var(--card-dark)]">
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none"></div>
          <h4 className="font-mono text-sm uppercase tracking-[0.2em] text-[var(--bg-primary)]/50 mb-8 border-b border-[var(--bg-primary)]/20 pb-4">Total Entries</h4>
          <span className="font-display font-bold text-8xl lg:text-[10rem] leading-none text-[var(--bg-primary)] tracking-tighter">{totalProposals}</span>
        </motion.div>

        <motion.div variants={revealUp} className="p-12 md:p-16 flex flex-col justify-between min-h-[300px] bg-[var(--bg-primary)] group">
          <h4 className="font-mono text-sm uppercase tracking-[0.2em] text-[var(--text-muted)] mb-8 border-b border-[var(--border-light)] pb-4">Consensus Reached</h4>
          <span className="font-display font-bold text-8xl lg:text-[10rem] leading-none text-[var(--text-main)] tracking-tighter">{approvedCount}</span>
        </motion.div>

        <motion.div variants={revealUp} className="p-12 md:p-16 flex flex-col justify-between min-h-[300px] bg-[var(--bg-primary)] group">
          <h4 className="font-mono text-sm uppercase tracking-[0.2em] text-[var(--text-muted)] mb-8 border-b border-[var(--border-light)] pb-4">Awaiting Verification</h4>
          <span className="font-display font-bold text-8xl lg:text-[10rem] leading-none text-[var(--text-main)] tracking-tighter">{pendingCount}</span>
        </motion.div>

        <motion.div variants={revealUp} className="p-12 md:p-16 flex flex-col justify-between min-h-[300px] bg-[var(--bg-primary)] group">
          <h4 className="font-mono text-sm uppercase tracking-[0.2em] text-[var(--text-muted)] mb-8 border-b border-[var(--border-light)] pb-4">Protocol Treasury</h4>
          <span className="font-display font-bold text-8xl lg:text-[10rem] leading-none text-[var(--text-main)] tracking-tighter">1% Fee</span>
          <button onClick={() => genLayer.withdrawProtocolFees(BigInt(100))} className="mt-4 w-full py-2 border border-[var(--text-main)] text-[10px] uppercase font-mono hover:bg-[var(--text-main)] hover:text-white">Withdraw Fees (Admin)</button>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Side: Actions (Span 5) */}
        <motion.div variants={revealUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="lg:col-span-5 flex flex-col gap-8 sticky top-32">
          
          <div className="brutalist-border bg-[var(--bg-secondary)] relative group">
            
            {/* Architectural Accent */}
            <div className="absolute top-0 right-0 w-8 h-8 border-b border-l border-[var(--text-main)] bg-[var(--bg-primary)]"></div>

            <div className="p-8 md:p-10">
              <div className="mb-10 border-b border-[var(--text-main)] pb-4 flex justify-between items-end">
                <h3 className="font-display font-bold text-3xl uppercase tracking-tighter text-[var(--text-main)] leading-none">Inject Payload</h3>
                <span className="font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase mb-1">001</span>
              </div>
              <Tooltip content="Submit a loan request to the GenLayer network. Fill in your wallet metrics and paste a GitHub repository URL as evidence. The AI will evaluate your proof-of-work and creditworthiness." />

              <form onSubmit={handleSubmitProposal} className="flex flex-col gap-8">
                <div className="flex flex-col gap-2 relative">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Request ID <Tooltip content="Unique identifier for your loan (e.g. LOAN-001)" /></label>
                  <input type="text" value={proposalId} onChange={e => setProposalId(e.target.value)} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-xl font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-[var(--text-main)] focus:outline-none transition-all rounded-none" placeholder="REQ-001" required />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">USDC Allocation <Tooltip content="Amount in USD you wish to borrow" /></label>
                  <input type="number" value={requestedAmount} onChange={e => setRequestedAmount(e.target.value)} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-xl font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-[var(--text-main)] focus:outline-none transition-all rounded-none" placeholder="1000" required />
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">GitHub PRs <Tooltip content="Number of merged pull requests on GitHub" /></label>
                    <input type="number" value={githubContributions} onChange={e => setGithubContributions(e.target.value)} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-xl font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-[var(--text-main)] focus:outline-none transition-all rounded-none" placeholder="0" />
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">DAO Votes <Tooltip content="Number of governance votes you've participated in" /></label>
                    <input type="number" value={daoVotes} onChange={e => setDaoVotes(e.target.value)} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-xl font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-[var(--text-main)] focus:outline-none transition-all rounded-none" placeholder="0" />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Wallet Age (Days) <Tooltip content="How long your wallet has been active (days)" /></label>
                    <input type="number" value={walletAgeDays} onChange={e => setWalletAgeDays(e.target.value)} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-xl font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-[var(--text-main)] focus:outline-none transition-all rounded-none" placeholder="365" />
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Total Tx <Tooltip content="Total on-chain transactions from your wallet" /></label>
                    <input type="number" value={totalTx} onChange={e => setTotalTx(e.target.value)} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-xl font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-[var(--text-main)] focus:outline-none transition-all rounded-none" placeholder="50" />
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Avg Bal ($) <Tooltip content="Average balance held in your wallet (USD)" /></label>
                    <input type="number" value={avgBalance} onChange={e => setAvgBalance(e.target.value)} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-xl font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-[var(--text-main)] focus:outline-none transition-all rounded-none" placeholder="1500" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Collateral Amount (GEN Wei) <Tooltip content="GEN tokens to lock as collateral (in Wei). Optional for undercollateralized loans." /></label>
                  <input type="number" value={collateralAmount} onChange={e => setCollateralAmount(e.target.value)} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-xl font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-[var(--text-main)] focus:outline-none transition-all rounded-none" placeholder="Enter collateral amount..." />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Target LP Pool (Optional)</label>
                  <select value={targetPoolId} onChange={e => setTargetPoolId(e.target.value)} className="w-full bg-[var(--bg-primary)] border border-[var(--border-light)] py-3 px-4 text-sm font-mono uppercase text-[var(--text-main)] focus:border-[var(--text-main)] focus:outline-none rounded-none cursor-pointer">
                    <option value="">Global Liquidity (Any)</option>
                    {genLayer.pools.map(p => (
                        <option key={p.pool_id} value={p.pool_id}>{p.name} ({p.criteria ? 'TARGETED' : p.risk_tier})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Evidence Payload <Tooltip content="Paste a GitHub repository URL (e.g. https://github.com/user/repo). The AI will fetch and evaluate your code quality." /></label>
                  <textarea value={powSubmission} onChange={e => setPowSubmission(e.target.value)} className="w-full bg-[var(--bg-primary)] border border-[var(--border-light)] p-5 text-sm font-medium text-[var(--text-main)] placeholder-[var(--text-muted)] focus:border-[var(--text-main)] focus:outline-none transition-all resize-none h-32 rounded-none mt-2" placeholder="Describe the proof of work or paste a repo URL..." required />
                  <SimulatedIPFSUploader onUploadComplete={(cid) => setPowSubmission(cid)} />
                </div>
                
                <button type="submit" className="btn-monolog group w-full mt-6 flex items-center justify-between overflow-hidden relative">
                  <span className="text-sm tracking-widest uppercase font-mono relative z-10">Commit Securely</span>
                  <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-2" />
                </button>
              </form>
            </div>
          </div>

          <button 
            onClick={genLayer.fetchProposals} 
            disabled={genLayer.isFetching} 
            className="w-full flex items-center justify-center gap-3 px-4 py-6 border border-[var(--text-main)] bg-[var(--bg-primary)] text-[var(--text-main)] hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)] font-mono text-xs uppercase tracking-widest transition-colors group"
          >
            <RefreshCw className={`w-4 h-4 transition-transform group-hover:rotate-180 duration-700 ${genLayer.isFetching ? 'animate-spin' : ''}`} />
            <span>Sync Network State</span>
          </button>
          <p className="font-mono text-[10px] text-[var(--text-muted)] mt-1 mb-3 leading-relaxed italic text-center">Manually refresh all on-chain data including proposals, pools, and risk index.</p>
        </motion.div>

        {/* Right Side: Ledger View (Span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          <div className="flex flex-col gap-8">
            {genLayer.proposals.length === 0 ? (
              <motion.div variants={revealUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="w-full brutalist-border p-24 text-center border-dashed">
                <p className="font-mono text-xs tracking-widest uppercase text-[var(--text-muted)]">No loan proposals found. Submit a payload using the form on the left to get started.</p>
              </motion.div>
            ) : (
              <AnimatePresence>
                {genLayer.proposals.map((prop, idx) => (
                  <motion.div 
                    key={prop.proposal_id} 
                    variants={revealUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: idx * 0.1, duration: 0.8 }}
                    className="brutalist-border bg-[var(--bg-secondary)] relative"
                  >
                    
                    {/* Architectural corner cut */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-r border-b border-[var(--text-main)] bg-[var(--bg-primary)]"></div>

                    <div className="p-8 sm:p-12">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12 pb-8 border-b border-[var(--text-main)]">
                        <div>
                          <h4 className="font-display font-bold text-5xl md:text-6xl tracking-tighter text-[var(--text-main)] mb-4 uppercase">{prop.proposal_id}</h4>
                          <span className="font-mono text-[var(--text-muted)] text-[10px] uppercase tracking-widest break-all bg-[var(--bg-primary)] px-2 py-1 border border-[var(--border-light)]">Entity: {prop.borrower}</span>
                        </div>
                        
                        <div className="flex flex-col items-end gap-4 shrink-0">
                          <div className={`px-4 py-2 font-mono text-[10px] tracking-widest uppercase flex items-center gap-2 border
                            ${prop.status === 'PENDING' ? 'border-[var(--text-main)] text-[var(--text-main)] bg-[var(--bg-primary)]' : 
                              prop.status === 'APPROVED' ? 'bg-[var(--card-dark)] text-[var(--bg-secondary)] border-[var(--card-dark)]' : 
                              prop.status === 'DEFAULTED' ? 'bg-red-900/30 text-red-500 border-red-500' :
                              'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-light)]'}`}>
                            {prop.status === 'PENDING' && <RefreshCw className="w-3 h-3 animate-spin" />}
                            {prop.status === 'COMMITTED' && <RefreshCw className="w-3 h-3" />}
                            {prop.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                            {prop.status === 'DEFAULTED' && <XCircle className="w-3 h-3 text-red-500" />}
                            {prop.status === 'CONDITIONAL_OFFER' && <RefreshCw className="w-3 h-3" />}
                            {prop.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                            {prop.status.replace('_', ' ')}
                          </div>
                          <div className="font-display font-extrabold text-3xl text-[var(--text-main)] mt-2 border-b-4 border-[var(--text-main)] pb-1">
                            ${prop.requested_amount}
                          </div>
                          {prop.vouch_score > 0 && (
                          <div className="mt-4 border-t border-[var(--border-light)] pt-4">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)] block mb-2">Social Vouching (Total XP: {prop.vouch_score})</span>
                            {Object.entries(JSON.parse(prop.vouchers_json || '{}')).map(([voucher, data]: [string, any]) => (
                              <div key={voucher} className="text-xs font-mono text-[var(--text-main)] mb-1">
                                <span className="text-[var(--text-muted)]">[{data.timestamp}]</span> {voucher.substring(0,8)}... : <span className="text-green-500">+{data.quality} XP</span> - "{data.rationale}"
                              </div>
                            ))}
                          </div>
                        )}
                          {prop.status === 'APPROVED' && prop.debt && (
                            <div className="font-mono text-[10px] uppercase text-[var(--text-main)] mt-1">
                              Repay: ${prop.debt} ({(prop.risk_score / 100).toFixed(2)}% Premium)
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-10">
                        <span className="font-mono text-[var(--text-muted)] text-[10px] uppercase tracking-widest block mb-4 border-b border-[var(--border-light)] pb-2 w-max">Payload Evidence</span>
                        <div className="bg-[var(--bg-primary)] border border-[var(--border-light)] p-6 text-[var(--text-main)] font-medium text-sm md:text-base leading-relaxed">
                          {prop.pow_submission}
                        </div>
                      </div>

                      <div className="pt-8 border-t border-[var(--text-main)]">
                        {prop.status === 'PENDING' ? (
                          <div className="flex flex-col gap-6">
                            <Tooltip content="Click to trigger the AI evaluation. The validator network will assess your proof-of-work and determine your credit score." />
                            <div className="flex gap-4">
                              <button 
                                onClick={() => handleEvaluate(prop.proposal_id)}
                                disabled={genLayer.isEvaluating}
                                className="flex-1 px-10 py-5 bg-[var(--text-main)] text-[var(--bg-secondary)] hover:bg-[var(--card-dark)] flex items-center justify-center gap-4 text-xs font-mono uppercase tracking-widest transition-all disabled:opacity-50 hover:-translate-y-1"
                              >
                                {genLayer.isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {genLayer.isEvaluating ? "Processing..." : "Initiate Consensus"}
                              </button>
                              <button 
                                onClick={() => genLayer.revokeProposal(prop.proposal_id)}
                                disabled={genLayer.isEvaluating}
                                className="px-6 py-5 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center gap-4 text-xs font-mono uppercase tracking-widest transition-all disabled:opacity-50 hover:-translate-y-1"
                              >
                                {genLayer.isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Revoke
                              </button>
                            </div>
                            
                            <div className="mt-4 border border-[var(--border-light)] p-6 bg-[var(--bg-primary)] flex flex-col gap-4">
                              <Tooltip content="Vouch for this borrower by explaining why their payload is legitimate. The AI will score your rationale and boost the borrower's reputation." />
                              <div className="flex flex-col sm:flex-row gap-4 items-end">
                              <div className="flex-grow w-full">
                                <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Social Vouching Rationale</label>
                                <input type="text" value={vouchRationale[prop.proposal_id] || ''} onChange={e => setVouchRationale({...vouchRationale, [prop.proposal_id]: e.target.value})} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-sm font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-[var(--text-main)] focus:outline-none transition-all rounded-none" placeholder="Explain why this payload is valid..." />
                              </div>
                              <button 
                                onClick={() => genLayer.aiVouch(prop.proposal_id, vouchRationale[prop.proposal_id] || '')}
                                disabled={genLayer.isEvaluating || !vouchRationale[prop.proposal_id]}
                                className="w-full sm:w-auto px-6 py-2 border border-[var(--text-main)] hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)] flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest transition-all disabled:opacity-50"
                              >
                                {genLayer.isEvaluating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                Vouch
                              </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 flex flex-col gap-6">
                            <div>
                              <span className="font-mono text-[var(--text-main)] font-bold text-[10px] uppercase tracking-widest block mb-4 border-b border-[var(--text-main)] pb-2 w-max">
                                Consensus Output
                              </span>
                              <div className="text-[var(--text-muted)] font-medium text-sm leading-relaxed border-l-2 border-[var(--text-main)] pl-4">
                                {prop.validator_notes || prop.ai_reasoning || "No verifiable notes recorded."}
                              </div>
                            </div>
                            
                            {prop.appeal_history_json && JSON.parse(prop.appeal_history_json).length > 0 && (
                              <div className="mt-4 border-t border-[var(--border-light)] pt-4">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-red-500 block mb-2">Appeal History Timeline</span>
                                {JSON.parse(prop.appeal_history_json).map((appeal: any, idx: number) => (
                                  <div key={idx} className="text-xs font-mono mb-2 p-3 bg-black/20 border border-[var(--border-light)] rounded-none">
                                    <div className="text-red-400">[{appeal.timestamp}] Evidence: {appeal.dispute_evidence}</div>
                                    <div className="mt-1 font-bold">Verdict: {appeal.verdict}</div>
                                    <div className="mt-1 text-[var(--text-muted)] italic">"{appeal.summary}"</div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {prop.status === 'REJECTED' && (
                              <div className="mt-4 border border-red-900/30 p-6 bg-[var(--bg-primary)] flex flex-col gap-4">
                                <Tooltip content="Your loan was rejected. Submit additional evidence to appeal. The AI Supreme Court will re-evaluate your case with fresh reasoning." />
                                <div>
                                  <label className="font-mono text-[10px] uppercase tracking-widest text-red-500 flex items-center gap-2"><XCircle className="w-3 h-3"/> AI Supreme Court (Appeal)</label>
                                  <input type="text" value={disputeEvidence[prop.proposal_id] || ''} onChange={e => setDisputeEvidence({...disputeEvidence, [prop.proposal_id]: e.target.value})} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-sm font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-red-500 focus:outline-none transition-all rounded-none mt-2" placeholder="Provide appeal justification..." />
                                </div>
                                <button 
                                  onClick={() => genLayer.appealLoanDecision(prop.proposal_id, disputeEvidence[prop.proposal_id] || '')}
                                  disabled={genLayer.isEvaluating || !disputeEvidence[prop.proposal_id]}
                                  className="w-full sm:w-auto self-start px-6 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                  {genLayer.isEvaluating ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Initiate Appeal"}
                                </button>
                              </div>
                            )}

                            {prop.status === 'CONDITIONAL_OFFER' && (
                              <button 
                                onClick={() => genLayer.acceptConditionalOffer(prop.proposal_id)}
                                disabled={genLayer.isEvaluating}
                                className="w-full sm:w-auto self-start mt-4 px-6 py-3 bg-[var(--text-main)] text-[var(--bg-secondary)] hover:bg-[var(--card-dark)] flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest transition-all disabled:opacity-50"
                              >
                                {genLayer.isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Accept AI Counter-Offer"}
                              </button>
                            )}
                            
                            {prop.status === 'APPROVED' && (
                              <div className="flex flex-col gap-4 mt-4">
                                <Tooltip content="Repay the full loan amount plus interest to close this position and improve your repayment score." />
                                <div className="flex flex-col sm:flex-row gap-4">
                                <button 
                                  onClick={() => genLayer.repayLoan(prop.proposal_id, BigInt(prop.debt || 0))}
                                  disabled={genLayer.isEvaluating}
                                  className="w-full sm:w-auto self-start px-6 py-3 bg-[var(--bg-primary)] border border-[var(--text-main)] text-[var(--text-main)] hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)] flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                  {genLayer.isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Repay Loan & Interest"}
                                </button>
                                
                                <button 
                                  onClick={() => genLayer.markDefault(prop.proposal_id)}
                                  disabled={genLayer.isEvaluating}
                                  className="w-full sm:w-auto self-start px-6 py-3 bg-red-900/20 border border-red-500 text-red-500 hover:bg-red-900 hover:text-white flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                  {genLayer.isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Mark as Default (Admin)"}
                                </button>
                                </div>
                              </div>
                            )}
                            
                            <div className="mt-6 pt-6 border-t border-[var(--border-light)] flex flex-col gap-4">
                              <span className="font-mono text-[var(--text-main)] font-bold text-[10px] uppercase tracking-widest block border-b border-[var(--text-main)] pb-2 w-max">
                                Encrypted Evidence (ZKP)
                               <Tooltip content="Submit zero-knowledge proof evidence for private verification. Use 'Reveal Agreement' to disclose evidence to the counterparty." /></span>
                              <div className="flex flex-col sm:flex-row gap-4">
                                <input type="text" value={evidenceId[prop.proposal_id] || ''} onChange={e => setEvidenceId({...evidenceId, [prop.proposal_id]: e.target.value})} className="flex-1 bg-transparent border-b border-[var(--border-light)] py-2 text-sm text-[var(--text-main)] focus:outline-none" placeholder="Evidence ID..." />
                                <input type="text" value={zkHash[prop.proposal_id] || ''} onChange={e => setZkHash({...zkHash, [prop.proposal_id]: e.target.value})} className="flex-1 bg-transparent border-b border-[var(--border-light)] py-2 text-sm text-[var(--text-main)] focus:outline-none" placeholder="ZK Proof Hash..." />
                              </div>
                              <div className="flex gap-4">
                                <button 
                                  onClick={() => genLayer.submitEncryptedEvidence(prop.proposal_id, evidenceId[prop.proposal_id] || '', zkHash[prop.proposal_id] || '')}
                                  disabled={genLayer.isEvaluating || !evidenceId[prop.proposal_id] || !zkHash[prop.proposal_id]}
                                  className="flex-1 px-4 py-2 border border-[var(--text-main)] hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)] text-[10px] font-mono uppercase transition-colors disabled:opacity-50"
                                >
                                  Submit Encrypted
                                </button>
                                <button 
                                  onClick={() => genLayer.revealAgreement(prop.proposal_id, evidenceId[prop.proposal_id] || '')}
                                  disabled={genLayer.isEvaluating || !evidenceId[prop.proposal_id]}
                                  className="flex-1 px-4 py-2 border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white text-[10px] font-mono uppercase transition-colors disabled:opacity-50"
                                >
                                  Reveal Agreement
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* ADMIN OPERATIONS PANEL */}
          <div className="mt-12 brutalist-border bg-[var(--bg-secondary)] p-8">
            <h3 className="font-display font-bold text-2xl uppercase tracking-tighter text-[var(--text-main)] mb-2 pb-4 border-b border-[var(--text-main)] flex items-center gap-2">
              System Admin Tools
            </h3>
            <p className="font-mono text-[10px] text-[var(--text-muted)] mt-1 mb-6 leading-relaxed italic">Administrative tools for protocol operators. Read-only diagnostics and write operations for managing defaults and compliance.</p>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <button onClick={async () => setAdminOutput(await genLayer.healthCheck())} className="px-4 py-2 border border-[var(--text-main)] text-[10px] font-mono uppercase hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)]">Health Check</button>
              <button onClick={async () => setAdminOutput(await genLayer.getContractVersion())} className="px-4 py-2 border border-[var(--text-main)] text-[10px] font-mono uppercase hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)]">Version</button>
              <button onClick={async () => setAdminOutput(await genLayer.getDeveloperMetadata())} className="px-4 py-2 border border-[var(--text-main)] text-[10px] font-mono uppercase hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)]">Dev Metadata</button>
              <button onClick={async () => setAdminOutput(await genLayer.exportSnapshot(0, 100))} className="px-4 py-2 border border-[var(--text-main)] text-[10px] font-mono uppercase hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)]">State Snapshot</button>
            </div>

            <div className="flex flex-col gap-4 mb-8 border-t border-dashed border-[var(--text-main)] pt-6">
              <div className="flex-grow">
                <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Param Input (Node ID or Proposal ID)</label>
                <input type="text" value={adminInput} onChange={e => setAdminInput(e.target.value)} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-sm font-medium text-[var(--text-main)] focus:border-[var(--text-main)] focus:outline-none rounded-none" placeholder="Enter ID..." />
              </div>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex flex-col">
                  <Tooltip content="Enter an APPROVED proposal ID to calculate the mathematical default probability based on risk scores. This is a read-only operation — no transaction is sent." />
                  <button onClick={async () => setAdminOutput(String(await genLayer.simulateDefault(adminInput)))} className="px-4 py-2 border border-[var(--text-main)] text-[10px] font-mono uppercase hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)]">Simulate Default</button>
                </div>
                <div className="flex flex-col">
                  <Tooltip content="⚠️ WRITE OPERATION: Permanently marks an approved loan as defaulted. This penalizes the borrower's reputation score. Admin only." />
                  <button onClick={async () => {
                    try {
                      await genLayer.markDefault(adminInput);
                      setAdminOutput("Default marked successfully. Check Recent Transactions or Profile.");
                    } catch (e: any) {
                      setAdminOutput("Error: " + e.message);
                    }
                  }} className="px-4 py-2 border border-[#ff3333] text-[#ff3333] text-[10px] font-mono uppercase hover:bg-[#ff3333] hover:text-black">Mark Default</button>
                </div>
                <div className="flex flex-col">
                  <Tooltip content="Check if a node meets the protocol's minimum compliance requirements. Read-only." />
                  <button onClick={async () => setAdminOutput(String(await genLayer.verifyNodeCompliance(adminInput)))} className="px-4 py-2 border border-[var(--text-main)] text-[10px] font-mono uppercase hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)]">Verify Node</button>
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-primary)] p-4 border border-[var(--border-light)] min-h-[100px] overflow-auto">
              <span className="font-mono text-[10px] text-[var(--text-muted)] block mb-2 uppercase">Console Output:</span>
              <pre className="font-mono text-xs text-[var(--text-main)] whitespace-pre-wrap">{adminOutput || "Awaiting command..."}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
