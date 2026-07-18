'use client';

import { useState } from 'react';
import { MapPin, Users, ExternalLink, ThumbsUp, Check, Info, Maximize2 } from 'lucide-react';
import { Accommodation } from '@/types';
import { TRIP_NIGHTS } from '@/lib/data/accommodations';
import MediaModal from './MediaModal';

interface AccommodationCardProps {
  accommodation: Accommodation;
  confirmedCount: number;
  voteCount: number;
  topVoted: boolean;
  userVoted: boolean;
  hasVotedElsewhere: boolean;
  onVote: () => void;
}

function cop(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

function isVideo(url: string) {
  return /\.(mp4|webm|mov|avi|ogg)$/i.test(url.split('?')[0]);
}

const AMENITY_ICONS: Record<string, string> = {
  'WiFi': '📶', 'Piscina': '🏊', 'Piscina privada': '🏊', 'A/C': '❄️',
  'Cocina': '🍳', 'Cocina gourmet': '👨‍🍳', 'Parqueadero': '🚗',
  'BBQ': '🔥', 'TV': '📺', 'Balcón': '🌅', 'Vista al mar': '🌊',
  'Hamacas': '😴', 'Kayaks': '🛶', 'Patio colonial': '🌺',
  'Lavandería': '👕', 'Seguridad 24h': '🔒', '4 Alcobas': '🛏️',
  '3 Baños': '🚿', 'Salida a la playa': '🏖️',
};

export default function AccommodationCard({
  accommodation: acc,
  confirmedCount, voteCount, topVoted, userVoted, hasVotedElsewhere, onVote,
}: AccommodationCardProps) {
  const [showMedia, setShowMedia] = useState(false);

  const total     = acc.price_per_night * TRIP_NIGHTS;
  const perPerson = confirmedCount > 0 ? Math.ceil(total / confirmedCount) : null;
  const ppNight   = confirmedCount > 0 ? Math.ceil(acc.price_per_night / confirmedCount) : null;

  return (
    <>
      {/* Fixed height card — h-full fills grid cell so all cards in a row are equal */}
      <div className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col h-full ${
        userVoted
          ? 'ring-2 ring-jade shadow-md shadow-jade/10'
          : topVoted
          ? 'ring-2 ring-papaya/40 shadow-sm'
          : 'ring-1 ring-bay-light'
      }`}>

        {/* Media — fixed height 52, clickable */}
        <div
          className="relative h-52 flex-shrink-0 overflow-hidden bg-bay cursor-pointer group"
          onClick={() => acc.video_url && setShowMedia(true)}
        >
          {acc.video_url ? (
            isVideo(acc.video_url) ? (
              <video
                src={acc.video_url}
                autoPlay muted loop playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={acc.video_url} alt={acc.name} className="w-full h-full object-cover" loading="lazy" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">🏠</div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-bay/50 to-transparent" />

          {/* Expand hint */}
          {acc.video_url && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/50 backdrop-blur-sm rounded-full p-3">
                <Maximize2 size={20} className="text-white" />
              </div>
            </div>
          )}

          {/* "Tu voto" badge */}
          {userVoted && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-jade rounded-full px-3 py-1 shadow-sm">
              <Check size={10} className="text-white" strokeWidth={3} />
              <span className="font-body font-bold text-xs text-white">Tu voto</span>
            </div>
          )}

          {/* Vote count badge */}
          {voteCount > 0 && !userVoted && (
            <div className={`absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-3 py-1 shadow-sm ${
              topVoted ? 'bg-papaya text-white' : 'bg-white/90 backdrop-blur-sm'
            }`}>
              <ThumbsUp size={11} className={topVoted ? 'text-white' : 'text-mist'} />
              <span className={`font-body font-bold text-xs ${topVoted ? 'text-white' : 'text-ink'}`}>
                {voteCount} {voteCount === 1 ? 'voto' : 'votos'}
              </span>
              {topVoted && <span className="font-body text-[10px] text-white/80">· Favorito</span>}
            </div>
          )}

          {/* Added by */}
          {acc.added_by_name && (
            <div className="absolute bottom-3 left-3 bg-bay/80 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="font-body text-[11px] font-semibold text-white">Sugerido por {acc.added_by_name}</span>
            </div>
          )}
        </div>

        {/* Body — flex-1 fills remaining space, flex col to push actions to bottom */}
        <div className="flex-1 flex flex-col p-4 md:p-5">
          {/* Title + capacity */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-display font-bold text-ink text-base leading-tight">{acc.name}</h3>
            <span className="inline-flex items-center gap-1 font-body text-[11px] text-mist bg-bay-light px-2 py-1 rounded-lg whitespace-nowrap flex-shrink-0">
              <Users size={10} /> Máx {acc.max_guests}
            </span>
          </div>

          {/* Location */}
          <p className="inline-flex items-center gap-1 font-body text-xs text-mist mb-2.5">
            <MapPin size={11} /> {acc.location}
          </p>

          {/* Description — NO clamp, full text */}
          {acc.description && (
            <p className="font-body text-sm text-ink leading-relaxed mb-3">
              {acc.description}
            </p>
          )}

          {/* Amenities */}
          {acc.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {acc.amenities.slice(0, 5).map((a) => (
                <span key={a} className="font-body text-[11px] bg-bay-light text-bay-mid px-2 py-1 rounded-lg font-semibold">
                  {AMENITY_ICONS[a] ?? '•'} {a}
                </span>
              ))}
              {acc.amenities.length > 5 && (
                <span className="font-body text-[11px] text-mist self-center">+{acc.amenities.length - 5} más</span>
              )}
            </div>
          )}

          {/* Push pricing + actions to bottom */}
          <div className="mt-auto space-y-3">
            {/* Pricing */}
            <div className="border-t border-bay-light pt-3 space-y-1.5">
              <div className="flex justify-between">
                <span className="font-body text-xs text-mist">Por noche (grupo)</span>
                <span className="font-body font-semibold text-sm text-ink">{cop(acc.price_per_night)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-xs text-mist">{TRIP_NIGHTS} noches en total</span>
                <span className="font-body font-semibold text-sm text-ink">{cop(total)}</span>
              </div>

              {perPerson !== null && (
                <div className="bg-papaya-light rounded-xl p-3 mt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-body text-[11px] font-bold text-papaya-dark uppercase tracking-wide">Por persona</p>
                      <p className="font-body text-[11px] text-papaya-dark">
                        {confirmedCount} personas · {cop(ppNight!)}/noche
                      </p>
                    </div>
                    <p className="font-display font-extrabold text-papaya text-lg">{cop(perPerson)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {acc.notes && (
              <div className="bg-sand rounded-xl p-3 flex gap-2">
                <Info size={13} className="text-mist flex-shrink-0 mt-0.5" />
                <p className="font-body text-xs text-mist leading-relaxed">{acc.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={onVote}
                className={`flex-1 py-2.5 rounded-xl font-body font-bold text-sm transition-all inline-flex items-center justify-center gap-1.5 ${
                  userVoted
                    ? 'bg-jade text-white hover:bg-jade/85'
                    : hasVotedElsewhere
                    ? 'bg-bay-light text-mist hover:bg-bay-light/80 border border-bay-light'
                    : topVoted && voteCount > 0
                    ? 'bg-papaya text-white hover:bg-papaya-dark'
                    : 'bg-bay-light text-bay-mid hover:bg-bay-light/80 border border-bay-light'
                }`}
              >
                {userVoted ? <Check size={13} strokeWidth={2.5} /> : <ThumbsUp size={13} />}
                {userVoted
                  ? `Tu voto · ${voteCount} total`
                  : hasVotedElsewhere
                  ? 'Cambiar voto'
                  : voteCount > 0
                  ? `${voteCount} ${voteCount === 1 ? 'voto' : 'votos'}`
                  : 'Votar'}
              </button>
              {acc.external_url && (
                <a
                  href={acc.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center py-2.5 px-3.5 rounded-xl border-2 border-bay-light text-mist hover:bg-bay-light transition-colors"
                  title="Ver enlace"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Media fullscreen modal */}
      {showMedia && acc.video_url && (
        <MediaModal
          url={acc.video_url}
          title={acc.name}
          onClose={() => setShowMedia(false)}
        />
      )}
    </>
  );
}
