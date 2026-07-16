import React, { useState } from 'react';
import { useGenLayer } from '../hooks/useGenLayer';
import { Send, RefreshCw, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LoanDashboard: React.FC<{ genLayer: ReturnType<typeof useGenLayer> }> = ({ genLayer }) => {
  const [proposalId, setProposalId] = useState('');
  const [borrower, setBorrower] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [powSubmission, setPowSubmission] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('0');
  const [disputeEvidence, setDisputeEvidence] = useState<{ [id: string]: string }>({});
  const [vouchRationale, setVouchRationale] = useState<{ [id: string]: string }>({});
  const [adminOutput, setAdminOutput] = useState<string>('');
  const [adminInput, setAdminInput] = useState<string>('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalId || !borrower || !requestedAmount || !powSubmission) return;
    await genLayer.submitProposal(proposalId, borrower, parseInt(requestedAmount, 10), powSubmission, BigInt(collateralAmount));
    setProposalId(''); setBorrower(''); setRequestedAmount(''); setPowSubmission(''); setCollateralAmount('0');
  };

  const handleEvaluate = async (id: string) => {
    await genLayer.evaluateProposal(id);
  };

  const totalProposals = genLayer.proposals.length;
  const approvedCount = genLayer.proposals.filter(p => p.state === 'APPROVED').length;
  const pendingCount = genLayer.proposals.filter(p => p.state === 'PENDING_VERIFICATION').length;

  const revealUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  const staggerContainer = {
    visible: { transition: { staggerChildren: 0.2 } }
  };

  return (
    <div className="w-full flex flex-col gap-16 font-sans pb-24">
      
      {/* Top Metrics Grid - Gapless Bento style */}
      <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 lg:grid-cols-3 border border-[var(--text-main)] bg-[var(--text-main)] gap-[1px]">
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

              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                <div className="flex flex-col gap-2 relative">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Request ID</label>
                  <input type="text" value={proposalId} onChange={e => setProposalId(e.target.value)} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-xl font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-[var(--text-main)] focus:outline-none transition-all rounded-none" placeholder="REQ-001" required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Entity Address</label>
                  <input type="text" value={borrower} onChange={e => setBorrower(e.target.value)} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-xl font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-[var(--text-main)] focus:outline-none transition-all rounded-none" placeholder="0x..." required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">USDC Allocation</label>
                  <input type="number" value={requestedAmount} onChange={e => setRequestedAmount(e.target.value)} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-xl font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-[var(--text-main)] focus:outline-none transition-all rounded-none" placeholder="1000" required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Evidence Payload</label>
                  <textarea value={powSubmission} onChange={e => setPowSubmission(e.target.value)} className="w-full bg-[var(--bg-primary)] border border-[var(--border-light)] p-5 text-sm font-medium text-[var(--text-main)] placeholder-[var(--text-muted)] focus:border-[var(--text-main)] focus:outline-none transition-all resize-none h-32 rounded-none mt-2" placeholder="Describe the proof of work..." required />
                </div>
                
                <button type="submit" className="btn-monolog group w-full mt-6 flex items-center justify-between overflow-hidden relative">
                  <span className="text-sm tracking-widest uppercase font-mono relative z-10">Transmit</span>
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
        </motion.div>

        {/* Right Side: Ledger View (Span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          <div className="flex flex-col gap-8">
            {genLayer.proposals.length === 0 ? (
              <motion.div variants={revealUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="w-full brutalist-border p-24 text-center border-dashed">
                <p className="font-mono text-xs tracking-widest uppercase text-[var(--text-muted)]">Ledger empty. Awaiting signals.</p>
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
                            ${prop.state === 'PENDING_VERIFICATION' ? 'border-[var(--text-main)] text-[var(--text-main)] bg-[var(--bg-primary)]' : 
                              prop.state === 'APPROVED' ? 'bg-[var(--card-dark)] text-[var(--bg-secondary)] border-[var(--card-dark)]' : 
                              'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-light)]'}`}>
                            {prop.state === 'PENDING_VERIFICATION' && <RefreshCw className="w-3 h-3 animate-spin" />}
                            {prop.state === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                            {prop.state === 'REJECTED' && <XCircle className="w-3 h-3" />}
                            {prop.state.replace('_', ' ')}
                          </div>
                          <div className="font-display font-extrabold text-3xl text-[var(--text-main)] mt-2 border-b-4 border-[var(--text-main)] pb-1">
                            ${prop.requested_amount}
                          </div>
                          {prop.vouch_score > 0 && (
                            <div className="font-mono text-[10px] uppercase text-[var(--text-main)] mt-1 px-2 py-1 border border-[var(--text-main)]">
                              Vouch XP: {prop.vouch_score}
                            </div>
                          )}
                          {prop.state === 'APPROVED' && prop.debt && (
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
                        {prop.state === 'PENDING_VERIFICATION' ? (
                          <div className="flex flex-col gap-6">
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
                            
                            <div className="mt-4 border border-[var(--border-light)] p-6 bg-[var(--bg-primary)] flex flex-col sm:flex-row gap-4 items-end">
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
                        ) : (
                          <div className="mt-4 flex flex-col gap-6">
                            <div>
                              <span className="font-mono text-[var(--text-main)] font-bold text-[10px] uppercase tracking-widest block mb-4 border-b border-[var(--text-main)] pb-2 w-max">
                                Consensus Output
                              </span>
                              <div className="text-[var(--text-muted)] font-medium text-sm leading-relaxed border-l-2 border-[var(--text-main)] pl-4">
                                {prop.validator_notes || "No verifiable notes recorded."}
                              </div>
                            </div>
                            
                            {prop.state === 'REJECTED' && (
                              <div className="mt-4 border border-red-900/30 p-6 bg-[var(--bg-primary)] flex flex-col gap-4">
                                <div>
                                  <label className="font-mono text-[10px] uppercase tracking-widest text-red-500 flex items-center gap-2"><XCircle className="w-3 h-3"/> AI Arbitration Tribunal (Dispute)</label>
                                  <input type="text" value={disputeEvidence[prop.proposal_id] || ''} onChange={e => setDisputeEvidence({...disputeEvidence, [prop.proposal_id]: e.target.value})} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-sm font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-red-500 focus:outline-none transition-all rounded-none mt-2" placeholder="Paste extra evidence link (GitHub issue, Tweet)..." />
                                </div>
                                <button 
                                  onClick={() => genLayer.arbitrateDispute(prop.proposal_id, disputeEvidence[prop.proposal_id] || '')}
                                  disabled={genLayer.isEvaluating || !disputeEvidence[prop.proposal_id]}
                                  className="w-full sm:w-auto self-start px-6 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                  {genLayer.isEvaluating ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Initiate Arbitration"}
                                </button>
                              </div>
                            )}

                            {prop.state === 'APPROVED' && (
                              <button 
                                onClick={() => genLayer.repayLoan(prop.proposal_id)}
                                disabled={genLayer.isEvaluating}
                                className="w-full sm:w-auto self-start mt-4 px-6 py-3 bg-[var(--bg-primary)] border border-[var(--text-main)] text-[var(--text-main)] hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)] flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest transition-all disabled:opacity-50"
                              >
                                {genLayer.isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Repay Loan & Debt"}
                              </button>
                            )}
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
            <h3 className="font-display font-bold text-2xl uppercase tracking-tighter text-[var(--text-main)] mb-6 pb-4 border-b border-[var(--text-main)] flex items-center gap-2">
              System Admin Tools
            </h3>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <button onClick={async () => setAdminOutput(await genLayer.healthCheck())} className="px-4 py-2 border border-[var(--text-main)] text-[10px] font-mono uppercase hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)]">Health Check</button>
              <button onClick={async () => setAdminOutput(await genLayer.getContractVersion())} className="px-4 py-2 border border-[var(--text-main)] text-[10px] font-mono uppercase hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)]">Version</button>
              <button onClick={async () => setAdminOutput(await genLayer.getDeveloperMetadata())} className="px-4 py-2 border border-[var(--text-main)] text-[10px] font-mono uppercase hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)]">Dev Metadata</button>
              <button onClick={async () => setAdminOutput(await genLayer.exportSnapshot(0, 100))} className="px-4 py-2 border border-[var(--text-main)] text-[10px] font-mono uppercase hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)]">State Snapshot</button>
            </div>

            <div className="flex flex-col gap-4 mb-8 border-t border-dashed border-[var(--text-main)] pt-6">
              <div className="flex gap-4 items-end">
                <div className="flex-grow">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Param Input (Node ID or Proposal ID)</label>
                  <input type="text" value={adminInput} onChange={e => setAdminInput(e.target.value)} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-sm font-medium text-[var(--text-main)] focus:border-[var(--text-main)] focus:outline-none rounded-none" placeholder="Enter ID..." />
                </div>
                <button onClick={async () => setAdminOutput(await genLayer.simulateDefault(adminInput))} className="px-4 py-2 border border-[var(--text-main)] text-[10px] font-mono uppercase hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)]">Simulate Default</button>
                <button onClick={async () => setAdminOutput(String(await genLayer.verifyNodeCompliance(adminInput)))} className="px-4 py-2 border border-[var(--text-main)] text-[10px] font-mono uppercase hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)]">Verify Node</button>
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
