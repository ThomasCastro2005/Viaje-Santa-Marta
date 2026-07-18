'use client';

import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const AVATARS = ['👦', '👧', '👨', '👩', '🧔', '👱', '👴', '👵', '🧒', '🧑', '👶', '🧓'];

interface AddPersonModalProps {
  nextOrder: number;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddPersonModal({ nextOrder, onClose, onAdded }: AddPersonModalProps) {
  const [name, setName]       = useState('');
  const [avatar, setAvatar]   = useState('👦');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Escribe el nombre de la persona.'); return; }
    setLoading(true);
    const { error: dbError } = await supabase
      .from('family_members')
      .insert({ name: trimmed, avatar, order_index: nextOrder });
    if (dbError) { setError('No se pudo guardar. Intenta de nuevo.'); setLoading(false); return; }
    onAdded();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-papaya-light rounded-xl flex items-center justify-center">
              <UserPlus size={15} className="text-papaya" strokeWidth={2.5} />
            </div>
            <h2 className="font-display font-bold text-ink text-lg">Agregar persona</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-bay-light hover:bg-bay-light/70 flex items-center justify-center text-mist transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="person-name" className="font-body text-xs font-bold text-mist uppercase tracking-wide block mb-2">
              Nombre completo
            </label>
            <input
              id="person-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="¿Cómo se llama?"
              autoFocus
              className="w-full border-2 border-bay-light rounded-xl px-4 py-3 font-body text-ink text-base focus:border-bay-mid focus:outline-none transition-colors"
            />
          </div>

          {/* Avatar picker */}
          <div>
            <p className="font-body text-xs font-bold text-mist uppercase tracking-wide mb-2">Ícono</p>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setAvatar(em)}
                  className={`text-2xl py-1.5 rounded-xl transition-all ${
                    avatar === em
                      ? 'bg-papaya-light border-2 border-papaya scale-110'
                      : 'bg-bay-light border-2 border-transparent hover:border-bay-mid/30'
                  }`}
                  aria-label={em}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="font-body text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-bay-light text-mist font-body font-semibold hover:bg-bay-light transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-papaya hover:bg-papaya-dark text-white font-body font-bold transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? 'Guardando…' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
