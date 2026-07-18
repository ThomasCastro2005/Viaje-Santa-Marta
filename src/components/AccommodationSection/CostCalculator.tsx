'use client';

import { useState, useRef, useEffect } from 'react';
import { Calculator, Users, Minus, Plus, ChevronDown, Check } from 'lucide-react';
import { Accommodation } from '@/types';
import { TRIP_NIGHTS } from '@/lib/data/accommodations';

interface CostCalculatorProps {
  confirmedCount: number;
  accommodations: Accommodation[];
}

function cop(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

export default function CostCalculator({ confirmedCount, accommodations }: CostCalculatorProps) {
  const [selectedAccId, setSelectedAccId] = useState(accommodations[0]?.id ?? '');
  const [customCount,   setCustomCount]   = useState(Math.max(confirmedCount, 1));
  const [dropOpen,      setDropOpen]      = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const acc   = accommodations.find((a) => a.id === selectedAccId) ?? accommodations[0] ?? null;
  if (!acc) return null;
  const total = acc.price_per_night * TRIP_NIGHTS;

  const perPersonCustom    = Math.ceil(total / customCount);
  const ppNightCustom      = Math.ceil(acc.price_per_night / customCount);
  const perPersonConfirmed = confirmedCount > 0 ? Math.ceil(total / confirmedCount) : null;

  function decrement() { setCustomCount((n) => Math.max(1, n - 1)); }
  function increment() { setCustomCount((n) => Math.min(acc.max_guests, n + 1)); }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function pick(id: string) {
    setSelectedAccId(id);
    setDropOpen(false);
  }

  return (
    <div className="bg-bay rounded-3xl p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Calculator size={18} className="text-white/70" />
        </div>
        <div>
          <h3 className="font-display font-bold text-white text-lg leading-none">Calculadora de costos</h3>
          <p className="font-body text-white/40 text-xs mt-1">¿Cuánto paga cada uno?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">

          {/* Custom accommodation selector */}
          <div>
            <label className="font-body text-white/50 text-xs uppercase tracking-wider mb-2 block">
              Alojamiento
            </label>
            <div ref={dropRef} className="relative">
              {/* Trigger */}
              <button
                type="button"
                onClick={() => setDropOpen((o) => !o)}
                className={`w-full flex items-center gap-3 bg-white/10 border-2 rounded-2xl px-4 py-3 text-left transition-colors focus:outline-none ${
                  dropOpen ? 'border-papaya/50 bg-white/15' : 'border-white/15 hover:border-white/25'
                }`}
              >
                <span className="flex-1 font-body font-semibold text-white text-sm truncate">
                  {acc.name}
                </span>
                <ChevronDown
                  size={15}
                  className={`flex-shrink-0 text-white/40 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown */}
              {dropOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-bay-mid rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-30">
                  {accommodations.map((a) => {
                    const isSelected = a.id === selectedAccId;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => pick(a.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          isSelected ? 'bg-papaya/20 text-white' : 'hover:bg-white/8 text-white/75 hover:text-white'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-semibold text-sm leading-none truncate">{a.name}</p>
                          <p className="font-body text-[11px] text-white/40 mt-0.5">{cop(a.price_per_night)}/noche · máx {a.max_guests}</p>
                        </div>
                        {isSelected && <Check size={14} className="text-papaya flex-shrink-0" strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="font-body text-white/30 text-[11px] mt-1.5">
              {cop(acc.price_per_night)}/noche · máx {acc.max_guests} personas
            </p>
          </div>

          {/* Person count stepper */}
          <div>
            <label className="font-body text-white/50 text-xs uppercase tracking-wider mb-2 block">
              Número de personas
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={decrement}
                disabled={customCount <= 1}
                className="w-10 h-10 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl flex items-center justify-center transition-colors disabled:opacity-30"
              >
                <Minus size={16} className="text-white" />
              </button>
              <div className="flex-1 bg-white/10 border border-white/15 rounded-xl h-10 flex items-center justify-center">
                <span className="font-display font-black text-white text-xl tabular">{customCount}</span>
              </div>
              <button
                onClick={increment}
                disabled={customCount >= acc.max_guests}
                className="w-10 h-10 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl flex items-center justify-center transition-colors disabled:opacity-30"
              >
                <Plus size={16} className="text-white" />
              </button>
            </div>
            {confirmedCount > 0 && (
              <button
                onClick={() => setCustomCount(confirmedCount)}
                className="mt-2 font-body text-[11px] text-papaya/80 hover:text-papaya underline underline-offset-2 transition-colors"
              >
                Usar confirmados ({confirmedCount})
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3">
          <div className="bg-papaya/20 border border-papaya/25 rounded-2xl p-4">
            <p className="font-body text-[11px] font-bold text-papaya uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users size={11} /> Con {customCount} {customCount === 1 ? 'persona' : 'personas'}
            </p>
            <p className="font-display font-black text-papaya leading-none" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)' }}>
              {cop(perPersonCustom)}
            </p>
            <p className="font-body text-white/35 text-xs mt-1">
              por persona · {cop(ppNightCustom)}/noche
            </p>
            <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
              <div className="flex justify-between">
                <span className="font-body text-xs text-white/40">Noche</span>
                <span className="font-body text-xs font-semibold text-white/70">{cop(acc.price_per_night)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-xs text-white/40">× {TRIP_NIGHTS} noches</span>
                <span className="font-body text-xs font-semibold text-white/70">{cop(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-xs text-white/40">÷ {customCount} personas</span>
                <span className="font-body text-xs font-bold text-papaya">{cop(perPersonCustom)}</span>
              </div>
            </div>
          </div>

          {perPersonConfirmed !== null && confirmedCount !== customCount && (
            <div className="bg-jade/15 border border-jade/20 rounded-2xl p-4">
              <p className="font-body text-[11px] font-bold text-jade uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Users size={11} /> Con los {confirmedCount} confirmados
              </p>
              <p className="font-display font-black text-jade text-2xl leading-none">{cop(perPersonConfirmed)}</p>
              <p className="font-body text-white/35 text-xs mt-1">
                {cop(Math.ceil(acc.price_per_night / confirmedCount))}/noche
              </p>
            </div>
          )}

          {confirmedCount === 0 && (
            <div className="bg-white/5 rounded-2xl p-4">
              <p className="font-body text-white/30 text-sm text-center">
                Confirma quiénes van para ver el cálculo con los confirmados
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="font-body text-white/20 text-[11px] mt-5 text-center">
        No incluye tiquetes, transporte ni gastos personales.
      </p>
    </div>
  );
}
