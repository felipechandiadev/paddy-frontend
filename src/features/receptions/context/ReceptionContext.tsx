'use client';

import React, { createContext, useContext } from 'react';
import { ReceptionContextType } from '../types/nodes.types';
import { useReceptionData } from '../hooks/useReceptionData';

const ReceptionContext = createContext<ReceptionContextType | null>(null);

export function ReceptionProvider({ children }: { children: React.ReactNode }) {
  const receptionData = useReceptionData();

  return (
    <ReceptionContext.Provider value={receptionData}>
      {children}
    </ReceptionContext.Provider>
  );
}

export function useReceptionContext() {
  const context = useContext(ReceptionContext);
  if (!context) {
    throw new Error('useReceptionContext must be used within ReceptionProvider');
  }
  return context;
}
