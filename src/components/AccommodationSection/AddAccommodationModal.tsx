'use client';

import { useState, useRef } from 'react';
import { X, Plus, AlertCircle, Upload, Video, Image, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { FamilyMember } from '@/types';

interface AddAccommodationModalProps {
  currentMember: FamilyMember | null;
  onClose: () => void;
  onAdded: () => void;
}

function fieldClass(hasError = false) {
  return `w-full border-2 rounded-2xl px-4 py-3 font-body text-white text-[15px] placeholder-white/30 bg-white/8 transition-colors focus:outline-none ${
    hasError ? 'border-red-400/60 bg-red-500/10' : 'border-white/15 focus:border-papaya/50'
  }`;
}

function isVideo(file: File) {
  return file.type.startsWith('video/');
}

export default function AddAccommodationModal({ currentMember, onClose, onAdded }: AddAccommodationModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', location: '', description: '',
    price_per_night: '', max_guests: '',
    amenities_raw: '', external_url: '', notes: '',
  });
  const [mediaFile,    setMediaFile]    = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const [saving,       setSaving]       = useState(false);
  const [uploadPct,    setUploadPct]    = useState(0);
  const [uploadError,  setUploadError]  = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  }

  function removeMedia() {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())           e.name           = 'El nombre es requerido';
    if (!form.price_per_night.trim()) e.price_per_night = 'El precio es requerido';
    else if (isNaN(Number(form.price_per_night.replace(/\D/g, ''))))
      e.price_per_night = 'Solo números';
    return e;
  }

  async function save() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    setUploadError(null);
    let mediaUrl: string | null = null;

    // Upload file to Supabase Storage
    if (mediaFile) {
      const ext  = mediaFile.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      setUploadPct(15);
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('accommodation-media')
        .upload(path, mediaFile, { upsert: true });
      setUploadPct(85);
      if (uploadErr) {
        setSaving(false);
        setUploadError(
          uploadErr.message.includes('Bucket not found') || uploadErr.message.includes('bucket')
            ? 'El bucket de Storage no existe. Ve a Supabase → Storage → New bucket, nómbralo "accommodation-media" y márcalo como público.'
            : `Error al subir archivo: ${uploadErr.message}`
        );
        return;
      }
      if (uploadData) {
        const { data: pub } = supabase.storage
          .from('accommodation-media')
          .getPublicUrl(uploadData.path);
        mediaUrl = pub.publicUrl;
      }
      setUploadPct(100);
    }

    const price  = Number(form.price_per_night.replace(/\D/g, ''));
    const guests = form.max_guests ? Number(form.max_guests) : 10;
    const amenities = form.amenities_raw
      .split(',').map((s) => s.trim()).filter(Boolean);

    await supabase.from('accommodations').insert({
      name:            form.name.trim(),
      location:        form.location.trim(),
      description:     form.description.trim(),
      price_per_night: price,
      max_guests:      guests,
      amenities,
      video_url:       mediaUrl,
      external_url:    form.external_url.trim() || null,
      notes:           form.notes.trim() || null,
      added_by_name:   currentMember?.name ?? null,
    });

    setSaving(false);
    onAdded();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bay w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/10 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10 flex-shrink-0 flex items-center justify-between gap-3">
          <div>
            <p className="font-body text-white/40 text-[11px] font-bold tracking-[0.22em] uppercase mb-1">
              Sugerir opción
            </p>
            <h3 className="font-display font-bold text-white text-lg">Agregar alojamiento</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/10 hover:bg-white/15 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <X size={15} className="text-white/60" />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="overflow-y-auto px-6 py-5 space-y-4">

          {/* Nombre */}
          <div>
            <label className="font-body text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-2">
              Nombre del alojamiento *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ej: Palanoa · Apartamento 702"
              className={fieldClass(!!errors.name)}
            />
            {errors.name && <p className="mt-1.5 text-red-400 text-xs flex items-center gap-1"><AlertCircle size={11}/>{errors.name}</p>}
          </div>

          {/* Ubicación */}
          <div>
            <label className="font-body text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-2">
              Ubicación
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="Ej: Sector Rodadero, Santa Marta"
              className={fieldClass(false)}
            />
          </div>

          {/* Precio + Max personas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-2">
                Precio / noche (grupo) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.price_per_night}
                onChange={(e) => set('price_per_night', e.target.value.replace(/[^\d]/g, ''))}
                placeholder="800000"
                className={fieldClass(!!errors.price_per_night)}
              />
              {errors.price_per_night && <p className="mt-1.5 text-red-400 text-xs flex items-center gap-1"><AlertCircle size={11}/>{errors.price_per_night}</p>}
            </div>
            <div>
              <label className="font-body text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-2">
                Máx. personas
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.max_guests}
                onChange={(e) => set('max_guests', e.target.value.replace(/\D/g, ''))}
                placeholder="14"
                className={fieldClass(false)}
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="font-body text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-2">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Describe el alojamiento…"
              rows={3}
              className={`${fieldClass()} resize-none`}
            />
          </div>

          {/* Foto / Video */}
          <div>
            <label className="font-body text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-2">
              Foto o video del alojamiento
            </label>

            {mediaPreview ? (
              <div className="relative rounded-2xl overflow-hidden bg-black">
                {mediaFile && isVideo(mediaFile) ? (
                  <video src={mediaPreview} controls className="w-full max-h-52 object-cover" />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={mediaPreview} alt="preview" className="w-full max-h-52 object-cover" />
                )}
                <button
                  onClick={removeMedia}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                  {mediaFile && isVideo(mediaFile)
                    ? <Video size={11} className="text-white" />
                    : <Image size={11} className="text-white" />}
                  <span className="font-body text-[11px] text-white">{mediaFile?.name}</span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-white/20 hover:border-papaya/40 rounded-2xl py-8 flex flex-col items-center gap-2 transition-colors group"
              >
                <div className="w-10 h-10 bg-white/10 group-hover:bg-papaya/20 rounded-xl flex items-center justify-center transition-colors">
                  <Upload size={18} className="text-white/50 group-hover:text-papaya transition-colors" />
                </div>
                <span className="font-body text-white/50 group-hover:text-white/70 text-sm transition-colors">
                  Toca para subir foto o video
                </span>
                <span className="font-body text-white/30 text-xs">MP4, MOV, JPG, PNG, WEBP</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,image/*"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          {/* Instalaciones */}
          <div>
            <label className="font-body text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-2">
              Instalaciones <span className="font-normal">(separadas por comas)</span>
            </label>
            <input
              type="text"
              value={form.amenities_raw}
              onChange={(e) => set('amenities_raw', e.target.value)}
              placeholder="WiFi, A/C, Piscina, Cocina…"
              className={fieldClass(false)}
            />
          </div>

          {/* Enlace externo */}
          <div>
            <label className="font-body text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-2">
              Enlace (Airbnb, WhatsApp, etc.)
            </label>
            <input
              type="url"
              value={form.external_url}
              onChange={(e) => set('external_url', e.target.value)}
              placeholder="https://…"
              className={fieldClass(false)}
            />
          </div>

          {/* Notas */}
          <div>
            <label className="font-body text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-2">
              Notas adicionales
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Costos adicionales, check-in, condiciones especiales…"
              rows={3}
              className={`${fieldClass()} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-white/10 flex-shrink-0 space-y-3">
          {/* Upload error */}
          {uploadError && (
            <div className="bg-red-500/15 border border-red-400/30 rounded-2xl p-3 flex gap-2">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="font-body text-red-300 text-xs leading-relaxed">{uploadError}</p>
            </div>
          )}

          {currentMember && (
            <p className="font-body text-white/35 text-xs text-center">
              Se publicará como sugerencia de <strong className="text-white/60">{currentMember.name}</strong>
            </p>
          )}

          {/* Upload progress */}
          {saving && mediaFile && uploadPct < 100 && (
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-papaya rounded-full transition-all duration-300"
                style={{ width: `${uploadPct}%` }}
              />
            </div>
          )}

          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3.5 bg-papaya hover:bg-papaya-dark text-white font-display font-bold text-base rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-papaya/20"
          >
            {saving
              ? <><Loader2 size={18} className="animate-spin" /> {mediaFile ? `Subiendo… ${uploadPct}%` : 'Guardando…'}</>
              : <><Plus size={18} /> Publicar sugerencia</>}
          </button>
        </div>
      </div>
    </div>
  );
}
