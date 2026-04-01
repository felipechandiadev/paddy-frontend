'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdvancesDataGrid from './AdvancesDataGrid';
import { Advance } from '../types/finances.types';
import Switch from '@/shared/components/ui/Switch/Switch';

interface AdvancesPageProps {
  initialAdvances: Advance[];
  initialTotalRows: number;
  hideAnnulled?: boolean;
}

const AdvancesPage: React.FC<AdvancesPageProps> = ({
  initialAdvances,
  initialTotalRows,
  hideAnnulled = false,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleToggleHideAnnulled = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!checked) {
      params.set('hideAnnulled', 'false');
    } else {
      params.delete('hideAnnulled');
    }
    router.push(`?${params.toString()}`);
  };

  const handleAdvanceCreate = React.useCallback((_created: Advance) => {
    router.refresh();
  }, [router]);

  const handleAdvanceUpdate = React.useCallback((_updated: Advance) => {
    router.refresh();
  }, [router]);

  const handleAdvanceDelete = React.useCallback((_deleted: Advance) => {
    router.refresh();
  }, [router]);

  const hideAnnulledSwitch = (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-600">Ocultar anulados</span>
      <Switch
        checked={hideAnnulled}
        onChange={handleToggleHideAnnulled}
      />
    </div>
  );

  return (
    <div className="w-full">
      <AdvancesDataGrid
        advances={initialAdvances}
        totalRows={initialTotalRows}
        onAdvanceUpdate={handleAdvanceUpdate}
        onAdvanceCreate={handleAdvanceCreate}
        onAdvanceDelete={handleAdvanceDelete}
        headerActions={hideAnnulledSwitch}
      />
    </div>
  );
};

export default AdvancesPage;
