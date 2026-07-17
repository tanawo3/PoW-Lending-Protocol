import React, { useState } from 'react';
import { UploadCloud, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function SimulatedIPFSUploader({ onUploadComplete }: { onUploadComplete: (cid: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const simulateUpload = () => {
    setIsUploading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          const fakeCid = "Qm" + Array.from({ length: 44 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
          const ipfsUrl = `ipfs://${fakeCid}`;
          onUploadComplete(ipfsUrl);
          setIsUploading(false);
          toast.success("File pinned to IPFS successfully!");
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  return (
    <div className="mt-3 p-4 bg-black/20 border border-[var(--border-light)]">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-mono text-[var(--text-main)] mb-1 uppercase tracking-widest flex items-center gap-2">
            <UploadCloud className="w-3 h-3 text-cyan-400" />
            Decentralized Storage (IPFS)
          </h4>
          <p className="text-[10px] font-mono text-[var(--text-muted)] max-w-xs">
            Upload large evidence files (.zip, .pdf) off-chain. Only the immutable CID will be stored on GenLayer.
          </p>
        </div>
        <button
          type="button"
          onClick={simulateUpload}
          disabled={isUploading}
          className="px-4 py-2 bg-[var(--text-main)] text-[var(--bg-primary)] font-mono text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Pinning... {progress}%
            </>
          ) : (
            "Select & Upload"
          )}
        </button>
      </div>
      {progress > 0 && progress < 100 && (
        <div className="w-full h-1 bg-black mt-3 overflow-hidden">
          <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
