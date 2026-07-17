import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Upload } from 'lucide-react';
import { useSoundEffect } from '../hooks/useSoundEffect';

export function KYCDashboard({ genLayer }: { genLayer: any }) {
  const { playHover, playClick } = useSoundEffect();
  const [docHash, setDocHash] = useState('');
  const [selfieHash, setSelfieHash] = useState('');
  const [poaHash, setPoaHash] = useState('');

  const handleKYCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    if (!docHash || !selfieHash || !poaHash) return;
    
    await genLayer.executeTransaction('submit_identity_verification', [docHash, selfieHash, poaHash]);
    setDocHash('');
    setSelfieHash('');
    setPoaHash('');
  };

  return (
    <div className="mb-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-center gap-4 mb-12 border-b border-[var(--border-light)] pb-6"
      >
        <ShieldCheck className="w-8 h-8 text-[var(--text-main)]" />
        <h3 className="text-3xl font-display font-bold uppercase tracking-tighter">
          Identity Verification
        </h3>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="brutalist-border p-8 bg-[var(--bg-secondary)] border border-[var(--text-main)] relative">
          <h4 className="text-sm font-mono tracking-widest uppercase mb-6 text-[var(--text-muted)] border-b border-[var(--border-light)] pb-2">
            // Submit KYC Proofs
          </h4>
          <form onSubmit={handleKYCSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest mb-2">Document Hash (ID/Passport)</label>
              <input
                type="text"
                value={docHash}
                onChange={(e) => setDocHash(e.target.value)}
                className="w-full bg-transparent border-b border-[var(--border-light)] focus:border-[var(--text-main)] py-2 text-sm font-mono outline-none transition-colors"
                placeholder="0x..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest mb-2">Selfie Hash</label>
              <input
                type="text"
                value={selfieHash}
                onChange={(e) => setSelfieHash(e.target.value)}
                className="w-full bg-transparent border-b border-[var(--border-light)] focus:border-[var(--text-main)] py-2 text-sm font-mono outline-none transition-colors"
                placeholder="0x..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest mb-2">Proof of Address Hash</label>
              <input
                type="text"
                value={poaHash}
                onChange={(e) => setPoaHash(e.target.value)}
                className="w-full bg-transparent border-b border-[var(--border-light)] focus:border-[var(--text-main)] py-2 text-sm font-mono outline-none transition-colors"
                placeholder="0x..."
                required
              />
            </div>
            <button
              type="submit"
              onMouseEnter={playHover}
              disabled={genLayer.isTxPending}
              className="w-full btn-monolog flex items-center justify-center gap-2 bg-[var(--text-main)] text-[var(--bg-primary)] px-6 py-4 uppercase font-mono tracking-widest text-sm hover:opacity-90 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              Submit KYC Evidence
            </button>
          </form>
        </div>

        <div className="brutalist-border p-8 bg-[var(--bg-secondary)] border border-[var(--border-light)] text-[var(--text-muted)]">
          <h4 className="text-sm font-mono tracking-widest uppercase mb-6 border-b border-[var(--border-light)] pb-2">
            // About Enterprise KYC
          </h4>
          <p className="text-sm font-sans leading-relaxed mb-4">
            The PoW Lending Protocol utilizes Zero-Knowledge compatible payloads for Identity Verification.
            Submit the cryptographic hashes of your identity documents.
          </p>
          <p className="text-sm font-sans leading-relaxed">
            The decentralized AI Oracle network will verify the hashes and assign a holistic Trust Score, modifying your Risk Tier.
          </p>
        </div>
      </div>
    </div>
  );
}
