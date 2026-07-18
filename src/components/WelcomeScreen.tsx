'use client';

import { useState, useRef, useEffect } from 'react';
import { Plane, Search, Check, ChevronDown, X } from 'lucide-react';
import { FamilyMemberWithDetails } from '@/types';

interface WelcomeScreenProps {
  members: FamilyMemberWithDetails[];
  onSelect: (id: string) => void;
}

export default function WelcomeScreen({ members, onSelect }: WelcomeScreenProps) {
  const [selected,  setSelected]  = useState('');
  const [open,      setOpen]      = useState(false);
  const [search,    setSearch]    = useState('');
  const [leaving,   setLeaving]   = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);

  const selectedMember = members.find((m) => m.id === selected);

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  function pick(id: string) {
    setSelected(id);
    setOpen(false);
    setSearch('');
  }

  function handleConfirm() {
    if (!selected) return;
    setLeaving(true);
    setTimeout(() => onSelect(selected), 350);
  }

  return (
    <div className="min-h-screen bg-bay flex flex-col items-center justify-center px-5 py-16 relative overflow-hidden">
      <span className="absolute top-16 -left-8 text-[160px] leading-none select-none opacity-[0.05] pointer-events-none hidden md:block" aria-hidden="true">🌴</span>
      <span className="absolute bottom-16 -right-6 text-[130px] leading-none select-none opacity-[0.05] pointer-events-none hidden md:block" aria-hidden="true">🌴</span>

      <div
        className="relative z-10 w-full max-w-sm"
        style={{
          opacity: leaving ? 0 : 1,
          transform: leaving ? 'translateY(12px) scale(0.96)' : 'translateY(0) scale(1)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-papaya/20 rounded-2xl flex items-center justify-center">
            <Plane size={22} className="text-papaya" strokeWidth={2.5} />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <p className="font-body text-white/40 text-xs font-bold tracking-[0.28em] uppercase mb-4">
            Viaje Familia Suárez · Santa Marta 2026
          </p>
          <h1
            className="font-display font-black text-white leading-[0.95] mb-3"
            style={{ fontSize: 'clamp(2rem, 7vw, 3.2rem)' }}
          >
            Para empezar,<br />
            <span className="text-papaya">¿quién eres?</span>
          </h1>
          <p className="font-body text-white/50 text-sm leading-relaxed">
            Selecciona tu nombre para acceder al viaje
          </p>
        </div>

        {/* Combobox */}
        <div ref={containerRef} className="relative mb-4">

          {/* Trigger */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={`w-full flex items-center gap-3 bg-white/10 border-2 rounded-2xl px-4 py-3.5 text-left transition-colors focus:outline-none ${
              open
                ? 'border-papaya/60 bg-white/15'
                : selectedMember
                ? 'border-papaya/40 hover:border-papaya/60'
                : 'border-white/15 hover:border-white/25'
            }`}
          >
            {selectedMember ? (
              <>
                <span className="text-2xl leading-none flex-shrink-0">{selectedMember.avatar}</span>
                <span className="flex-1 font-body font-semibold text-white text-base truncate">
                  {selectedMember.name}
                </span>
              </>
            ) : (
              <span className="flex-1 font-body text-white/40 text-base">
                — Selecciona tu nombre —
              </span>
            )}
            <ChevronDown
              size={16}
              className={`flex-shrink-0 text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown panel */}
          {open && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-bay rounded-2xl shadow-2xl shadow-black/40 border border-white/10 overflow-hidden z-50">

              {/* Search input */}
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5">
                  <Search size={14} className="text-white/40 flex-shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar nombre…"
                    className="flex-1 bg-transparent font-body text-white text-sm placeholder-white/30 focus:outline-none"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="text-white/30 hover:text-white/60 transition-colors">
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Options list */}
              <div className="max-h-60 overflow-y-auto overscroll-contain">
                {filtered.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="font-body text-white/30 text-sm">No se encontró &ldquo;{search}&rdquo;</p>
                  </div>
                ) : (
                  filtered.map((m) => {
                    const isSelected = m.id === selected;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => pick(m.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? 'bg-papaya/20 text-white'
                            : 'hover:bg-white/8 text-white/80 hover:text-white'
                        }`}
                      >
                        <span className="text-xl leading-none flex-shrink-0">{m.avatar}</span>
                        <span className="flex-1 font-body font-semibold text-sm truncate">{m.name}</span>
                        {isSelected && (
                          <Check size={14} className="text-papaya flex-shrink-0" strokeWidth={2.5} />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!selected || leaving}
          className="w-full py-4 rounded-2xl font-display font-bold text-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-papaya hover:bg-papaya-dark text-white shadow-lg shadow-papaya/20 active:scale-[0.98]"
        >
          {selectedMember
            ? `Soy ${selectedMember.name} — Continuar`
            : 'Selecciona tu nombre para continuar'}
        </button>

        <p className="font-body text-white/25 text-xs text-center mt-4">
          Tu selección se guarda en este dispositivo. Puedes cambiarla desde el menú.
        </p>
      </div>
    </div>
  );
}
