import React from 'react';
import { Loader2, ShieldAlert, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export const InitializationView: React.FC<{ onDeploy: () => void; isDeploying: boolean; address: string }> = ({ onDeploy, isDeploying, address }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center justify-center p-10 md:p-16 card-monolog-light text-center max-w-2xl mt-16 w-full relative rounded-none brutalist-border"
    >
      {/* Brutalist decorative box */}
      <div className="absolute top-0 right-0 w-16 h-16 border-l border-b border-[var(--text-main)] bg-[var(--bg-primary)] flex items-center justify-center">
        <span className="font-mono text-[10px] text-[var(--text-main)] tracking-widest -rotate-90">INIT</span>
      </div>
      
      <motion.div 
        animate={{ rotate: isDeploying ? 180 : 0 }}
        transition={{ duration: 2, repeat: isDeploying ? Infinity : 0, ease: "linear" }}
        className="mb-8"
      >
        <Cpu className="w-12 h-12 text-[var(--text-main)]" strokeWidth={1.5} />
      </motion.div>
      
      <h2 className="text-4xl md:text-5xl font-display font-bold text-[var(--text-main)] tracking-tight mb-6 uppercase">
        Initialize.
      </h2>
      
      <p className="text-[var(--text-muted)] text-sm md:text-base mb-12 leading-relaxed font-mono max-w-md">
        Deploy the GenLayer intelligent contract to the decentralized network. 
        <br/><br/>
        This will initialize the qualitative Proof-of-Work verifier ledger for protocol operations.
      </p>
      
      <button
        onClick={onDeploy}
        disabled={isDeploying || !address}
        className="w-full max-w-sm btn-monolog py-4 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed uppercase font-sans tracking-wide text-sm"
      >
        {isDeploying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Deploying...</span>
          </>
        ) : (
          <span>Initialize Ledger</span>
        )}
      </button>

      {!address && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.2 }}
          className="mt-8 flex items-center gap-2 text-xs text-[var(--bg-secondary)] bg-[var(--text-main)] px-6 py-3 rounded-full font-mono border border-[var(--text-main)]"
        >
          <ShieldAlert className="w-4 h-4" />
          Wallet connection required
        </motion.div>
      )}
    </motion.div>
  );
};
