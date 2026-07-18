'use client';

import { CheckCircle2, FileText } from 'lucide-react';
import { FamilyMemberWithDetails } from '@/types';
import TravelerForm from './TravelerForm';

interface TravelerSectionProps {
  members: FamilyMemberWithDetails[];
  onUpdate: () => void;
}

export default function TravelerSection({ members, onUpdate }: TravelerSectionProps) {
  const completed = members.filter((m) => m.traveler_details?.completed).length;
  const allDone   = completed === members.length && members.length > 0;

  return (
    <section id="datos" className="bg-bay-light py-16 md:py-20 px-5 md:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="font-body text-papaya text-[11px] font-bold tracking-[0.22em] uppercase mb-3">
            Tiquetes aéreos
          </p>
          <h2 className="font-display font-extrabold text-ink mb-3" style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3rem)' }}>
            Datos del viaje
          </h2>
          <p className="font-body text-mist text-base max-w-md mx-auto leading-relaxed">
            Necesitamos esta información para comprar los tiquetes.
            Cada viajero llena sus propios datos.
          </p>

          <div className={`mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2 font-body text-sm font-semibold ${
            allDone ? 'bg-jade text-white' : 'bg-white text-ink shadow-sm'
          }`}>
            {allDone
              ? <><CheckCircle2 size={14} /> ¡Todos los datos están listos!</>
              : <><FileText size={14} className="text-mist" /> {completed} de {members.length} completados</>
            }
          </div>
        </div>

        <div className="space-y-3">
          {members.map((m) => (
            <TravelerForm key={m.id} member={m} onUpdate={onUpdate} />
          ))}
        </div>

        <div className="mt-5 bg-white rounded-2xl p-4 border border-bay-light">
          <p className="font-body text-sm text-mist flex gap-2 leading-relaxed">
            <span className="flex-shrink-0 text-bay-mid">ℹ</span>
            <span>
              Los campos marcados con * son obligatorios para la compra del tiquete.
              Esta información es confidencial y solo la ven los organizadores del viaje.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
