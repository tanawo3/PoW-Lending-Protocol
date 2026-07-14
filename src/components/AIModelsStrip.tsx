import React from 'react';
import { motion } from 'framer-motion';

export function AIModelsStrip() {
  return (
    <section className="w-full border-t border-[var(--border-light)] bg-[var(--bg-primary)] overflow-hidden py-12 relative z-10">
      <div className="max-w-[1400px] mx-auto px-6 flex flex-col items-center">
        
        <div className="w-full flex flex-wrap justify-center gap-12 md:gap-24 opacity-60">
          <motion.img 
            whileHover={{ scale: 1.1, opacity: 1, filter: 'invert(1)' }}
            src="/images/GPT.svg" 
            alt="GPT" 
            className="h-8 md:h-10 w-auto filter invert transition-all duration-300" 
            data-cursor-hover
            data-cursor-text="GPT-4o"
          />
          <motion.img 
            whileHover={{ scale: 1.1, opacity: 1, filter: 'invert(1)' }}
            src="/images/Claude.svg" 
            alt="Claude" 
            className="h-8 md:h-10 w-auto filter invert transition-all duration-300" 
            data-cursor-hover
            data-cursor-text="Claude 3.5"
          />
          <motion.img 
            whileHover={{ scale: 1.1, opacity: 1, filter: 'invert(1)' }}
            src="/images/Gemini.svg" 
            alt="Gemini" 
            className="h-8 md:h-10 w-auto filter invert transition-all duration-300" 
            data-cursor-hover
            data-cursor-text="Gemini 1.5"
          />
          <motion.img 
            whileHover={{ scale: 1.1, opacity: 1, filter: 'invert(1)' }}
            src="/images/Grok.svg" 
            alt="Grok" 
            className="h-8 md:h-10 w-auto filter invert transition-all duration-300" 
            data-cursor-hover
            data-cursor-text="Grok 2"
          />
        </div>
      </div>
    </section>
  );
}
