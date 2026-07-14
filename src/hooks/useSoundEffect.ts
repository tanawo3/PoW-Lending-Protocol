import { useCallback, useEffect, useRef } from 'react';
import { Howl } from 'howler';

const CDN_BASE = "https://byhuy.b-cdn.net/soundlib-main";
const VOL_HOVER = 0.15;
const VOL_CLICK = 0.15;

export function useSoundEffect() {
  const hoverSounds = useRef<Howl[]>([]);
  const clickSound = useRef<Howl | null>(null);

  useEffect(() => {
    // Preload exactly like the original site
    hoverSounds.current = [
      new Howl({ src: [`${CDN_BASE}/tap_01.mp3`], volume: VOL_HOVER }),
      new Howl({ src: [`${CDN_BASE}/tap_02.mp3`], volume: VOL_HOVER }),
      new Howl({ src: [`${CDN_BASE}/tap_03.mp3`], volume: VOL_HOVER }),
      new Howl({ src: [`${CDN_BASE}/tap_04.mp3`], volume: VOL_HOVER }),
      new Howl({ src: [`${CDN_BASE}/tap_05.mp3`], volume: VOL_HOVER })
    ];

    clickSound.current = new Howl({ src: [`${CDN_BASE}/select.mp3`], volume: VOL_CLICK });

    return () => {
      // Cleanup
      hoverSounds.current.forEach(h => h.unload());
      if (clickSound.current) clickSound.current.unload();
    };
  }, []);

  const playHover = useCallback(() => {
    if (hoverSounds.current.length > 0) {
      // Pick a random hover sound from the 5 tap sounds
      const randomIndex = Math.floor(Math.random() * hoverSounds.current.length);
      hoverSounds.current[randomIndex].play();
    }
  }, []);

  const playClick = useCallback(() => {
    if (clickSound.current) {
      clickSound.current.play();
    }
  }, []);

  return { playHover, playClick };
}
