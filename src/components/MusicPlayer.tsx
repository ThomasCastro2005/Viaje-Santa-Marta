'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function MusicPlayer() {
  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const [playing,  setPlaying] = useState(false);
  const startedRef = useRef(false);

  // Create audio element once
  useEffect(() => {
    const audio      = new Audio('/assets/reggae.mp3');
    audio.loop       = true;
    audio.volume     = 0.18;
    audio.preload    = 'auto';
    audioRef.current = audio;

    // Autostart on first user interaction
    function onFirstInteraction() {
      if (startedRef.current) return;
      startedRef.current = true;
      audio.play().then(() => setPlaying(true)).catch(() => {});
      document.removeEventListener('click',     onFirstInteraction);
      document.removeEventListener('touchstart', onFirstInteraction);
      document.removeEventListener('keydown',   onFirstInteraction);
    }

    document.addEventListener('click',     onFirstInteraction);
    document.addEventListener('touchstart', onFirstInteraction);
    document.addEventListener('keydown',   onFirstInteraction);

    return () => {
      document.removeEventListener('click',     onFirstInteraction);
      document.removeEventListener('touchstart', onFirstInteraction);
      document.removeEventListener('keydown',   onFirstInteraction);
      audio.pause();
      audio.src = '';
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      startedRef.current = true;
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  return (
    <button
      onClick={toggle}
      title={playing ? 'Silenciar música' : 'Activar música'}
      aria-label={playing ? 'Silenciar música' : 'Activar música'}
      className={`
        fixed bottom-5 right-5 z-50
        w-11 h-11 rounded-full
        flex items-center justify-center
        shadow-lg shadow-ink/20
        transition-all duration-300
        border
        ${playing
          ? 'bg-bay border-white/20 text-white hover:bg-bay-mid'
          : 'bg-white/90 border-bay-light text-mist hover:bg-white'}
      `}
    >
      {/* Subtle pulse ring while playing */}
      {playing && (
        <span className="absolute inset-0 rounded-full bg-bay/40 animate-ping" />
      )}
      <span className="relative">
        {playing
          ? <Volume2 size={16} strokeWidth={2} />
          : <VolumeX size={16} strokeWidth={2} />}
      </span>
    </button>
  );
}
