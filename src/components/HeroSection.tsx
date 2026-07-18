'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, ChevronDown, ClipboardCheck } from 'lucide-react';

interface HeroSectionProps {
  confirmedCount: number;
  totalCount: number;
  dataCompletion: number;
}

interface TimeLeft {
  days: number; hours: number; minutes: number; seconds: number;
}

const TRIP_DATE = new Date('2026-09-04T00:00:00');

function getTimeLeft(): TimeLeft {
  const diff = TRIP_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export default function HeroSection({
  confirmedCount, totalCount, dataCompletion,
}: HeroSectionProps) {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setMounted(true);
    setTime(getTimeLeft());
    const t = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(t);
  }, []);

  const units = [
    { value: time.days,    label: 'Días' },
    { value: time.hours,   label: 'Horas' },
    { value: time.minutes, label: 'Min' },
    { value: time.seconds, label: 'Seg' },
  ];

  return (
    <section
      id="top"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-20 px-5 md:px-8"
      style={{ background: 'linear-gradient(155deg, #10566A 0%, #1A7A8E 45%, #0E4A5C 100%)' }}
    >
      <span
        className="animate-float absolute top-24 -left-6 text-[140px] leading-none select-none opacity-[0.06] pointer-events-none hidden md:block"
        aria-hidden="true"
      >🌴</span>
      <span
        className="animate-float absolute bottom-28 -right-4 text-[110px] leading-none select-none opacity-[0.06] pointer-events-none hidden md:block"
        style={{ animationDelay: '2s' }}
        aria-hidden="true"
      >🌴</span>

      <div className="relative z-10 text-center w-full max-w-2xl mx-auto">
        <p className="font-body text-white/45 text-xs font-semibold tracking-[0.28em] uppercase mb-6">
          Viaje Familia Suárez · Colombia
        </p>

        <h1 className="font-body font-extrabold leading-[0.95] mb-7 tracking-wide">
          <span className="block text-white" style={{ fontSize: 'clamp(3rem, 10vw, 6.5rem)' }}>
            SANTA
          </span>
          <span className="block text-papaya" style={{ fontSize: 'clamp(3rem, 10vw, 6.5rem)' }}>
            MARTA
          </span>
        </h1>

        <div className="inline-flex items-center gap-2.5 bg-white/10 border border-white/15 rounded-full px-5 py-2.5 mb-8">
          <Calendar size={14} className="text-white/50" />
          <span className="font-body font-semibold text-white text-sm md:text-base">
            4 — 7 Septiembre 2026
          </span>
          <span className="text-white/35 text-xs hidden sm:inline">· 3 noches</span>
        </div>

        {/* Countdown — uses mounted to avoid SSR hydration mismatch */}
        <div className="mb-8">
          <p className="font-body text-white/35 text-[11px] uppercase tracking-[0.2em] mb-4">Faltan</p>
          <div className="flex items-start justify-center gap-3 md:gap-5">
            {units.map((unit, i) => (
              <div key={unit.label} className="flex items-start gap-3 md:gap-5">
                <div className="text-center min-w-[52px] md:min-w-[68px]">
                  <div
                    className="tabular font-display font-black text-white leading-none"
                    style={{ fontSize: 'clamp(2rem, 6.5vw, 3.8rem)' }}
                  >
                    {mounted ? String(unit.value).padStart(2, '0') : '--'}
                  </div>
                  <div className="font-body text-white/30 text-[10px] md:text-[11px] mt-1.5 uppercase tracking-wider">
                    {unit.label}
                  </div>
                </div>
                {i < 3 && (
                  <span
                    className="font-display font-black text-white/15 leading-none select-none"
                    style={{ fontSize: 'clamp(1.6rem, 5vw, 3rem)', marginTop: '2px' }}
                  >:</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats pills */}
        {totalCount > 0 && (
          <div className="flex flex-wrap gap-2.5 justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-jade/20 border border-jade/25 rounded-full px-4 py-2">
              <Users size={13} className="text-jade" />
              <span className="font-body font-semibold text-jade text-sm">
                {confirmedCount === 0
                  ? 'Nadie confirmado aún'
                  : `${confirmedCount} de ${totalCount} confirmados`}
              </span>
            </div>


{confirmedCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2">
                <ClipboardCheck size={13} className="text-white/60" />
                <span className="font-body font-semibold text-white/70 text-sm">
                  Datos {dataCompletion}% completos
                </span>
              </div>
            )}
          </div>
        )}

        <div>
          <a
            href="#quienes"
            className="inline-flex items-center gap-2 bg-papaya hover:bg-papaya-dark text-white font-body font-bold px-7 py-3.5 rounded-xl text-base md:text-lg transition-all duration-200 hover:scale-[1.03] focus-visible:outline-2"
          >
            Ver quiénes van
            <ChevronDown size={18} />
          </a>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 1440 56" preserveAspectRatio="none" className="w-full block" style={{ height: '44px' }}>
          <path d="M0,56 C300,8 600,48 900,20 C1100,0 1280,38 1440,14 L1440,56 Z" fill="#F7F3EE" />
        </svg>
      </div>
    </section>
  );
}
