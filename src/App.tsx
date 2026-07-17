import React, { useEffect } from 'react';
import { Wallet, Hexagon, XCircle, RefreshCw } from 'lucide-react';
import { useGenLayer } from './hooks/useGenLayer';
import { useSoundEffect } from './hooks/useSoundEffect';
import { InitializationView } from './components/InitializationView';
import { LoanDashboard } from './components/LoanDashboard';
import { PoolDashboard } from './components/PoolDashboard';
import { MarketDashboard } from './components/MarketDashboard';
import { KYCDashboard } from './components/KYCDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { SplitText } from './components/SplitText';
import { InfiniteMarquee } from './components/InfiniteMarquee';
import { StackingCards } from './components/StackingCards';
import { FooterCTA } from './components/FooterCTA';
import { CustomCursor } from './components/CustomCursor';
import { BGMController } from './components/BGMController';
import { AboutModal } from './components/AboutModal';
import { ToastContainer } from './components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from '@studio-freight/lenis';
import { useState } from 'react';

export default function App() {
  const genLayer = useGenLayer();
  const { playHover, playClick } = useSoundEffect();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  
  const {
    address,
    isConnected,
    connect,
    disconnect,
    contractAddress,
    deployContract,
    isDeploying,
    error,
    setError,
    toasts,
    removeToast
  } = genLayer;

  // Initialize smooth scroll (Lenis) exactly like Monolog
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    if (contractAddress && contractAddress !== "") {
      genLayer.fetchProposals();
    }
  }, [contractAddress, genLayer.fetchProposals]);

  // Framer Motion Variants for smooth reveals
  const revealUp = {
    hidden: { opacity: 0, y: 50, filter: 'blur(10px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[var(--bg-primary)] text-[var(--text-main)] font-sans relative selection:bg-black selection:text-white overflow-x-hidden">
      
      <CustomCursor />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Stark Navbar */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[var(--border-light)] relative z-40"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--text-main)] flex items-center justify-center">
            <Hexagon className="w-4 h-4 text-[var(--bg-primary)]" strokeWidth={2} />
          </div>
          <h1 className="text-sm font-bold tracking-[0.05em] uppercase font-display text-[var(--text-main)]">
            PoW Lending Protocol
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <BGMController />
          <button
            onMouseEnter={playHover}
            onClick={() => {
              playClick();
              isConnected ? disconnect() : connect();
            }}
            className="btn-monolog-outline flex items-center gap-2 group text-xs tracking-widest uppercase font-mono bg-transparent hover:bg-[var(--text-main)] hover:text-[var(--bg-primary)] border border-[var(--text-main)] px-6 py-3 rounded-full transition-colors cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5" />
            {isConnected ? (
              <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
            ) : (
              <span>Connect Node</span>
            )}
          </button>
          {isConnected && (
            <button
              disabled={isDeploying}
              onMouseEnter={playHover}
              onClick={async () => {
                playClick();
                localStorage.removeItem('POW_CONTRACT_FINAL');
                genLayer.setContractAddress('');
                await deployContract();
              }}
              className="btn-monolog-outline flex items-center gap-2 group text-xs tracking-widest uppercase font-mono bg-[var(--text-main)] text-[var(--bg-primary)] hover:bg-transparent hover:text-[var(--text-main)] border border-[var(--text-main)] px-6 py-3 rounded-full transition-colors cursor-pointer disabled:opacity-50"
              title="Deploy Contract"
            >
              <span>{isDeploying ? 'DEPLOYING...' : 'DEPLOY CONTRACT'}</span>
            </button>
          )}
        </div>
      </motion.header>

      <div className="w-full flex flex-col min-h-[100dvh] relative z-10">
        
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#da3d3d] text-white border-b border-[#080807] overflow-hidden"
            >
              <div className="px-6 py-3 flex items-start gap-4">
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-mono leading-relaxed flex-1">{error}</p>
                <button onClick={() => setError(null)} className="hover:opacity-70 transition-opacity">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 w-full flex flex-col">
          <AnimatePresence mode="wait">
            {!contractAddress || contractAddress === "" ? (
              <motion.div 
                key="init"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={revealUp}
                className="w-full flex-1 flex items-center justify-center min-h-[70vh] p-6"
              >
                <div className="max-w-xl w-full brutalist-border p-8 md:p-12 bg-[var(--bg-secondary)] border border-[var(--text-main)] relative">
                  <div className="absolute top-0 right-0 w-16 h-16 border-b border-l border-[var(--text-main)] bg-[var(--bg-primary)]"></div>
                  <h2 className="font-display font-bold text-4xl mb-4 tracking-tighter uppercase">Initialize.</h2>
                  <InitializationView 
                    onDeploy={deployContract} 
                    isDeploying={isDeploying} 
                    address={address} 
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="dashboard"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="w-full"
              >
                {/* Clean Hero Section */}
                <motion.div className="px-6 pt-24 pb-16 md:pt-32 md:pb-48 border-b border-[var(--border-light)] relative overflow-hidden">
                  
                  {/* Background architectural image from ZIP */}
                  <motion.div 
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.2 }}
                    transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-0 w-full md:w-[40vw] h-full pointer-events-none mix-blend-multiply"
                  >
                    <img src="/images/texture.avif" alt="Texture" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)] to-transparent h-full w-full"></div>
                  </motion.div>

                  <div className="max-w-[1400px] mx-auto relative z-10">
                    <motion.span variants={revealUp} className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)] block mb-6 border-b border-[var(--text-muted)] w-max pb-2">
                      // GenLayer Intelligent Contracts
                    </motion.span>
                    
                    <h2 className="font-display font-extrabold text-[clamp(2.5rem,4.5vw,5.5rem)] leading-[0.9] tracking-tighter text-[var(--text-main)] max-w-5xl uppercase whitespace-nowrap overflow-visible">
                      <SplitText text="Decentralized" delay={0} /> <br/>
                      <span className="text-transparent" style={{ WebkitTextStroke: '2px var(--text-main)' }}>
                        <SplitText text="Consensus." delay={0.2} />
                      </span>
                    </h2>
                    
                    <motion.div variants={revealUp} className="mt-24 flex flex-col md:flex-row gap-12 items-start md:items-end justify-between border-t border-[var(--border-light)] pt-12">
                      <p className="text-lg md:text-2xl text-[var(--text-muted)] max-w-[35ch] leading-relaxed font-sans font-medium">
                        Submit Proof-of-Work payloads. The validator network evaluates and forms subjective consensus to secure the lending allocation.
                      </p>
                      
                      <button 
                        onClick={() => setIsAboutOpen(true)}
                        onMouseEnter={playHover}
                        data-cursor-hover
                        data-cursor-text="WATCH"
                        className="group flex items-center justify-center w-24 h-24 rounded-full border border-[var(--text-main)] hover:bg-[var(--text-main)] hover:text-[var(--bg-primary)] transition-all duration-500"
                      >
                        <span className="font-mono text-xs tracking-widest uppercase">About</span>
                      </button>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Zomoroda Infinite Marquee */}
                <InfiniteMarquee />

                {/* Dashboard Grid */}
                <div className="max-w-[1400px] mx-auto px-6 py-24">
                  <AdminDashboard genLayer={genLayer} />

                  <KYCDashboard genLayer={genLayer} />

                  <LoanDashboard genLayer={genLayer} />
                  
                  <PoolDashboard genLayer={genLayer} />
                  
                  <MarketDashboard genLayer={genLayer} />
                </div>

                {/* Zomoroda Stacking Cards */}
                <StackingCards />

                {/* Zomoroda Footer */}
                <FooterCTA />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
