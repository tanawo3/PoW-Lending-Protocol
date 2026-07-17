import React, { useState } from 'react';
import { Tooltip } from './Tooltip';
import { useGenLayer } from '../hooks/useGenLayer';
import { PlusCircle, DollarSign, Activity, Lock, Unlock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PoolDashboard: React.FC<{ genLayer: ReturnType<typeof useGenLayer> }> = ({ genLayer }) => {
  const [newPoolName, setNewPoolName] = useState('');
  const [targetReturn, setTargetReturn] = useState('');
  const [minCredit, setMinCredit] = useState('');
  const [maxLoan, setMaxLoan] = useState('');
  const [riskTier, setRiskTier] = useState('MEDIUM');
  const [isTargeted, setIsTargeted] = useState(false);
  const [criteria, setCriteria] = useState('');

  const [depositAmounts, setDepositAmounts] = useState<{ [id: string]: string }>({});
  const [withdrawAmounts, setWithdrawAmounts] = useState<{ [id: string]: string }>({});

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (isTargeted) {
            if (!newPoolName || !targetReturn || !criteria) return;
            await genLayer.createTargetedPool(
                newPoolName,
                parseInt(targetReturn, 10),
                criteria
            );
        } else {
            if (!newPoolName || !targetReturn || !minCredit || !maxLoan) return;
            await genLayer.createPool(
              newPoolName,
              parseInt(targetReturn, 10),
              parseInt(minCredit, 10),
              parseInt(maxLoan, 10),
              riskTier
            );
        }
        setNewPoolName(''); setTargetReturn(''); setMinCredit(''); setMaxLoan(''); setRiskTier('MEDIUM'); setCriteria('');
    } catch (err) {
        console.error("Failed to create pool", err);
    }
  };

  const revealUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="w-full flex flex-col gap-16 font-sans pb-24 border-t border-[var(--border-light)] pt-24 mt-24">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Side: Create Pool (Span 4) */}
        <motion.div variants={revealUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="lg:col-span-4 flex flex-col gap-8 sticky top-32">
          
          <div className="brutalist-border bg-[var(--bg-secondary)] relative group">
            <div className="absolute top-0 right-0 w-8 h-8 border-b border-l border-[var(--text-main)] bg-[var(--bg-primary)]"></div>

            <div className="p-8 md:p-10">
              <div className="mb-10 border-b border-[var(--text-main)] pb-4 flex flex-col">
                <div className="flex justify-between items-end">
                  <h3 className="font-display font-bold text-2xl uppercase tracking-tighter text-[var(--text-main)] leading-none flex items-center gap-2">
                    <Activity className="w-6 h-6" /> Initialize Pool
                  </h3>
                  <span className="font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase mb-1">LP-01</span>
                </div>
                <Tooltip content="Create a new liquidity pool for lenders. Define the risk parameters and target yield. Borrowers whose credit score meets your criteria will be matched to your pool." />
              </div>

              <form onSubmit={handleCreatePool} className="flex flex-col gap-6">
                <div className="flex flex-col bg-[var(--bg-primary)] border border-[var(--border-light)] p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm uppercase tracking-widest text-[var(--text-main)]">Targeted Pool?</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={isTargeted} onChange={() => setIsTargeted(!isTargeted)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-[var(--border-light)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--text-main)]"></div>
                    </label>
                  </div>
                  <Tooltip content="Enable 'Targeted Pool' to define custom AI-interpreted criteria instead of fixed risk tiers. The AI will match borrowers based on natural language rules you specify." />
                </div>

                <div className="flex flex-col gap-2 relative">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Pool Name <Tooltip content="Give your pool a memorable name (e.g. 'Alpha Yield', 'DeFi Builders Fund')." /></label>
                  <input type="text" value={newPoolName} onChange={e => setNewPoolName(e.target.value)} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-xl font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-[var(--text-main)] focus:outline-none transition-all rounded-none" placeholder="e.g. Alpha Yield" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2 relative">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Target Return (BPS) <Tooltip content="Expected annual return in basis points. 500 BPS = 5.00% APY." /></label>
                    <input type="number" value={targetReturn} onChange={e => setTargetReturn(e.target.value)} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-lg font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-[var(--text-main)] focus:outline-none transition-all rounded-none" placeholder="500" required />
                  </div>
                  {!isTargeted && (
                      <div className="flex flex-col gap-2 relative">
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Min Credit Score <Tooltip content="Minimum AI-assigned credit score (0-10000) required for borrowers to access this pool." /></label>
                        <input type="number" value={minCredit} onChange={e => setMinCredit(e.target.value)} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-lg font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-[var(--text-main)] focus:outline-none transition-all rounded-none" placeholder="700" required />
                      </div>
                  )}
                </div>

                {!isTargeted ? (
                    <>
                        <div className="flex flex-col gap-2 relative">
                          <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Max Loan Amount <Tooltip content="Maximum loan amount (in Wei) that can be borrowed from this pool per proposal." /></label>
                          <input type="number" value={maxLoan} onChange={e => setMaxLoan(e.target.value)} className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-lg font-medium text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-[var(--text-main)] focus:outline-none transition-all rounded-none" placeholder="5000" required />
                        </div>

                        <div className="flex flex-col gap-2 relative">
                          <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Risk Tier <Tooltip content="Risk classification determines the pool's exposure profile. Higher risk = higher potential yield." /></label>
                          <select value={riskTier} onChange={e => setRiskTier(e.target.value)} className="w-full bg-[var(--bg-primary)] border border-[var(--border-light)] py-3 px-4 text-sm font-mono uppercase text-[var(--text-main)] focus:border-[var(--text-main)] focus:outline-none rounded-none cursor-pointer">
                            <option value="LOW">Low Risk</option>
                            <option value="MEDIUM">Medium Risk</option>
                            <option value="HIGH">High Risk</option>
                          </select>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col gap-2 relative">
                      <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2 text-purple-400">
                        Target Criteria (AI Interpreted)
                       <Tooltip content="Describe your ideal borrower in natural language. The AI will interpret and enforce these criteria during loan evaluation." /></label>
                      <textarea value={criteria} onChange={e => setCriteria(e.target.value)} className="w-full bg-transparent border border-[var(--border-light)] p-4 text-sm font-mono text-[var(--text-main)] placeholder-[var(--border-light)] focus:border-purple-500 focus:outline-none transition-all rounded-none resize-none h-24" placeholder="e.g. Must have >500 GitHub Stars and an open-source Next.js repository." required />
                    </div>
                )}
                
                <button type="submit" disabled={genLayer.isFetching} className="btn-monolog group w-full mt-4 flex items-center justify-between overflow-hidden relative border border-[var(--text-main)] bg-[var(--text-main)] text-[var(--bg-primary)] hover:bg-transparent hover:text-[var(--text-main)] disabled:opacity-50 px-6 py-4 transition-colors">
                  <span className="text-sm tracking-widest uppercase font-mono relative z-10 font-bold">Deploy Liquidity Pool</span>
                  <PlusCircle className="w-4 h-4 relative z-10" />
                </button>
              </form>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Existing Pools (Span 8) */}
        <motion.div variants={revealUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-[var(--text-main)] pb-4 mb-4 gap-4">
            <div>
                <h3 className="font-display font-bold text-3xl uppercase tracking-tighter text-[var(--text-main)] leading-none mb-2">
                  Active Yield Pools
                </h3>
                <span className="font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
                  Total {genLayer.pools.length} Pools
                 <Tooltip content="All deployed liquidity pools with real-time stats. Click 'Rebalance Macro Risk' to update the global risk index using live market data (BTC price + Fear &amp; Greed Index)." /></span>
            </div>
            
            <button 
                onClick={() => genLayer.rebalanceMacroRisk()}
                disabled={genLayer.isFetching}
                className="btn-monolog group flex items-center gap-2 border border-orange-500/50 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-[var(--bg-secondary)] px-4 py-2 transition-colors disabled:opacity-50"
            >
                <TrendingUp className="w-4 h-4" />
                <span className="text-[10px] tracking-widest uppercase font-mono font-bold">Rebalance Macro Risk</span>
            </button>
          </div>

          {genLayer.macroRisk && (
              <div className="mb-6 p-4 border border-[var(--border-light)] bg-black/20 font-mono text-sm text-[var(--text-muted)]">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-orange-500">GLOBAL RISK INDEX</span>
                    <span className="text-[var(--text-main)]">{(genLayer.macroRisk.global_risk_bps / 100).toFixed(2)}%</span>
                </div>
                <Tooltip content="This index is computed by AI consensus using live data from CoinGecko (BTC price) and Alternative.me (Fear &amp; Greed Index)." />
                <div className="text-xs leading-relaxed border-t border-[var(--border-light)] pt-2">
                    <span className="text-[var(--text-main)]">AI REASONING: </span>
                    {genLayer.macroRisk.macro_risk_reasoning}
                </div>
              </div>
          )}

          <div className="flex flex-col gap-6">
            <AnimatePresence>
              {genLayer.pools.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 border border-dashed border-[var(--border-light)] flex flex-col items-center justify-center text-center gap-4 bg-[var(--bg-secondary)]">
                  <DollarSign className="w-8 h-8 text-[var(--border-light)]" />
                  <p className="font-mono text-sm text-[var(--text-muted)] uppercase tracking-widest">No liquidity pools deployed yet. Create one using the form on the left to start earning yield.</p>
                </motion.div>
              ) : (
                genLayer.pools.map((pool, idx) => (
                  <motion.div 
                    key={pool.pool_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="brutalist-border bg-[var(--bg-secondary)] p-8 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-[var(--border-light)] pb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-display font-bold text-2xl uppercase tracking-tighter">{pool.name}</h4>
                          <span className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest border ${
                            pool.risk_tier === 'LOW' ? 'border-green-500/50 text-green-500' :
                            pool.risk_tier === 'HIGH' ? 'border-red-500/50 text-red-500' :
                            'border-yellow-500/50 text-yellow-500'
                          }`}>
                            {pool.risk_tier} RISK
                          </span>
                        </div>
                        <p className="font-mono text-xs text-[var(--text-muted)] tracking-widest uppercase">ID: {pool.pool_id}</p>
                      </div>
                      
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <span className="block font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase mb-1">Available Liquidity</span>
                          <span className="font-display font-bold text-3xl tracking-tighter text-[var(--text-main)] flex items-center gap-1">
                            <Lock className="w-5 h-5 text-[var(--text-muted)]" /> {pool.available_liquidity_wei}
                          </span>
                        </div>
                        <div>
                          <span className="block font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase mb-1">Target Yield</span>
                          <span className="font-display font-bold text-3xl tracking-tighter text-[var(--text-main)] flex items-center gap-1">
                            <TrendingUp className="w-5 h-5 text-[var(--text-muted)]" /> {(pool.target_return_bps / 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {pool.criteria && (
                      <div className="mb-6 p-4 border border-purple-500/30 bg-purple-500/5">
                          <span className="block font-mono text-[10px] text-purple-400 tracking-widest uppercase mb-2">AI Targeting Criteria</span>
                          <p className="font-mono text-sm text-[var(--text-main)]">{pool.criteria}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Deposit Section */}
                      <div className="bg-[var(--bg-primary)] p-6 border border-[var(--border-light)]">
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2 mb-1">
                          <PlusCircle className="w-3 h-3" /> Provide Liquidity
                         <Tooltip content="Enter the amount of GEN tokens (in Wei) to deposit into this pool. Your deposit earns the target yield rate." /></label>
                        <div className="flex gap-4">
                          <input 
                            type="number" 
                            value={depositAmounts[pool.pool_id] || ''} 
                            onChange={e => setDepositAmounts({...depositAmounts, [pool.pool_id]: e.target.value})}
                            className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-sm font-medium text-[var(--text-main)] focus:border-[var(--text-main)] focus:outline-none rounded-none" 
                            placeholder="Amount in WEI..." 
                          />
                          <button 
                            onClick={() => genLayer.depositLiquidity(pool.pool_id, BigInt(depositAmounts[pool.pool_id] || 0))}
                            disabled={!depositAmounts[pool.pool_id]}
                            className="px-6 py-2 border border-[var(--text-main)] text-[10px] font-mono uppercase tracking-widest hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)] whitespace-nowrap transition-colors disabled:opacity-50"
                          >
                            Deposit
                          </button>
                        </div>
                      </div>

                      {/* Withdraw Section */}
                      <div className="bg-[var(--bg-primary)] p-6 border border-[var(--border-light)]">
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2 mb-1">
                          <Unlock className="w-3 h-3" /> Withdraw Liquidity
                         <Tooltip content="Withdraw your deposited GEN tokens from this pool. You can only withdraw up to your deposited balance." /></label>
                        <div className="flex gap-4">
                          <input 
                            type="number" 
                            value={withdrawAmounts[pool.pool_id] || ''} 
                            onChange={e => setWithdrawAmounts({...withdrawAmounts, [pool.pool_id]: e.target.value})}
                            className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-sm font-medium text-[var(--text-main)] focus:border-[var(--text-main)] focus:outline-none rounded-none" 
                            placeholder="Amount in WEI..." 
                          />
                          <button 
                            onClick={() => genLayer.withdrawLiquidity(pool.pool_id, parseInt(withdrawAmounts[pool.pool_id] || '0', 10))}
                            disabled={!withdrawAmounts[pool.pool_id]}
                            className="px-6 py-2 border border-[var(--text-main)] text-[10px] font-mono uppercase tracking-widest hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)] whitespace-nowrap transition-colors disabled:opacity-50"
                          >
                            Withdraw
                          </button>
                        </div>
                      </div>
                    </div>

                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
