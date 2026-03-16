'use client';

import { ReactNode } from 'react';
import PaddyTopBar from './components/TopBar';

interface PaddyLayoutProps {
  children: ReactNode;
}

export default function PaddyLayout({ children }: PaddyLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* TopBar - Fixed positioning, height handled by TopBar component */}
      <PaddyTopBar />
      
      {/* Main Content Area - Offset by TopBar height */}
      <main className="flex-1 flex flex-col overflow-hidden pt-20 print:pt-0 print:overflow-visible">
        {/* Content */}
        <div className="flex-1 overflow-auto print:overflow-visible">
          {children}
        </div>
      </main>
    </div>
  );
}
