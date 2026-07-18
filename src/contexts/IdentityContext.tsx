'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface IdentityContextType {
  currentMemberId: string | null;
  setCurrentMember: (id: string) => void;
  clearIdentity: () => void;
  isLoaded: boolean;
}

const IdentityContext = createContext<IdentityContextType>({
  currentMemberId: null,
  setCurrentMember: () => {},
  clearIdentity: () => {},
  isLoaded: false,
});

export function useIdentity() {
  return useContext(IdentityContext);
}

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('tripMemberId');
    if (stored) setCurrentMemberId(stored);
    setIsLoaded(true);
  }, []);

  function setCurrentMember(id: string) {
    localStorage.setItem('tripMemberId', id);
    setCurrentMemberId(id);
  }

  function clearIdentity() {
    localStorage.removeItem('tripMemberId');
    setCurrentMemberId(null);
  }

  return (
    <IdentityContext.Provider value={{ currentMemberId, setCurrentMember, clearIdentity, isLoaded }}>
      {children}
    </IdentityContext.Provider>
  );
}
