import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [hoverText, setHoverText] = useState("");

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Look up the DOM tree for our specific data attributes
      const interactiveEl = target.closest('button, a, input, [data-cursor-hover]');
      const textHoverEl = target.closest('[data-cursor-text]');

      if (interactiveEl) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }

      if (textHoverEl) {
        const text = textHoverEl.getAttribute('data-cursor-text');
        setHoverText(text || "");
        setIsHovering(true);
      } else {
        setHoverText("");
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 bg-[var(--bg-primary)] mix-blend-difference rounded-full pointer-events-none z-[9999] flex items-center justify-center text-center overflow-hidden"
        animate={{
          x: mousePosition.x - (isHovering ? (hoverText ? 40 : 24) : 8),
          y: mousePosition.y - (isHovering ? (hoverText ? 40 : 24) : 8),
          width: isHovering ? (hoverText ? 80 : 48) : 16,
          height: isHovering ? (hoverText ? 80 : 48) : 16,
          backgroundColor: hoverText ? 'var(--text-main)' : 'var(--bg-primary)',
          mixBlendMode: hoverText ? 'normal' : 'difference',
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 28,
          mass: 0.5
        }}
      >
        {hoverText && (
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[var(--bg-primary)] font-mono text-[10px] uppercase tracking-widest leading-none block whitespace-nowrap"
          >
            {hoverText}
          </motion.span>
        )}
      </motion.div>
    </>
  );
}
