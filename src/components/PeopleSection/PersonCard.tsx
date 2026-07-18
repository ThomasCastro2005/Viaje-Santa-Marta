'use client';

import { useState } from 'react';
import { Check, Plane, Clock, X, Undo2 } from 'lucide-react';
import { FamilyMember } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { useIdentity } from '@/contexts/IdentityContext';

interface PersonCardProps {
  member: FamilyMember;
  onUpdate: () => void;
}

async function fireConfetti() {
  const confetti = (await import('canvas-confetti')).default;
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#F4823A', '#2DB87A', '#1A6B7C', '#FFD700', '#ffffff'] });
  setTimeout(() => {
    confetti({ particleCount: 50, angle: 60, spread: 50, origin: { x: 0, y: 0.65 }, colors: ['#F4823A', '#FFD700'] });
    confetti({ particleCount: 50, angle: 120, spread: 50, origin: { x: 1, y: 0.65 }, colors: ['#2DB87A', '#FFD700'] });
  }, 180);
}

export default function PersonCard({ member, onUpdate }: PersonCardProps) {
  const { currentMemberId } = useIdentity();
  const [loading,     setLoading]     = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);

  const isCurrentUser = currentMemberId === member.id;
  const isDeclined    = member.is_declined && !member.is_confirmed;

  async function setStatus(confirmed: boolean, declined: boolean) {
    if (!isCurrentUser) {
      setShowBlocked(true);
      setTimeout(() => setShowBlocked(false), 2800);
      return;
    }
    setLoading(true);
    await supabase
      .from('family_members')
      .update({ is_confirmed: confirmed, is_declined: declined })
      .eq('id', member.id);
    if (confirmed) fireConfetti();
    onUpdate();
    setLoading(false);
  }

  // Status label + color
  const statusConfig = member.is_confirmed
    ? { label: 'Confirmado', icon: <Plane size={10} strokeWidth={2.5} />, cls: 'bg-jade-light text-jade' }
    : isDeclined
    ? { label: 'No va',      icon: <X    size={10} strokeWidth={2.5} />, cls: 'bg-red-50 text-red-400' }
    : { label: 'Pendiente',  icon: <Clock size={10} strokeWidth={2.5} />, cls: 'bg-bay-light text-mist' };

  return (
    <div
      className={`relative bg-white rounded-2xl p-4 md:p-5 transition-all duration-300 hover:shadow-md flex flex-col items-center gap-3 ${
        member.is_confirmed
          ? 'ring-2 ring-jade shadow-sm shadow-jade/10'
          : isDeclined
          ? 'ring-2 ring-red-200'
          : 'ring-1 ring-bay-light hover:ring-bay-mid/30'
      }`}
    >
      {/* Top badge */}
      {member.is_confirmed && !showBlocked && (
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-jade rounded-full flex items-center justify-center shadow z-10">
          <Check size={10} className="text-white" strokeWidth={3} />
        </span>
      )}
      {isDeclined && !showBlocked && (
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-400 rounded-full flex items-center justify-center shadow z-10">
          <X size={10} className="text-white" strokeWidth={3} />
        </span>
      )}

      {/* Blocked overlay */}
      {showBlocked && (
        <div className="absolute inset-0 bg-white/97 rounded-2xl flex flex-col items-center justify-center gap-2 p-4 z-20 text-center">
          <span className="text-3xl leading-none">{member.avatar}</span>
          <p className="font-body text-sm text-ink font-semibold leading-snug">
            Solo <span className="text-bay font-bold">{member.name}</span> puede<br />
            confirmar su asistencia
          </p>
          <p className="font-body text-[11px] text-mist leading-snug">
            {member.name} debe decidir si va o no al viaje.
          </p>
        </div>
      )}

      {/* Avatar */}
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl leading-none ${
        isDeclined ? 'bg-red-50 opacity-60' : 'bg-bay-light'
      }`}>
        {member.avatar}
      </div>

      {/* Name */}
      <p className={`font-display font-bold text-sm md:text-base text-center leading-tight ${
        isDeclined ? 'text-mist' : 'text-ink'
      }`}>
        {member.name}
      </p>

      {/* Status */}
      <span className={`inline-flex items-center gap-1 font-body text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusConfig.cls}`}>
        {statusConfig.icon} {statusConfig.label}
      </span>

      {/* Actions — solo para el usuario logueado */}
      {isCurrentUser && (
        member.is_confirmed ? (
          <button
            onClick={() => setStatus(false, false)}
            disabled={loading}
            className="w-full mt-0.5 py-2 px-3 rounded-xl text-xs font-body font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 bg-red-50 text-red-400 hover:bg-red-100 border border-red-100"
          >
            {loading ? '…' : <><X size={11} strokeWidth={2.5} /> No puedo ir</>}
          </button>
        ) : isDeclined ? (
          <button
            onClick={() => setStatus(false, false)}
            disabled={loading}
            className="w-full mt-0.5 py-2 px-3 rounded-xl text-xs font-body font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 bg-bay-light text-mist hover:bg-bay-light/70"
          >
            {loading ? '…' : <><Undo2 size={11} strokeWidth={2.5} /> Cambié de opinión</>}
          </button>
        ) : (
          <div className="flex flex-col gap-1.5 w-full mt-0.5">
            <button
              onClick={() => setStatus(true, false)}
              disabled={loading}
              className="w-full py-2 px-2 rounded-xl text-xs font-body font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1 bg-papaya text-white hover:bg-papaya-dark"
            >
              {loading ? '…' : <><Plane size={10} strokeWidth={2.5} /> ¡Voy!</>}
            </button>
            <button
              onClick={() => setStatus(false, true)}
              disabled={loading}
              className="w-full py-2 px-2 rounded-xl text-xs font-body font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1 bg-bay-light text-mist hover:bg-red-50 hover:text-red-400 border border-bay-light"
            >
              {loading ? '…' : <><X size={10} strokeWidth={2.5} /> No voy</>}
            </button>
          </div>
        )
      )}
    </div>
  );
}
