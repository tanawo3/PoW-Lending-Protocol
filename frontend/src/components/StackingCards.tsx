import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const cards = [
  {
    id: 1,
    title: "1 // Inject Payload",
    description: "Submit your lending request payload to the GenLayer network. This initiates the decentralized validation process.",
    color: "bg-[var(--card-dark)] text-[var(--bg-primary)]",
    top: "top-32"
  },
  {
    id: 2,
    title: "2 // PoW Validation",
    description: "The validator nodes compute the Proof-of-Work hashes, racing to reach subjective consensus on your entry.",
    color: "bg-[var(--text-main)] text-[var(--bg-primary)]",
    top: "top-40"
  },
  {
    id: 3,
    title: "3 // Consensus Met",
    description: "Once consensus is reached, your payload is approved and the funds are trustlessly allocated to your designated wallet.",
    color: "bg-[#8a8a83] text-black",
    top: "top-48"
  }
];

export function StackingCards() {
  return (
    <div className="w-full bg-[var(--bg-primary)] py-32 md:py-48 relative">
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 relative">
        
        {/* Left Sticky Title */}
        <div className="lg:col-span-5 h-full relative">
          <div className="sticky top-32">
            <h3 className="font-display font-bold text-5xl md:text-7xl uppercase tracking-tighter leading-[0.9]">
              How it <br/> works.
            </h3>
            <p className="mt-8 text-lg font-sans text-[var(--text-muted)] max-w-sm">
              GenLayer replaces centralized decision making with a subjective validator network powered by Proof-of-Work.
            </p>
          </div>
        </div>

        {/* Right Stacking Cards */}
        <div className="lg:col-span-7 flex flex-col gap-8 pb-32">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className={`sticky ${card.top} brutalist-border p-12 md:p-16 ${card.color} min-h-[40vh] flex flex-col justify-between`}
            >
              <div className="border-b border-current/20 pb-6 mb-12">
                <h4 className="font-mono text-sm uppercase tracking-widest">{card.title}</h4>
              </div>
              <p className="font-display font-medium text-3xl md:text-4xl leading-snug tracking-tight">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
