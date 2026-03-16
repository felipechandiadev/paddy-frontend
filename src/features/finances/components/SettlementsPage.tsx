'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Settlement } from '../types/finances.types';
import SettlementsDataGrid from './SettlementsDataGrid';

interface SettlementsPageProps {
  initialSettlements: Settlement[];
  initialTotalRows: number;
}

const SettlementsPage: React.FC<SettlementsPageProps> = ({
  initialSettlements,
  initialTotalRows,
}) => {
  const router = useRouter();

  const handleSettlementCreate = React.useCallback((_created: Settlement) => {
    router.refresh();
  }, [router]);

  const handleSettlementUpdate = React.useCallback((_updated: Settlement) => {
    router.refresh();
  }, [router]);

  const handleSettlementDelete = React.useCallback((_deleted: Settlement) => {
    router.refresh();
  }, [router]);

  return (
    <div className="w-full">
      <SettlementsDataGrid
        settlements={initialSettlements}
        totalRows={initialTotalRows}
        onSettlementCreate={handleSettlementCreate}
        onSettlementUpdate={handleSettlementUpdate}
        onSettlementDelete={handleSettlementDelete}
      />
    </div>
  );
};

export default SettlementsPage;
