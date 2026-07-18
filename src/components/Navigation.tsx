'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, X, Plane, LogOut } from 'lucide-react';
import { FamilyMemberWithDetails } from '@/types';

interface NavigationProps {
  confirmedCount: number;
  totalCount: number;
  currentMember?: FamilyMemberWithDetails | null;
  onSwitchIdentity?: () => void;
}

const LINKS = [
  { href: '#quienes',     label: '¿Quién viene?',  section: 'quienes'     },
  { href: '#datos',       label: 'Datos del viaje', section: 'datos'       },
  { href: '#alojamiento', label: 'Alojamiento',     section: 'alojamiento' },
];

export default function Navigation({
  confirmedCount, currentMember, onSwitchIdentity,
}: NavigationProps) {
  const [scrolled,       setScrolled]       = useState(false);
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [activeSection,  setActiveSection]  = useState('');
  const [mounted,        setMounted]        = useState(false);
  const prevCount = useRef(confirmedCount);
  const [countBump, setCountBump] = useState(false);

  // Entry animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  // Bump animation when confirmedCount changes
  useEffect(() => {
    if (prevCount.current !== confirmedCount) {
      setCountBump(true);
      const t = setTimeout(() => setCountBump(false), 600);
      prevCount.current = confirmedCount;
      return () => clearTimeout(t);
    }
  }, [confirmedCount]);

  // Scroll-based background
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Active section via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    LINKS.forEach(({ section }) => {
      const el = document.getElementById(section);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(section); },
        { rootMargin: '-30% 0px -55% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-bay shadow-xl shadow-black/20' : 'bg-bay/80 backdrop-blur-md'
      } ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
      style={{ transition: 'transform 0.45s cubic-bezier(0.34,1.26,0.64,1), opacity 0.4s ease, background 0.3s ease, box-shadow 0.3s ease' }}
    >
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-3.5 flex items-center justify-between gap-4">

        {/* Brand */}
        <a
          href="#top"
          className="flex items-center gap-2 text-white shrink-0 group"
        >
          <div className="w-7 h-7 bg-papaya/20 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:bg-papaya/35 group-hover:scale-110">
            <Plane size={14} className="text-papaya transition-transform duration-300 group-hover:rotate-12" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-base text-white leading-none">
            Santa Marta
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {LINKS.map((l) => {
            const isActive = activeSection === l.section;
            return (
              <a
                key={l.href}
                href={l.href}
                className="relative font-body text-sm font-semibold transition-colors duration-200 pb-0.5 group"
                style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.6)' }}
              >
                {l.label}
                {/* Animated underline */}
                <span
                  className={`absolute bottom-0 left-0 h-[2px] bg-papaya rounded-full transition-all duration-300 ${
                    isActive ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-60'
                  }`}
                />
              </a>
            );
          })}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Current user pill (desktop) */}
          {currentMember && (
            <button
              onClick={onSwitchIdentity}
              className="hidden sm:flex items-center gap-1.5 bg-white/10 hover:bg-white/18 border border-white/15 hover:border-white/25 rounded-full pl-2 pr-3 py-1.5 transition-all duration-200 hover:scale-[1.03]"
              title="Cambiar de perfil"
            >
              <span className="text-base leading-none">{currentMember.avatar}</span>
              <span className="font-body text-xs font-semibold text-white leading-none">
                {currentMember.name}
              </span>
              <span className="font-body text-[10px] text-white/40 leading-none">· Cambiar</span>
            </button>
          )}

          {/* Confirmed count badge — bumps on change */}
          <div
            className={`flex items-center gap-1.5 bg-papaya text-white px-3 py-1.5 rounded-full text-xs font-body font-bold transition-all duration-300 ${
              countBump ? 'scale-110 shadow-lg shadow-papaya/40' : 'scale-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-dot inline-block" />
            {confirmedCount} {confirmedCount === 1 ? 'va' : 'van'}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 transition-all duration-200 active:scale-90"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <span
              className="transition-all duration-300"
              style={{ transform: menuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown — animated */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-bay border-t border-white/10 px-5 py-4 flex flex-col gap-1">
          {LINKS.map((l, i) => {
            const isActive = activeSection === l.section;
            return (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`font-body text-base font-semibold py-2.5 transition-all duration-200 flex items-center gap-2 ${
                  isActive ? 'text-white' : 'text-white/65 hover:text-white'
                }`}
                style={{
                  transitionDelay: menuOpen ? `${i * 40}ms` : '0ms',
                  transform: menuOpen ? 'translateX(0)' : 'translateX(-8px)',
                }}
              >
                {isActive && <span className="w-1 h-4 bg-papaya rounded-full flex-shrink-0" />}
                {l.label}
              </a>
            );
          })}

          {/* Current user in mobile menu */}
          {currentMember && (
            <div className="mt-2 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{currentMember.avatar}</span>
                <span className="font-body text-sm font-semibold text-white">{currentMember.name}</span>
              </div>
              <button
                onClick={() => { setMenuOpen(false); onSwitchIdentity?.(); }}
                className="flex items-center gap-2 font-body text-sm text-white/50 hover:text-white transition-colors py-1"
              >
                <LogOut size={14} />
                Cambiar de persona
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
