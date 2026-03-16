'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import TopBar from '@/shared/components/ui/TopBar/TopBar';
import { SideBarMenuItem } from '@/shared/components/ui/TopBar/SideBar';
import ChangePasswordDialog from '@/features/auth/components/ChangePasswordDialog';

export default function PaddyTopBar() {
  const { data: session } = useSession();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const sessionName = session?.user?.name?.trim() || '';
  const emailPrefix = session?.user?.email?.split('@')[0] || '';
  const userDisplayName = sessionName.includes('@') ? sessionName.split('@')[0] : (sessionName || emailPrefix);

  const menuItems: SideBarMenuItem[] = [
    {
      id: 'panel',
      label: 'Panel',
      url: '/paddy',
    },
    {
      id: 'receptions',
      label: 'Recepciones',
      url: '/paddy/operations/receptions',
    },
    {
      id: 'management',
      label: 'Gestión',
      children: [
        { label: 'Productores', url: '/paddy/management/producers' },
        { label: 'Usuarios', url: '/paddy/users' },
        { label: 'Tipos de Arroz', url: '/paddy/management/rice-types' },
      ],
    },
    {
      id: 'finances',
      label: 'Finanzas',
      children: [
        { label: 'Anticipos', url: '/paddy/finances/advances' },
        { label: 'Pagos', url: '/paddy/finances/payments' },
        { label: 'Liquidaciones', url: '/paddy/finances/settlements' },
      ],
    },
    {
      id: 'reports',
      label: 'Reportes',
      children: [
        { label: 'Recaudación por Secado', url: '/paddy/reports/drying-revenue' },
        { label: 'Recaudación por Intereses', url: '/paddy/reports/interest-revenue' },
        {
          label: 'Rentabilidad de Servicios Financieros',
          url: '/paddy/reports/financial-profitability',
        },
        { label: 'Retorno de Presupuesto', url: '/paddy/reports/budget-return' },
        { label: 'Rendimiento de Proceso', url: '/paddy/reports/process-yield' },
        {
          label: 'Volumen de Compra y Precio Promedio por Kilo',
          url: '/paddy/reports/volume-price',
        },
        { label: 'Proyección de Caja', url: '/paddy/reports/cash-projection' },
        { label: 'Libro de Existencias', url: '/paddy/reports/inventory-book' },
      ],
    },
   
    {
      id: 'settings',
      label: 'Configuración',
      children: [
        { label: 'Temporadas', url: '/paddy/settings/seasons' },
        { label: 'Parámetros de Análisis', url: '/paddy/settings/analysis-params' },
        { label: 'Plantillas', url: '/paddy/settings/templates' },
      ],
    },
  ];

  return (
    <>
      <TopBar
        title="Paddy AyG"
        logoSrc="/logo.svg"
        menuItems={menuItems}
        showUserButton={true}
        userName={userDisplayName}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        className="print:hidden"
      />

      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
}
