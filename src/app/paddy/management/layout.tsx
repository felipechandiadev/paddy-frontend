import { ReactNode } from 'react';

interface ManagementLayoutProps {
  children: ReactNode;
}

export default function ManagementLayout({ children }: ManagementLayoutProps) {
  return <>{children}</>;
}
