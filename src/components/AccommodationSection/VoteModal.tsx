'use client';

import { useState } from 'react';
import { X, Check, ThumbsUp, Sparkles } from 'lucide-react';
import { FamilyMemberWithDetails, AccommodationVote } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { useIdentity } from '@/contexts/IdentityContext';

interface VoteModalProps {
  accommodationId: string;
  accommodationName: string;
  members: FamilyMemberWithDetails[];
  votes: AccommodationVote[];
  onClose: () => void;
  onVoted: () => void;
}

async function fireConfetti() {
  const confetti = (await import('canvas-confetti')).default;
  confetti({ particleCount: 140, spread: 90, origin: { y: 0.55 }, colors: ['#F4823A', '#2DB87A', '#1A6B7C', '#FFD700', '#FF6B6B', '#ffffff'], scalar: 1.1 });
  setTimeout(() => {
    confetti({ particleCount: 60, angle: 60,  spread: 55, origin: { x: 0, y: 0.6 }, colors: ['#F4823A', '#FFD700', '#2DB87A'] });
    confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ['#F4823A', '#FFD700', '#2DB87A'] });
  }, 200);
}

export default function VoteModal({
  accommodationId, accommodationName,
  members, votes,
  onClose, onVoted,
}: VoteModalProps) {
  const { currentMemberId } = useIdentity();
  const [loading,   setLoading]   = useState(false);
  const [justVoted, setJustVoted] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  const voteByMember: Record<string, string> = {};
  votes.forEach((v) => { voteByMember[v.member_id] = v.accommodation_id; });

  const currentMember    = members.find((m) => m.id === currentMemberId);
  const currentUserVoted = currentMemberId ? voteByMember[currentMemberId] === accommodationId : false;
  const votedElsewhere   = !!(currentMemberId && voteByMember[currentMemberId] && !currentUserVoted);

  const votersHere = members
    .filter((m) => voteByMember[m.id] === accommodationId)
    .sort((a, b) => (b.id === currentMemberId ? 1 : 0) - (a.id === currentMemberId ? 1 : 0));

  async function castVote() {
    if (!currentMemberId) return;
    setLoading(true);
    setVoteError(null);

    // 1. Delete existing vote
    const { error: delErr } = await supabase
      .from('accommodation_votes')
      .delete()
      .eq('member_id', currentMemberId);

    if (delErr) {
      setVoteError(`Error al preparar voto: ${delErr.message}`);
      setLoading(false);
      return;
    }

    // 2. Insert new vote (if not un-voting)
    if (!currentUserVoted) {
      const { error: insErr } = await supabase
        .from('accommodation_votes')
        .insert({ member_id: currentMemberId, accommodation_id: accommodationId });

      if (insErr) {
        setVoteError(`Error al guardar voto: ${insErr.message}`);
        setLoading(false);
        return;
      }

      setJustVoted(true);
      fireConfetti();
      setTimeout(() => setJustVoted(false), 2500);
    }

    onVoted();
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Same dark bay style as WelcomeScreen */}
      <div
        className="bg-bay w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-body text-white/40 text-[11px] font-bold tracking-[0.22em] uppercase mb-1">
                Votar por alojamiento
              </p>
              <h3 className="font-display font-bold text-white text-lg leading-tight">
                {accommodationName}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex-shrink-0 bg-white/10 hover:bg-white/15 rounded-xl flex items-center justify-center transition-colors mt-0.5"
            >
              <X size={15} className="text-white/60" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Error display */}
          {voteError && (
            <div className="bg-red-500/15 border border-red-400/30 rounded-2xl px-4 py-3">
              <p className="font-body text-red-300 text-xs leading-relaxed">{voteError}</p>
            </div>
          )}

          {/* Current user section */}
          {currentMember ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl leading-none flex-shrink-0">
                  {currentMember.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-white text-base leading-none">
                    {currentMember.name}
                  </p>
                  <p className="font-body text-white/45 text-xs mt-1">
                    {currentUserVoted
                      ? '¡Ya votaste por este alojamiento!'
                      : votedElsewhere
                      ? 'Tu voto actual cambiará'
                      : 'Aún no has votado'}
                  </p>
                </div>
                {currentUserVoted && (
                  <span className="w-7 h-7 bg-jade rounded-full flex items-center justify-center flex-shrink-0">
                    <Check size={13} className="text-white" strokeWidth={3} />
                  </span>
                )}
              </div>

              {justVoted ? (
                <div className="w-full py-3.5 rounded-2xl bg-jade/20 border border-jade/30 text-jade font-display font-bold text-base flex items-center justify-center gap-2">
                  <Sparkles size={16} /> ¡Voto registrado!
                </div>
              ) : (
                <button
                  onClick={castVote}
                  disabled={loading}
                  className={`w-full py-3.5 rounded-2xl font-display font-bold text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] ${
                    currentUserVoted
                      ? 'bg-white/10 hover:bg-white/15 text-white/60 border border-white/10'
                      : 'bg-papaya hover:bg-papaya-dark text-white shadow-lg shadow-papaya/20'
                  }`}
                >
                  {loading ? '…' : currentUserVoted
                    ? 'Quitar mi voto'
                    : <><ThumbsUp size={16} /> ¡Votar por este!</>}
                </button>
              )}
            </div>
          ) : (
            <p className="font-body text-white/40 text-sm text-center py-2">
              Selecciona tu perfil para votar
            </p>
          )}

          {/* Voters list */}
          <div className="border-t border-white/10 pt-4">
            <p className="font-body text-[11px] font-bold text-white/40 uppercase tracking-wider mb-3">
              {votersHere.length} {votersHere.length === 1 ? 'voto' : 'votos'} aquí
            </p>
            {votersHere.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {votersHere.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 border ${
                      m.id === currentMemberId
                        ? 'bg-papaya/20 border-papaya/30 text-white'
                        : 'bg-white/8 border-white/10 text-white/70'
                    }`}
                  >
                    <span className="text-base leading-none">{m.avatar}</span>
                    <span className="font-body font-semibold text-sm">{m.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-body text-white/30 text-sm">
                Nadie ha votado aquí aún. ¡Sé el primero!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
