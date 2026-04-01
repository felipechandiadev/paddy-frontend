'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReceptionListItem } from '../types/receptions.types';
import ReceptionsDataGrid from './ReceptionsDataGrid';
import Switch from '@/shared/components/ui/Switch/Switch';

interface ReceptionsPageProps {
  initialReceptions: ReceptionListItem[];
  initialTotalRows: number;
  hideAnnulled?: boolean;
}

export default function ReceptionsPage({
  initialReceptions,
  initialTotalRows,
  hideAnnulled = true,
}: ReceptionsPageProps) {
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

  const handleReceptionCreate = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const hideAnnulledSwitch = (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-600">Ocultar anuladas</span>
      <Switch
        checked={hideAnnulled}
        onChange={handleToggleHideAnnulled}
      />
    </div>
  );

  return (
    <div className="w-full">
      <ReceptionsDataGrid
        receptions={initialReceptions}
        totalRows={initialTotalRows}
        onReceptionCreate={handleReceptionCreate}
        headerActions={hideAnnulledSwitch}
      />
    </div>
  );
}
