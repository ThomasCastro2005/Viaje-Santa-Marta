'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface MediaModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov|avi|ogg)$/i.test(url.split('?')[0]);
}

export default function MediaModal({ url, title, onClose }: MediaModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Pause on close, trap Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      videoRef.current?.pause();
    };
  }, [onClose]);

  const video = isVideoUrl(url);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 flex items-center gap-2 text-white/60 hover:text-white transition-colors font-body text-sm"
        >
          <X size={18} /> Cerrar (Esc)
        </button>

        {video ? (
          <video
            ref={videoRef}
            src={url}
            controls
            autoPlay
            className="w-full rounded-2xl shadow-2xl bg-black"
            style={{ maxHeight: '80vh' }}
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={url}
            alt={title}
            className="w-full rounded-2xl shadow-2xl object-contain"
            style={{ maxHeight: '80vh' }}
          />
        )}

        <p className="text-white/40 font-body text-sm text-center truncate">{title}</p>
      </div>
    </div>
  );
}
