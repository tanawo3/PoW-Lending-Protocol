import React from 'react';
import { motion } from 'framer-motion';
import { useSoundEffect } from '../hooks/useSoundEffect';
import { WebGLBackground } from './WebGLBackground';

export function FooterCTA() {
  const { playHover, playClick } = useSoundEffect();

  return (
    <footer className="w-full bg-[var(--text-main)] text-[var(--bg-primary)] pt-32 pb-16 px-6 relative overflow-hidden">
      
      {/* Background WebGL and Texture */}
      <WebGLBackground />
      <div className="absolute inset-0 w-full h-full opacity-20 pointer-events-none mix-blend-overlay z-0">
        <img src="/images/texture.avif" alt="Texture" className="w-full h-full object-cover filter grayscale" />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10 flex flex-col items-center text-center">
        <span className="font-mono text-sm uppercase tracking-[0.2em] mb-12 border-b border-current/20 pb-4">
          Join the Validator Network
        </span>
        
        <h2 className="font-display font-black text-[clamp(4rem,10vw,12rem)] leading-[0.8] tracking-tighter uppercase mb-16 hover:text-transparent hover:style-[WebkitTextStroke:2px_var(--bg-primary)] transition-all duration-700">
          Ready to <br/> Lend?
        </h2>

        <motion.button 
          onMouseEnter={playHover}
          onClick={() => {
            playClick();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[var(--bg-primary)] text-[var(--text-main)] px-12 py-6 rounded-full font-mono text-sm uppercase tracking-widest hover:bg-[#d1d1c7] transition-colors flex items-center gap-4 cursor-pointer"
        >
          <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
          Initialize Node
        </motion.button>
      </div>

      <div className="max-w-[1400px] mx-auto mt-32 pt-8 border-t border-current/20 flex flex-col md:flex-row justify-center items-center gap-6 font-mono text-xs uppercase tracking-widest opacity-50 relative z-10">
        <p>© 2026 GenLayer Protocol.</p>
      </div>
    </footer>
  );
}
