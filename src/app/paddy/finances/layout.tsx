import { ReactNode } from 'react';

interface FinancesLayoutProps {
  children: ReactNode;
}

export default function FinancesLayout({ children }: FinancesLayoutProps) {
  return <>{children}</>;
}
