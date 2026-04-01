'use client';

import React from 'react';
import { Transaction } from '../types/finances.types';
import PaymentsDataGrid from './PaymentsDataGrid';

interface PaymentsPageProps {
  initialPayments: Transaction[];
}

const PaymentsPage: React.FC<PaymentsPageProps> = ({ initialPayments }) => {
  return (
    <div className="w-full">
      <PaymentsDataGrid payments={initialPayments} />
    </div>
  );
};

export default PaymentsPage;
