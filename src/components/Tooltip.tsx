import React, { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';

export const Tooltip: React.FC<{ content: string; children?: ReactNode }> = ({ content, children }) => {
  return (
    <div className="group relative inline-flex items-center justify-center ml-2 z-10 align-middle">
      {children || <HelpCircle className="w-3 h-3 text-[var(--text-muted)] cursor-help hover:text-[var(--text-main)] transition-colors inline-block" />}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[var(--text-main)] text-[var(--bg-primary)] font-mono text-[10px] leading-relaxed italic opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none brutalist-border">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--text-main)]"></div>
      </div>
    </div>
  );
};
