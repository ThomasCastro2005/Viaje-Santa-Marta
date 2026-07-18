'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { FamilyMemberWithDetails, AccommodationVote, Accommodation } from '@/types';
import { IdentityProvider, useIdentity } from '@/contexts/IdentityContext';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import PeopleSection from '@/components/PeopleSection';
import TravelerSection from '@/components/TravelerSection';
import AccommodationSection from '@/components/AccommodationSection';
import WelcomeScreen from '@/components/WelcomeScreen';
import MusicPlayer from '@/components/MusicPlayer';

export default function Home() {
  return (
    <IdentityProvider>
      <AppShell />
      <MusicPlayer />
    </IdentityProvider>
  );
}

function AppShell() {
  const { currentMemberId, setCurrentMember, clearIdentity, isLoaded } = useIdentity();
  const [members,        setMembers]        = useState<FamilyMemberWithDetails[]>([]);
  const [votes,          setVotes]          = useState<AccommodationVote[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading,        setLoading]        = useState(true);

  const confirmedMembers = members.filter((m) => m.is_confirmed);
  const confirmedCount   = confirmedMembers.length;

  const dataCompletion  = confirmedCount > 0
    ? Math.round((confirmedMembers.filter((m) => m.traveler_details?.completed).length / confirmedCount) * 100)
    : 0;

  const fetchAll = useCallback(async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const [membersRes, votesRes, accsRes] = await Promise.all([
      supabase.from('family_members').select('*, traveler_details(*)').order('order_index', { ascending: true }),
      supabase.from('accommodation_votes').select('*'),
      supabase.from('accommodations').select('*').order('created_at', { ascending: true }),
    ]);
    if (!membersRes.error && membersRes.data) {
      const normalized = (membersRes.data as Record<string, unknown>[]).map((m) => ({
        ...m,
        traveler_details: Array.isArray(m.traveler_details)
          ? (m.traveler_details[0] ?? null)
          : (m.traveler_details ?? null),
      }));
      setMembers(normalized as FamilyMemberWithDetails[]);
    }
    if (!votesRes.error && votesRes.data) {
      setVotes(votesRes.data as AccommodationVote[]);
    }
    if (!accsRes.error && accsRes.data) {
      setAccommodations(accsRes.data as Accommodation[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel('trip_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_members' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'traveler_details' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accommodation_votes' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accommodations' }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  // Clear stale identity if member was deleted
  useEffect(() => {
    if (isLoaded && !loading && currentMemberId && members.length > 0) {
      const found = members.find((m) => m.id === currentMemberId);
      if (!found) clearIdentity();
    }
  }, [isLoaded, loading, currentMemberId, members, clearIdentity]);

  // --- Setup screen ---
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-bay flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl">
          <div className="text-5xl mb-4">⚙️</div>
          <h1 className="font-display font-extrabold text-2xl text-ink mb-3">Configura Supabase</h1>
          <p className="font-body text-mist mb-6 leading-relaxed">
            Crea un archivo{' '}
            <code className="bg-bay-light text-bay px-2 py-0.5 rounded text-sm font-mono">.env.local</code>{' '}
            con tus credenciales.
          </p>
          <div className="bg-sand rounded-2xl p-4 text-left font-mono text-sm text-ink mb-4 leading-relaxed">
            <p className="text-mist text-xs mb-2">📄 .env.local</p>
            <p>NEXT_PUBLIC_SUPABASE_URL=https://...</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...</p>
          </div>
          <p className="font-body text-xs text-mist">
            Ejecuta el SQL de{' '}
            <code className="bg-bay-light text-bay px-1 rounded">src/lib/supabase/schema.sql</code>{' '}
            en tu proyecto Supabase.
          </p>
        </div>
      </div>
    );
  }

  // --- Loading screen ---
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-bay flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>🌊</div>
          <p className="font-body text-white/50 text-sm">Cargando viaje…</p>
        </div>
      </div>
    );
  }

  // --- Welcome / identity selection ---
  if (!currentMemberId) {
    return <WelcomeScreen members={members} onSelect={setCurrentMember} />;
  }

  const currentMember = members.find((m) => m.id === currentMemberId) ?? null;

  return (
    <main>
      <Navigation
        confirmedCount={confirmedCount}
        totalCount={members.length}
        currentMember={currentMember}
        onSwitchIdentity={clearIdentity}
      />
      <HeroSection
        confirmedCount={confirmedCount}
        totalCount={members.length}
        dataCompletion={dataCompletion}
      />
      <PeopleSection
        members={members}
        loading={false}
        onMembersChange={fetchAll}
      />
      {confirmedMembers.length > 0 && (
        <TravelerSection members={confirmedMembers} onUpdate={fetchAll} />
      )}
      <AccommodationSection
        confirmedCount={confirmedCount}
        accommodations={accommodations}
        members={members}
        votes={votes}
        onVoteChange={fetchAll}
        onAccommodationsChange={fetchAll}
      />
      <footer
        className="relative overflow-hidden text-center px-5 pt-14 pb-12"
        style={{ background: 'linear-gradient(155deg, #10566A 0%, #1A7A8E 50%, #0E4A5C 100%)' }}
      >
        {/* Decorative wave top */}
        <div className="absolute top-0 left-0 right-0 pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 1440 36" preserveAspectRatio="none" className="w-full block" style={{ height: '28px' }}>
            <path d="M0,0 C360,36 1080,0 1440,28 L1440,0 Z" fill="#F7F3EE" />
          </svg>
        </div>

        {/* Subtle palm */}
        <span className="absolute right-4 bottom-4 text-[80px] leading-none opacity-[0.07] select-none pointer-events-none" aria-hidden="true">🌴</span>

        <div className="relative z-10 max-w-md mx-auto">
          <p className="font-body font-extrabold text-white text-2xl tracking-wide mb-1">
            Santa Marta 2026
          </p>
          <p className="font-body text-white/50 text-sm">
            4 — 7 Septiembre · Familia unida, aventura asegurada
          </p>
        </div>
      </footer>
    </main>
  );
}
