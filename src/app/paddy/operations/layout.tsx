import { ReactNode } from 'react';

interface OperationsLayoutProps {
  children: ReactNode;
}

export default function OperationsLayout({ children }: OperationsLayoutProps) {
  return <>{children}</>;
}
