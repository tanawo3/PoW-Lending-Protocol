import React from 'react';
import { motion } from 'framer-motion';

export function InfiniteMarquee() {
  const text = "INTELLIGENT CONTRACTS // SUBJECTIVE CONSENSUS // DECENTRALIZED LENDING // ";
  
  // We duplicate the text multiple times so there's enough content to scroll seamlessly
  const marqueeContent = text.repeat(4);

  return (
    <div className="w-full overflow-hidden bg-[var(--text-main)] text-[var(--bg-primary)] py-8 md:py-12 border-y border-[var(--bg-primary)] flex whitespace-nowrap">
      <motion.div
        className="flex space-x-12 shrink-0 items-center"
        animate={{
          x: ["0%", "-50%"]
        }}
        transition={{
          duration: 250,
          ease: "linear",
          repeat: Infinity
        }}
      >
        <span className="font-display font-extrabold text-5xl md:text-8xl tracking-tighter uppercase pl-12">
          {marqueeContent}
        </span>
        <span className="font-display font-extrabold text-5xl md:text-8xl tracking-tighter uppercase">
          {marqueeContent}
        </span>
      </motion.div>
    </div>
  );
}
