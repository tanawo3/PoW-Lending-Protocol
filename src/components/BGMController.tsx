import React, { useEffect, useState } from 'react';
import { Howl, Howler } from 'howler';
import { motion } from 'framer-motion';

const CDN_BASE = "https://byhuy.b-cdn.net/soundlib-main";

export function BGMController() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bgm, setBgm] = useState<Howl | null>(null);

  useEffect(() => {
    // Initialize the BGM (Background Music)
    const sound = new Howl({
      src: [`${CDN_BASE}/bgm.mp3`],
      volume: 0.095, // Matches the original le=.095
      loop: true,
      html5: true, // Force HTML5 Audio to avoid large memory buffers
      preload: false,
    });
    
    setBgm(sound);

    return () => {
      sound.unload();
    };
  }, []);

  const toggleBGM = () => {
    if (!bgm) return;
    
    if (isPlaying) {
      bgm.fade(0.095, 0, 600);
      setTimeout(() => bgm.pause(), 600);
      setIsPlaying(false);
    } else {
      bgm.play();
      bgm.fade(0, 0.095, 600);
      setIsPlaying(true);
    }
  };

  return (
    <button
      onClick={toggleBGM}
      data-cursor-hover
      data-cursor-text={isPlaying ? "MUTE" : "PLAY MUSIC"}
      className="w-12 h-12 rounded-full border border-[var(--text-main)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer overflow-hidden group mix-blend-difference"
    >
      <div className="flex gap-1 items-end h-4">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            animate={isPlaying ? {
              height: ["20%", "100%", "40%", "80%", "20%"]
            } : {
              height: "20%"
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1
            }}
            className="w-[2px] bg-[var(--text-main)]"
          />
        ))}
      </div>
    </button>
  );
}
