import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Settings, Key, AlertTriangle, Cpu } from 'lucide-react';
import { useSoundEffect } from '../hooks/useSoundEffect';
import { toast } from 'sonner';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIConfigModal({ isOpen, onClose }: AIConfigModalProps) {
  const { playHover, playClick } = useSoundEffect();
  
  const [apiKey, setApiKey] = useState('');
  const [quota, setQuota] = useState(5);

  useEffect(() => {
    // Load config from local storage
    const savedKey = localStorage.getItem('GENLAYER_AI_BYOK');
    const savedQuota = localStorage.getItem('GENLAYER_DAILY_QUOTA');
    if (savedKey) setApiKey(savedKey);
    if (savedQuota) setQuota(parseInt(savedQuota));
    else localStorage.setItem('GENLAYER_DAILY_QUOTA', '5'); // initial quota
  }, [isOpen]);

  const handleSave = () => {
    playClick();
    if (apiKey) {
      localStorage.setItem('GENLAYER_AI_BYOK', apiKey);
      toast.success("BYOK (Bring Your Own Key) saved securely locally.");
    } else {
      localStorage.removeItem('GENLAYER_AI_BYOK');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => { playClick(); onClose(); }}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[var(--bg-primary)] border border-[var(--border-light)] p-8 shadow-2xl"
        >
          <button 
            onClick={() => { playClick(); onClose(); }}
            onMouseEnter={playHover}
            className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-red-500 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>

          <h2 className="text-xl font-display uppercase tracking-widest text-[var(--text-main)] mb-2 flex items-center gap-3">
            <Cpu className="w-5 h-5 text-cyan-400" />
            AI Configuration
          </h2>
          <p className="font-mono text-xs text-[var(--text-muted)] mb-8 tracking-widest uppercase">
            Network Quotas & Execution Providers
          </p>

          <div className="space-y-6">
            {/* Quota Section */}
            <div className="p-4 border border-[var(--border-light)] bg-black/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Settings className="w-24 h-24" />
              </div>
              <h3 className="text-xs font-mono text-[var(--text-main)] mb-1 uppercase tracking-widest">
                Daily LLM Quota
              </h3>
              <p className="text-[10px] font-mono text-[var(--text-muted)] mb-4">
                Protects the GenLayer network from excessive compute consumption (DDoS/Spam).
              </p>
              
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-display ${quota > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {quota}
                </span>
                <span className="text-sm font-mono text-[var(--text-muted)] pb-1">/ 5 Proposals Remaining</span>
              </div>
              
              {quota === 0 && !apiKey && (
                <div className="mt-4 p-2 bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-mono text-red-400">
                    Daily quota exceeded. You cannot submit new proposals unless you provide a BYOK (Bring Your Own Key).
                  </p>
                </div>
              )}
            </div>

            {/* BYOK Section */}
            <div className="p-4 border border-[var(--border-light)] bg-black/40">
              <h3 className="text-xs font-mono text-[var(--text-main)] mb-1 uppercase tracking-widest flex items-center gap-2">
                <Key className="w-3 h-3 text-yellow-500" />
                Bring Your Own Key (BYOK)
              </h3>
              <p className="text-[10px] font-mono text-[var(--text-muted)] mb-4">
                Bypass free tier quotas by supplying your own API key. Keys are stored locally and never sent to our servers.
              </p>
              
              <input 
                type="password" 
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..." 
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-light)] py-2 px-3 text-xs font-mono text-[var(--text-main)] focus:border-yellow-500 focus:outline-none rounded-none"
              />
            </div>

            <button 
              onClick={handleSave}
              onMouseEnter={playHover}
              className="w-full py-3 bg-[var(--text-main)] text-[var(--bg-primary)] hover:bg-cyan-400 font-mono text-xs uppercase tracking-widest transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
