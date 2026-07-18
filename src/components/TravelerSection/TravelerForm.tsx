'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Save, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import { FamilyMemberWithDetails, TravelerDetails, DocumentType } from '@/types';
import { supabase } from '@/lib/supabase/client';

interface TravelerFormProps {
  member: FamilyMemberWithDetails;
  onUpdate: () => void;
}

const DOC_TYPES: { value: DocumentType; label: string; hint: string }[] = [
  { value: 'CC',  label: 'Cédula de Ciudadanía',  hint: 'Mayores de 18 años' },
  { value: 'TI',  label: 'Tarjeta de Identidad',  hint: 'Menores de 18 años' },
  { value: 'PAS', label: 'Pasaporte',               hint: 'Nacionales y extranjeros' },
  { value: 'CE',  label: 'Cédula de Extranjería',   hint: 'Extranjeros residentes' },
  { value: 'RCN', label: 'Registro Civil',           hint: 'Menores de 7 años' },
];

// Reglas por tipo de documento colombiano
const DOC_RULES: Record<string, { min: number; max: number; onlyDigits: boolean }> = {
  CC:  { min: 6,  max: 10, onlyDigits: true  },
  TI:  { min: 10, max: 11, onlyDigits: true  },
  CE:  { min: 6,  max: 10, onlyDigits: true  },
  RCN: { min: 8,  max: 11, onlyDigits: true  },
  PAS: { min: 5,  max: 20, onlyDigits: false },
};

function filterPhone(raw: string) {
  return raw.replace(/\D/g, '').slice(0, 10);
}

function filterDocNumber(raw: string, docType: string) {
  const rule = DOC_RULES[docType];
  if (!rule) return raw.slice(0, 20);
  if (rule.onlyDigits) return raw.replace(/\D/g, '').slice(0, rule.max);
  return raw.replace(/[^A-Za-z0-9]/g, '').slice(0, rule.max);
}

function validateField(field: string, value: string, docType: string): string {
  switch (field) {
    case 'document_type':
      return !value ? 'Selecciona el tipo de documento' : '';
    case 'document_number': {
      if (!value.trim()) return 'El número de documento es requerido';
      const rule = DOC_RULES[docType];
      if (!rule) return '';
      if (rule.onlyDigits) {
        if (!/^\d+$/.test(value)) return 'Solo se permiten dígitos';
        if (value.length < rule.min) return `Mínimo ${rule.min} dígitos`;
        if (value.length > rule.max) return `Máximo ${rule.max} dígitos`;
      } else {
        if (!/^[A-Za-z0-9]+$/.test(value)) return 'Solo letras y números';
        if (value.length < rule.min) return `Mínimo ${rule.min} caracteres`;
      }
      return '';
    }
    case 'birthdate': {
      if (!value) return 'La fecha de nacimiento es requerida';
      const d = new Date(value);
      const now = new Date();
      if (isNaN(d.getTime())) return 'Fecha inválida';
      if (d >= now) return 'La fecha debe ser en el pasado';
      if (now.getFullYear() - d.getFullYear() > 120) return 'Fecha demasiado antigua';
      return '';
    }
    case 'phone': {
      if (!value.trim()) return 'El teléfono es requerido';
      if (!/^\d{10}$/.test(value)) return 'Debe tener exactamente 10 dígitos';
      if (!value.startsWith('3')) return 'Los celulares colombianos empiezan por 3';
      return '';
    }
    case 'email': {
      if (!value.trim()) return '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Correo electrónico inválido';
      return '';
    }
    case 'emergency_contact_name': {
      if (!value.trim()) return 'El nombre del contacto es requerido';
      if (value.trim().length < 3) return 'Mínimo 3 caracteres';
      return '';
    }
    case 'emergency_contact_phone': {
      if (!value.trim()) return 'El teléfono de emergencia es requerido';
      if (!/^\d{10}$/.test(value)) return 'Debe tener exactamente 10 dígitos';
      if (!value.startsWith('3')) return 'Los celulares colombianos empiezan por 3';
      return '';
    }
    default:
      return '';
  }
}

function inputClass(filled: boolean, hasError: boolean) {
  if (hasError) {
    return 'w-full border-2 border-red-300 bg-red-50/60 rounded-xl px-4 py-3 font-body text-ink text-[15px] transition-colors focus:outline-none focus:border-red-400';
  }
  return `w-full border-2 rounded-xl px-4 py-3 font-body text-ink text-[15px] transition-colors focus:outline-none ${
    filled
      ? 'border-bay-mid/35 bg-white'
      : 'border-bay-light bg-white focus:border-bay-mid'
  }`;
}

