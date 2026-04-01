'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import TopBar from '@/shared/components/ui/TopBar/TopBar';
import { SideBarMenuItem } from '@/shared/components/ui/TopBar/SideBar';
import ChangePasswordDialog from '@/features/auth/components/ChangePasswordDialog';
import { usePermissions } from '@/providers/PermissionsProvider';

export default function PaddyTopBar() {
  const { data: session } = useSession();
  const { can, isAdmin } = usePermissions();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const sessionName = session?.user?.name?.trim() || '';
  const emailPrefix = session?.user?.email?.split('@')[0] || '';
  const userDisplayName = sessionName.includes('@') ? sessionName.split('@')[0] : (sessionName || emailPrefix);

  const menuItems: SideBarMenuItem[] = useMemo(() => {
    const managementChildren = [
      can('producers.view')  && { label: 'Productores',    url: '/paddy/management/producers' },
      can('users.view')      && { label: 'Usuarios',       url: '/paddy/users' },
      can('rice_types.view') && { label: 'Tipos de Arroz', url: '/paddy/management/rice-types' },
    ].filter(Boolean) as SideBarMenuItem[];

    const financesChildren = [
      can('advances.view')    && { label: 'Anticipos',     url: '/paddy/finances/advances' },
      can('transactions.view')&& { label: 'Pagos',         url: '/paddy/finances/payments' },
      can('settlements.view') && { label: 'Liquidaciones', url: '/paddy/finances/settlements' },
    ].filter(Boolean) as SideBarMenuItem[];

    const settingsChildren = [
      can('seasons.view')         && { label: 'Temporadas',           url: '/paddy/settings/seasons' },
      can('analysis_params.view') && { label: 'Parámetros de Análisis', url: '/paddy/settings/analysis-params' },
      can('templates.view')       && { label: 'Plantillas',           url: '/paddy/settings/templates' },
    ].filter(Boolean) as SideBarMenuItem[];

    const reportsChildren = [
      { label: 'Recaudación por Secado',                       url: '/paddy/reports/drying-revenue' },
      { label: 'Recaudación por Intereses',                    url: '/paddy/reports/interest-revenue' },
      { label: 'Rentabilidad de Servicios Financieros',        url: '/paddy/reports/financial-profitability' },
      { label: 'Retorno de Presupuesto',                       url: '/paddy/reports/budget-return' },
      { label: 'Rendimiento de Proceso',                       url: '/paddy/reports/process-yield' },
      { label: 'Volumen de Compra y Precio Promedio por Kilo', url: '/paddy/reports/volume-price' },
      { label: 'Proyección de Caja',                           url: '/paddy/reports/cash-projection' },
      { label: 'Libro de Existencias',                         url: '/paddy/reports/inventory-book' },
      { label: 'Evolución de Precios por Tipo de Arroz',       url: '/paddy/reports/rice-price' },
    ];

    return [
      { id: 'panel', label: 'Panel', url: '/paddy' },

      can('receptions.view') && {
        id: 'receptions',
        label: 'Recepciones',
        url: '/paddy/operations/receptions',
      },

      managementChildren.length > 0 && {
        id: 'management',
        label: 'Gestión',
        children: managementChildren,
      },

      financesChildren.length > 0 && {
        id: 'finances',
        label: 'Finanzas',
        children: financesChildren,
      },

      can('analytics.view') && {
        id: 'reports',
        label: 'Reportes',
        children: reportsChildren,
      },

      isAdmin && {
        id: 'audit',
        label: 'Auditoría',
        url: '/paddy/audit',
      },

      settingsChildren.length > 0 && {
        id: 'settings',
        label: 'Configuración',
        children: settingsChildren,
      },
    ].filter(Boolean) as SideBarMenuItem[];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.permissions, session?.user?.role]);

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
