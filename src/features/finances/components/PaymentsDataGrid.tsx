'use client';

import React, { useMemo } from 'react';
import DataGrid, { DataGridColumn, DataGridProps } from '@/shared/components/ui/DataGrid';
import { Transaction } from '../types/finances.types';

export interface PaymentsDataGridProps extends Omit<DataGridProps, 'columns'> {
  payments: Transaction[];
}

const PaymentsDataGrid: React.FC<PaymentsDataGridProps> = ({
  payments,
  ...props
}) => {
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  );

  const paymentMethodLabels: Record<'transfer' | 'check' | 'cash', string> = {
    transfer: 'Transferencia',
    check: 'Cheque',
    cash: 'Efectivo',
  };

  const transactionTypeLabels: Record<Transaction['type'], string> = {
    payment: 'Pago',
    advance: 'Anticipo',
    deduction: 'Descuento',
    interest: 'Interes',
    refund: 'Devolucion',
    settlement: 'Liquidacion',
  };

  const columns: DataGridColumn[] = [
    {
      field: 'type',
      headerName: 'Tipo',
      minWidth: 120,
      sortable: true,
      valueGetter: (params) =>
        transactionTypeLabels[params.row.type as Transaction['type']] ||
        params.row.type ||
        '-',
    },
    {
      field: 'producer',
      headerName: 'Productor',
      minWidth: 220,
      flex: 1,
      sortable: true,
      valueGetter: (params) => params.row.producer?.name || 'N/A',
    },
    {
      field: 'associatedFolio',
      headerName: 'Folio asociado',
      minWidth: 160,
      sortable: true,
      valueGetter: (params) => {
        const transaction = params.row as Transaction;

        if (transaction.type === 'advance') {
          return transaction.advanceId ? `Anticipo #${transaction.advanceId}` : '-';
        }

        if (transaction.type === 'settlement') {
          return transaction.settlementId
            ? `Liquidacion #${transaction.settlementId}`
            : '-';
        }

        return '-';
      },
    },
    {
      field: 'amount',
      headerName: 'Monto (CLP)',
      minWidth: 150,
      sortable: true,
      renderCell: ({ value }) => currencyFormatter.format(Number(value || 0)),
    },
    {
      field: 'paymentMethod',
      headerName: 'Metodo de Pago',
      minWidth: 150,
      sortable: true,
      valueGetter: (params) => {
        const method: string | null =
          params.row.paymentMethod ||
          (typeof params.row.metadata?.paymentMethod === 'string'
            ? params.row.metadata.paymentMethod.toLowerCase()
            : null);

        if (method === 'transfer' || method === 'check' || method === 'cash') {
          return paymentMethodLabels[method];
        }

        return '-';
      },
    },
    {
      field: 'referenceNumber',
      headerName: 'Referencia',
      minWidth: 140,
      sortable: true,
      valueGetter: (params) => params.row.referenceNumber || '-',
    },
    {
      field: 'transactionDate',
      headerName: 'Fecha',
      minWidth: 120,
      sortable: true,
      renderCell: ({ value }) =>
        value ? new Date(value).toLocaleDateString('es-CL') : '-',
    },
    {
      field: 'notes',
      headerName: 'Observaciones',
      minWidth: 220,
      flex: 1,
      sortable: false,
      valueGetter: (params) => params.row.notes || '-',
    },
  ];

  return (
    <div className="w-full">
      <DataGrid
        columns={columns}
        rows={payments}
        totalRows={payments.length}
        title="Pagos, Anticipos y Liquidaciones"
        height="85vh"
        showSearch={true}
        showSortButton={true}
        showBorder={false}
        {...props}
      />
    </div>
  );
};

export default PaymentsDataGrid;
