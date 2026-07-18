'use client';

import { useState } from 'react';
import { Trophy, Plus } from 'lucide-react';
import { Accommodation, FamilyMemberWithDetails, AccommodationVote } from '@/types';
import { useIdentity } from '@/contexts/IdentityContext';
import AccommodationCard from './AccommodationCard';
import CostCalculator from './CostCalculator';
import VoteModal from './VoteModal';
import AddAccommodationModal from './AddAccommodationModal';

interface AccommodationSectionProps {
  confirmedCount: number;
  accommodations: Accommodation[];
  members: FamilyMemberWithDetails[];
  votes: AccommodationVote[];
  onVoteChange: () => void;
  onAccommodationsChange: () => void;
}

export default function AccommodationSection({
  confirmedCount, accommodations, members, votes, onVoteChange, onAccommodationsChange,
}: AccommodationSectionProps) {
  const { currentMemberId } = useIdentity();
  const [voteModalId,  setVoteModalId]  = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const voteCounts: Record<string, number> = {};
  votes.forEach((v) => { voteCounts[v.accommodation_id] = (voteCounts[v.accommodation_id] ?? 0) + 1; });

  const maxVotes   = Math.max(0, ...Object.values(voteCounts));
  const topVotedId = maxVotes > 0
    ? Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;
  const totalVotes  = votes.length;
  const userVotedAccId = currentMemberId
    ? votes.find((v) => v.member_id === currentMemberId)?.accommodation_id ?? null
    : null;

  const currentMember = members.find((m) => m.id === currentMemberId) ?? null;
  const voteModalAcc  = voteModalId ? accommodations.find((a) => a.id === voteModalId) : null;

  const sortedForChart = [...accommodations]
    .map((a) => ({ ...a, count: voteCounts[a.id] ?? 0 }))
    .sort((a, b) => b.count - a.count);

  return (
    <section id="alojamiento" className="bg-sand py-16 md:py-20 px-5 md:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="font-body text-papaya text-[11px] font-bold tracking-[0.22em] uppercase mb-3">
            Dónde dormir
          </p>
          <h2
            className="font-display font-extrabold text-ink mb-3"
            style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3rem)' }}
          >
            Alojamiento
          </h2>
          <p className="font-body text-mist text-base max-w-md mx-auto leading-relaxed">
            Opciones para el 4 al 7 de septiembre.
            Vota por tu favorita — <strong className="text-ink">un solo voto por persona.</strong>
          </p>
        </div>

        {/* ── RANKING COMPACTO ── */}
        <div className="bg-bay rounded-2xl px-5 py-4 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Trophy + title */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-papaya/20 rounded-xl flex items-center justify-center">
              <Trophy size={15} className="text-papaya" />
            </div>
            <div>
              <p className="font-body text-[10px] font-bold text-white/40 uppercase tracking-wider leading-none mb-0.5">
                Ranking
              </p>
              <p className="font-body text-xs text-white/60">
                {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'} de {members.length}
              </p>
            </div>
          </div>

          {/* Bars */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            {totalVotes > 0 ? (
              sortedForChart.map((a, i) => {
                const pct        = maxVotes > 0 ? (a.count / maxVotes) * 100 : 0;
                const isTop      = a.id === topVotedId;
                const isUserVote = a.id === userVotedAccId;
                return (
                  <div key={a.id} className="flex items-center gap-2">
                    <span className={`font-body text-[11px] w-5 flex-shrink-0 text-center font-bold ${isTop ? 'text-papaya' : 'text-white/30'}`}>
                      {i + 1}
                    </span>
                    <span className={`font-body text-[11px] w-24 sm:w-32 truncate flex-shrink-0 ${isTop ? 'text-white font-semibold' : 'text-white/50'}`}>
                      {a.name.split(' · ')[0]}
                      {isUserVote && <span className="text-papaya"> ·tú</span>}
                    </span>
                    <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isTop ? 'bg-papaya' : 'bg-white/20'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`font-body text-[11px] font-bold w-5 text-right flex-shrink-0 tabular-nums ${isTop ? 'text-papaya' : 'text-white/30'}`}>
                      {a.count}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="font-body text-white/30 text-xs">
                Sé el primero en votar — un voto por persona.
              </p>
            )}
          </div>
        </div>

        {/* Cards grid — items-stretch makes all cells same height; cards use h-full internally */}
        {accommodations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10 items-stretch">
            {accommodations.map((acc) => (
              <AccommodationCard
                key={acc.id}
                accommodation={acc}
                confirmedCount={confirmedCount}
                voteCount={voteCounts[acc.id] ?? 0}
                topVoted={acc.id === topVotedId && maxVotes > 0}
                userVoted={acc.id === userVotedAccId}
                hasVotedElsewhere={!!userVotedAccId && acc.id !== userVotedAccId}
                onVote={() => setVoteModalId(acc.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 mb-10">
            <p className="font-body text-mist text-sm">No hay alojamientos aún. ¡Sé el primero en sugerir uno!</p>
          </div>
        )}

        {/* Add accommodation button */}
        <div className="text-center mb-14">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-white hover:bg-bay-light border-2 border-bay-light hover:border-bay-mid/40 text-bay-mid font-body font-bold px-5 py-3 rounded-xl transition-all text-sm"
          >
            <Plus size={16} strokeWidth={2.5} />
            Sugerir otro alojamiento
          </button>
        </div>

        {/* Cost calculator */}
        <CostCalculator confirmedCount={confirmedCount} accommodations={accommodations} />
      </div>

      {/* Vote modal */}
      {voteModalId && voteModalAcc && (
        <VoteModal
          accommodationId={voteModalId}
          accommodationName={voteModalAcc.name}
          members={members}
          votes={votes}
          onClose={() => setVoteModalId(null)}
          onVoted={() => { onVoteChange(); }}
        />
      )}

      {/* Add modal */}
      {showAddModal && (
        <AddAccommodationModal
          currentMember={currentMember}
          onClose={() => setShowAddModal(false)}
          onAdded={onAccommodationsChange}
        />
      )}
    </section>
  );
}
