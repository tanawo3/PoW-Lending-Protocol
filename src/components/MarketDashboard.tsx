import React, { useState } from 'react';
import { useGenLayer } from '../hooks/useGenLayer';
import { TrendingUp, TrendingDown, RefreshCw, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MarketDashboard: React.FC<{ genLayer: ReturnType<typeof useGenLayer> }> = ({ genLayer }) => {
  const [betAmounts, setBetAmounts] = useState<{ [id: string]: string }>({});

  const revealUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="w-full flex flex-col gap-16 font-sans pb-24 border-t border-[var(--border-light)] pt-24 mt-24">
      
      <div className="flex items-end justify-between border-b border-[var(--text-main)] pb-4 mb-4">
        <h3 className="font-display font-bold text-3xl uppercase tracking-tighter text-[var(--text-main)] leading-none flex items-center gap-3">
          <BarChart2 className="w-8 h-8" /> Prediction Markets
        </h3>
        <span className="font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
          {genLayer.markets.length} Active Markets
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {genLayer.markets.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full p-12 border border-dashed border-[var(--border-light)] flex flex-col items-center justify-center text-center gap-4 bg-[var(--bg-secondary)]">
              <BarChart2 className="w-8 h-8 text-[var(--border-light)]" />
              <p className="font-mono text-sm text-[var(--text-muted)] uppercase tracking-widest">No prediction markets active.</p>
            </motion.div>
          ) : (
            genLayer.markets.map((market, idx) => {
              const totalPool = market.total_pool_yes + market.total_pool_no;
              const yesPercent = totalPool > 0 ? (market.total_pool_yes / totalPool) * 100 : 50;
              const noPercent = totalPool > 0 ? (market.total_pool_no / totalPool) * 100 : 50;

              return (
                <motion.div 
                  key={market.market_id}
                  variants={revealUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="brutalist-border bg-[var(--bg-secondary)] p-8 relative overflow-hidden group flex flex-col justify-between"
                >
                  <div className="mb-6">
                    <span className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)] block mb-2">{market.market_id}</span>
                    <h4 className="font-display font-bold text-xl leading-tight text-[var(--text-main)]">{market.question}</h4>
                  </div>

                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest">
                      <span className="text-green-500">Repay ({yesPercent.toFixed(1)}%)</span>
                      <span className="text-red-500">Default ({noPercent.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 w-full flex bg-[var(--border-light)]">
                      <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${yesPercent}%` }}></div>
                      <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${noPercent}%` }}></div>
                    </div>
                    <div className="font-mono text-[10px] text-center text-[var(--text-muted)] uppercase tracking-widest">
                      Total Liquidity: {totalPool} ATTO
                    </div>
                  </div>

                  {market.resolved ? (
                    <div className="text-center py-4 border border-[var(--text-main)] bg-[var(--text-main)] text-[var(--bg-primary)] font-mono text-xs uppercase tracking-widest font-bold">
                      RESOLVED: {market.outcome_yes ? "REPAID" : "DEFAULTED"}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <input 
                        type="number" 
                        value={betAmounts[market.market_id] || ''} 
                        onChange={e => setBetAmounts({...betAmounts, [market.market_id]: e.target.value})}
                        className="w-full bg-transparent border-b border-[var(--border-light)] py-2 text-sm font-medium text-[var(--text-main)] focus:border-[var(--text-main)] focus:outline-none rounded-none" 
                        placeholder="Bet Amount (ATTO)" 
                      />
                      <div className="flex gap-4">
                        <button 
                          onClick={() => genLayer.placeBet(market.market_id, true, BigInt(betAmounts[market.market_id] || 0))}
                          disabled={!betAmounts[market.market_id]}
                          className="flex-1 px-4 py-3 border border-green-500 text-green-500 hover:bg-green-500 hover:text-white flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                          <TrendingUp className="w-3 h-3" /> Bet Repay
                        </button>
                        <button 
                          onClick={() => genLayer.placeBet(market.market_id, false, BigInt(betAmounts[market.market_id] || 0))}
                          disabled={!betAmounts[market.market_id]}
                          className="flex-1 px-4 py-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                          <TrendingDown className="w-3 h-3" /> Bet Default
                        </button>
                      </div>
                      <button 
                        onClick={() => genLayer.resolveMarket(market.market_id)}
                        className="w-full mt-2 px-4 py-2 border border-[var(--text-main)] text-[10px] font-mono uppercase tracking-widest hover:bg-[var(--text-main)] hover:text-[var(--bg-secondary)] transition-colors"
                      >
                        Resolve Market
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
