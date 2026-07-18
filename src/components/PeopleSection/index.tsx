'use client';

import { useState } from 'react';
import { UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { FamilyMemberWithDetails } from '@/types';
import { useIdentity } from '@/contexts/IdentityContext';
import PersonCard from './PersonCard';
import AddPersonModal from './AddPersonModal';

interface PeopleSectionProps {
  members: FamilyMemberWithDetails[];
  loading: boolean;
  onMembersChange: () => void;
}

export default function PeopleSection({ members, loading, onMembersChange }: PeopleSectionProps) {
  const { currentMemberId } = useIdentity();
  const [showModal,  setShowModal]  = useState(false);
  const [showOthers, setShowOthers] = useState(false);

  const confirmed = members.filter((m) => m.is_confirmed).length;

  const currentMember = members.find((m) => m.id === currentMemberId) ?? null;
  const others        = members.filter((m) => m.id !== currentMemberId);

  // Desktop: keep original order with current user first
  const allSorted = currentMemberId
    ? [...members].sort((a, b) => (b.id === currentMemberId ? 1 : 0) - (a.id === currentMemberId ? 1 : 0))
    : members;

  return (
    <section id="quienes" className="bg-sand py-16 md:py-20 px-5 md:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="font-body text-papaya text-[11px] font-bold tracking-[0.22em] uppercase mb-3">
            El equipo viajero
          </p>
          <h2 className="font-display font-extrabold text-ink mb-3" style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3rem)' }}>
            ¿Quién viene?
          </h2>
          <p className="font-body text-mist text-base max-w-sm mx-auto leading-relaxed">
            Marca si vas al viaje para que podamos organizar todo.
          </p>

          {/* Progress bar */}
          {members.length > 0 && (
            <div className="mt-5 max-w-[260px] mx-auto">
              <div className="flex justify-between font-body text-xs text-mist mb-1.5">
                <span>{confirmed} confirmados</span>
                <span>{members.length - confirmed} pendientes</span>
              </div>
              <div className="h-2 bg-bay-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-jade rounded-full transition-all duration-700"
                  style={{ width: `${members.length ? (confirmed / members.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── MOBILE LAYOUT (hidden on md+) ── */}
        <div className="md:hidden mb-8">
          {loading ? (
            <div className="bg-white rounded-2xl h-[200px] animate-pulse ring-1 ring-bay-light mb-4" />
          ) : members.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-5xl mb-4">👨‍👩‍👧‍👦</p>
              <p className="font-body text-mist text-base mb-6">Agrega a los miembros de la familia.</p>
            </div>
          ) : (
            <>
              {/* Current user card — centered, single */}
              {currentMember && (
                <div className="max-w-[200px] mx-auto mb-5">
                  <PersonCard member={currentMember} onUpdate={onMembersChange} />
                </div>
              )}

              {/* Others toggle */}
              {others.length > 0 && (
                <div>
                  {/* Avatar pill row — preview of others */}
                  <button
                    onClick={() => setShowOthers((v) => !v)}
                    className="w-full flex items-center justify-between gap-3 bg-white border border-bay-light rounded-2xl px-4 py-3 transition-all hover:border-bay-mid/40 hover:shadow-sm active:scale-[0.99]"
                  >
                    <div className="text-left">
                      <p className="font-body font-bold text-ink text-sm leading-none mb-0.5">
                        {showOthers ? 'Ocultar familia' : 'Ver familia'}
                      </p>
                      <p className="font-body text-mist text-[11px]">
                        {others.length} {others.length === 1 ? 'persona' : 'personas'} · {confirmed} confirmadas
                      </p>
                    </div>
                    <div className={`w-7 h-7 bg-bay-light rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${showOthers ? 'rotate-180' : ''}`}>
                      <ChevronDown size={14} className="text-mist" />
                    </div>
                  </button>

                  {/* Expandable grid */}
                  <div
                    className={`grid grid-cols-2 gap-3 mt-3 overflow-hidden transition-all duration-500 ${
                      showOthers ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                  >
                    {others.map((m) => (
                      <PersonCard key={m.id} member={m} onUpdate={onMembersChange} />
                    ))}
                  </div>

                  {/* Collapse button (shown when expanded) */}
                  {showOthers && (
                    <button
                      onClick={() => setShowOthers(false)}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 text-mist font-body text-xs py-2 hover:text-ink transition-colors"
                    >
                      <ChevronUp size={13} /> Ocultar familia
                    </button>
                  )}
                </div>
              )}

              {/* If no current user, show all in grid */}
              {!currentMember && (
                <div className="grid grid-cols-2 gap-3">
                  {members.map((m) => (
                    <PersonCard key={m.id} member={m} onUpdate={onMembersChange} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── DESKTOP LAYOUT (hidden on mobile) ── */}
        <div className="hidden md:block mb-8">
          {loading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-[190px] animate-pulse ring-1 ring-bay-light" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-5xl mb-4">👨‍👩‍👧‍👦</p>
              <p className="font-body text-mist text-base mb-6">Agrega a los miembros de la familia para comenzar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allSorted.map((m) => (
                <PersonCard key={m.id} member={m} onUpdate={onMembersChange} />
              ))}
            </div>
          )}
        </div>

        {/* Add button */}
        <div className="text-center">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-bay hover:bg-bay-mid text-white font-body font-bold px-5 py-3 rounded-xl transition-colors text-sm md:text-base"
          >
            <UserPlus size={16} strokeWidth={2.5} />
            Agregar persona
          </button>
        </div>
      </div>

      {showModal && (
        <AddPersonModal
          nextOrder={members.length}
          onClose={() => setShowModal(false)}
          onAdded={onMembersChange}
        />
      )}
    </section>
  );
}
