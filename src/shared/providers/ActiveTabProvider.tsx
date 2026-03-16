"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';

interface ActiveTabContextProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ActiveTabContext = createContext<ActiveTabContextProps | undefined>(undefined);

export function ActiveTabProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const defaultTab =
    tabParam ||
    (typeof window !== 'undefined' &&
    (window.location.pathname.includes('/admin/accounting') ||
      window.location.pathname.includes('/admin/sales'))
      ? // choose first tab depending on section
        window.location.pathname.includes('/admin/accounting')
        ? 'accounts-receivable'
        : 'sale-notes'
      : 'products');
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <ActiveTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ActiveTabContext.Provider>
  );
}

export function useActiveTab() {
  const context = useContext(ActiveTabContext);
  if (!context) {
    throw new Error('useActiveTab must be used within an ActiveTabProvider');
  }
  return context;
}