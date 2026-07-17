import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, AlertTriangle, Crosshair } from 'lucide-react';
import { useSoundEffect } from '../hooks/useSoundEffect';

export function AdminDashboard({ genLayer }: { genLayer: any }) {
  const { playHover, playClick } = useSoundEffect();
  const [proposalId, setProposalId] = useState('');
  
  const handleRebalance = async () => {
    playClick();
    await genLayer.executeTransaction('rebalance_macro_risk', []);
  };

  const handleMarkDefault = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    if (!proposalId) return;
    await genLayer.executeTransaction('mark_default', [proposalId]);
    setProposalId('');
  };

  return (
    <div className="mb-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-center gap-4 mb-12 border-b border-[var(--border-light)] pb-6"
      >
        <Terminal className="w-8 h-8 text-[var(--text-main)]" />
        <h3 className="text-3xl font-display font-bold uppercase tracking-tighter">
          Admin Control Center
        </h3>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="brutalist-border p-8 bg-[var(--bg-secondary)] border border-[var(--text-main)] relative">
          <h4 className="text-sm font-mono tracking-widest uppercase mb-6 text-[var(--text-muted)] border-b border-[var(--border-light)] pb-2 flex items-center gap-2">
            <Crosshair className="w-4 h-4" /> // Macro Risk Rebalance
          </h4>
          <p className="text-sm text-[var(--text-muted)] mb-8 font-sans leading-relaxed">
            Trigger the AI Oracle network to fetch live Fear & Greed index and crypto prices to adjust the systemic global risk index dynamically.
          </p>
          <button
            onClick={handleRebalance}
            onMouseEnter={playHover}
            disabled={genLayer.isTxPending}
            className="w-full btn-monolog flex items-center justify-center gap-2 bg-transparent text-[var(--text-main)] border border-[var(--text-main)] hover:bg-[var(--text-main)] hover:text-[var(--bg-primary)] px-6 py-4 uppercase font-mono tracking-widest text-sm transition-all disabled:opacity-50"
          >
            Trigger Macro Rebalance
          </button>
        </div>

        <div className="brutalist-border p-8 bg-[var(--bg-secondary)] border border-[#da3d3d] relative">
          <h4 className="text-sm font-mono tracking-widest uppercase mb-6 text-[#da3d3d] border-b border-[var(--border-light)] pb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> // Force Default
          </h4>
          <form onSubmit={handleMarkDefault} className="space-y-6">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest mb-2 text-[var(--text-main)]">Proposal ID</label>
              <input
                type="text"
                value={proposalId}
                onChange={(e) => setProposalId(e.target.value)}
                className="w-full bg-transparent border-b border-[var(--border-light)] focus:border-[#da3d3d] py-2 text-sm font-mono outline-none transition-colors"
                placeholder="UUID..."
                required
              />
            </div>
            <button
              type="submit"
              onMouseEnter={playHover}
              disabled={genLayer.isTxPending}
              className="w-full btn-monolog flex items-center justify-center gap-2 bg-[#da3d3d] text-white hover:bg-red-700 px-6 py-4 uppercase font-mono tracking-widest text-sm transition-all disabled:opacity-50"
            >
              Mark Loan Defaulted
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