export default function TravelerForm({ member, onUpdate }: TravelerFormProps) {
  const d = member.traveler_details as TravelerDetails | null | undefined;
  const [open, setOpen]             = useState(false);
  const [docDropOpen, setDocDropOpen] = useState(false);
  const docDropRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving]         = useState(false);
  const [savedOk, setSavedOk]       = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [touched, setTouched]       = useState<Record<string, boolean>>({});
  const [triedSave, setTriedSave]   = useState(false);

  const [form, setForm] = useState({
    document_type:           d?.document_type           ?? '',
    document_number:         d?.document_number         ?? '',
    birthdate:               d?.birthdate               ?? '',
    phone:                   d?.phone                   ?? '',
    email:                   d?.email                   ?? '',
    emergency_contact_name:  d?.emergency_contact_name  ?? '',
    emergency_contact_phone: d?.emergency_contact_phone ?? '',
    dietary_needs:           d?.dietary_needs           ?? '',
  });

  function set(field: string, value: string) {
    const newForm = { ...form, [field]: value };
    setForm(newForm);
    setSavedOk(false);
    if (touched[field] || triedSave) {
      setErrors((prev) => ({
        ...prev,
        [field]: validateField(field, value, newForm.document_type),
      }));
    }
  }

  function touch(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, (form as Record<string, string>)[field] ?? '', form.document_type),
    }));
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (docDropRef.current && !docDropRef.current.contains(e.target as Node)) {
        setDocDropOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function pickDocType(value: DocumentType) {
    set('document_type', value);
    touch('document_type');
    setDocDropOpen(false);
  }

  const requiredFields = [
    'document_type', 'document_number', 'birthdate',
    'phone', 'emergency_contact_name', 'emergency_contact_phone',
  ] as const;

  const filled   = requiredFields.filter((f) => !!form[f]).length;
  const pct      = Math.round((filled / requiredFields.length) * 100);
  const isComplete = filled === requiredFields.length;

  function showErr(field: string) {
    return (touched[field] || triedSave) && !!errors[field];
  }

  async function save() {
    setTriedSave(true);
    const allErrors: Record<string, string> = {};
    [...requiredFields, 'email'].forEach((f) => {
      const err = validateField(f, (form as Record<string, string>)[f] ?? '', form.document_type);
      if (err) allErrors[f] = err;
    });
    setErrors(allErrors);
    if (Object.values(allErrors).some((e) => e)) return;

    setSaving(true);
    const payload = {
      ...form,
      document_type: (form.document_type as DocumentType) || null,
      completed: isComplete,
    };
    if (d?.id) {
      await supabase.from('traveler_details').update(payload).eq('id', d.id);
    } else {
      await supabase.from('traveler_details').insert({ ...payload, member_id: member.id });
    }
    setSaving(false);
    setSavedOk(true);
    onUpdate();
    setTimeout(() => setSavedOk(false), 3000);
  }

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden transition-all ${
        d?.completed ? 'ring-2 ring-jade' : 'ring-1 ring-bay-light'
      }`}
    >
      {/* Accordion header */}
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 md:gap-4 px-4 md:px-5 py-4 text-left hover:bg-bay-light/30 transition-colors"
      >
        <div className="w-11 h-11 bg-bay-light rounded-xl flex items-center justify-center text-2xl leading-none flex-shrink-0">
          {member.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-display font-bold text-ink text-sm md:text-base">{member.name}</span>
            {d?.completed && (
              <span className="inline-flex items-center gap-1 font-body text-[11px] bg-jade-light text-jade px-2 py-0.5 rounded-full font-semibold">
                <CheckCircle2 size={10} strokeWidth={2.5} /> Completo
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-bay-light rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-jade' : 'bg-papaya'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-body text-[11px] text-mist whitespace-nowrap">{pct}%</span>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-mist transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Form */}
      {open && (
        <div className="px-4 md:px-5 pb-5 border-t border-bay-light">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">

            {/* Tipo doc — combobox personalizado */}
            <div>
              <label className="font-body text-[11px] font-bold text-mist uppercase tracking-wide block mb-1.5">
                Tipo de documento *
              </label>
              <div ref={docDropRef} className="relative">
                <button
                  type="button"
                  onClick={() => setDocDropOpen((o) => !o)}
                  className={`w-full flex items-center justify-between gap-2 text-left ${inputClass(!!form.document_type, showErr('document_type'))} ${docDropOpen ? '!border-bay-mid' : ''}`}
                >
                  <span className={form.document_type ? 'text-ink' : 'text-mist/60'}>
                    {form.document_type
                      ? DOC_TYPES.find((dt) => dt.value === form.document_type)?.label ?? 'Seleccionar…'
                      : 'Seleccionar…'}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`flex-shrink-0 text-mist transition-transform duration-200 ${docDropOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {docDropOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-bay-light overflow-hidden z-40">
                    {DOC_TYPES.map((dt) => {
                      const isSelected = dt.value === form.document_type;
                      return (
                        <button
                          key={dt.value}
                          type="button"
                          onClick={() => pickDocType(dt.value)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? 'bg-bay-light/70 text-ink'
                              : 'hover:bg-sand text-ink/80 hover:text-ink'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-body font-semibold text-sm leading-none">{dt.label}</p>
                            <p className="font-body text-[11px] text-mist mt-0.5">{dt.hint}</p>
                          </div>
                          {isSelected && <Check size={14} className="text-bay flex-shrink-0" strokeWidth={2.5} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {showErr('document_type') && <ErrMsg msg={errors.document_type} />}
            </div>

            {/* Número doc */}
            <div>
              <label className="font-body text-[11px] font-bold text-mist uppercase tracking-wide block mb-1.5">
                Número de documento *
                {form.document_type && DOC_RULES[form.document_type] && (
                  <span className="ml-1 normal-case font-normal text-mist/60">
                    (máx. {DOC_RULES[form.document_type].max} {DOC_RULES[form.document_type].onlyDigits ? 'dígitos' : 'caracteres'})
                  </span>
                )}
              </label>
              <input
                type="text"
                inputMode={form.document_type === 'PAS' ? 'text' : 'numeric'}
                value={form.document_number}
                onChange={(e) => set('document_number', filterDocNumber(e.target.value, form.document_type))}
                onBlur={() => touch('document_number')}
                placeholder={form.document_type === 'PAS' ? 'Ej: AB123456' : 'Ej: 1234567890'}
                maxLength={DOC_RULES[form.document_type]?.max ?? 20}
                className={inputClass(!!form.document_number, showErr('document_number'))}
              />
              {showErr('document_number') && <ErrMsg msg={errors.document_number} />}
            </div>

            {/* Fecha nac */}
            <div>
              <label className="font-body text-[11px] font-bold text-mist uppercase tracking-wide block mb-1.5">
                Fecha de nacimiento *
              </label>
              <input
                type="date"
                value={form.birthdate}
                onChange={(e) => set('birthdate', e.target.value)}
                onBlur={() => touch('birthdate')}
                max={new Date().toISOString().split('T')[0]}
                className={inputClass(!!form.birthdate, showErr('birthdate'))}
              />
              {showErr('birthdate') && <ErrMsg msg={errors.birthdate} />}
            </div>

            {/* Teléfono */}
            <div>
              <label className="font-body text-[11px] font-bold text-mist uppercase tracking-wide block mb-1.5">
                Teléfono celular *
                <span className="ml-1 normal-case font-normal text-mist/60">(10 dígitos)</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => set('phone', filterPhone(e.target.value))}
                onBlur={() => touch('phone')}
                placeholder="Ej: 3001234567"
                maxLength={10}
                className={inputClass(!!form.phone, showErr('phone'))}
              />
              {showErr('phone') && <ErrMsg msg={errors.phone} />}
            </div>

            {/* Email */}
            <div>
              <label className="font-body text-[11px] font-bold text-mist uppercase tracking-wide block mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                onBlur={() => touch('email')}
                placeholder="correo@ejemplo.com"
                className={inputClass(!!form.email, showErr('email'))}
              />
              {showErr('email') && <ErrMsg msg={errors.email} />}
            </div>

            {/* Contacto emergencia nombre */}
            <div>
              <label className="font-body text-[11px] font-bold text-mist uppercase tracking-wide block mb-1.5">
                Contacto de emergencia — nombre *
              </label>
              <input
                type="text"
                value={form.emergency_contact_name}
                onChange={(e) => set('emergency_contact_name', e.target.value)}
                onBlur={() => touch('emergency_contact_name')}
                placeholder="Nombre completo"
                className={inputClass(!!form.emergency_contact_name, showErr('emergency_contact_name'))}
              />
              {showErr('emergency_contact_name') && <ErrMsg msg={errors.emergency_contact_name} />}
            </div>

            {/* Contacto emergencia teléfono */}
            <div>
              <label className="font-body text-[11px] font-bold text-mist uppercase tracking-wide block mb-1.5">
                Contacto de emergencia — teléfono *
                <span className="ml-1 normal-case font-normal text-mist/60">(10 dígitos)</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={form.emergency_contact_phone}
                onChange={(e) => set('emergency_contact_phone', filterPhone(e.target.value))}
                onBlur={() => touch('emergency_contact_phone')}
                placeholder="3001234567"
                maxLength={10}
                className={inputClass(!!form.emergency_contact_phone, showErr('emergency_contact_phone'))}
              />
              {showErr('emergency_contact_phone') && <ErrMsg msg={errors.emergency_contact_phone} />}
            </div>

            {/* Restricciones */}
            <div className="md:col-span-2">
              <label className="font-body text-[11px] font-bold text-mist uppercase tracking-wide block mb-1.5">
                Alergias o restricciones alimentarias
              </label>
              <input
                type="text"
                value={form.dietary_needs}
                onChange={(e) => set('dietary_needs', e.target.value)}
                placeholder="Ej: vegetariano, alérgico a mariscos…"
                className={inputClass(!!form.dietary_needs, false)}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="font-body text-xs text-mist">* Campos requeridos para los tiquetes</p>
            <button
              onClick={save}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-body font-bold text-sm transition-all disabled:opacity-50 ${
                savedOk ? 'bg-jade text-white' : 'bg-papaya hover:bg-papaya-dark text-white'
              }`}
            >
              {saving ? 'Guardando…' : savedOk
                ? <><CheckCircle2 size={14} /> Guardado</>
                : <><Save size={14} /> Guardar datos</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ErrMsg({ msg }: { msg: string }) {
  return (
    <p className="mt-1.5 font-body text-xs text-red-500 flex items-center gap-1 leading-tight">
      <AlertCircle size={11} className="flex-shrink-0" />
      {msg}
    </p>
  );
}
