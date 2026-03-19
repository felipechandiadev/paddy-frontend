'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCan } from '@/shared/hooks/useCan';
import DataGrid, { DataGridColumn, DataGridProps } from '@/shared/components/ui/DataGrid';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import Alert from '@/shared/components/ui/Alert/Alert';
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import { Button } from '@/shared/components/ui/Button/Button';
import { PrintDialog } from '@/shared/components/PrintDialog';
import { deleteAdvance, fetchAdvanceDetails } from '../actions/finances.action';
import { Advance, AdvanceDetails } from '../types/finances.types';
import { AdvanceInterestDialog } from './AdvanceInterestDialog';
import AdvanceReceiptToPrint from './AdvanceReceiptToPrint';
import NewAdvanceDialog from './NewAdvanceDialog';

const paymentMethodLabels: Record<'transfer' | 'check' | 'cash', string> = {
  transfer: 'Transferencia',
  check: 'Cheque',
  cash: 'Efectivo',
};

function parseDateInput(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00`
    : value;

  const parsedDate = new Date(normalizedValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export interface AdvancesDataGridProps extends Omit<DataGridProps, 'columns'> {
  advances: Advance[];
  onAdvanceUpdate?: (advance: Advance) => void;
  onAdvanceCreate?: (advance: Advance) => void;
  onAdvanceDelete?: (advance: Advance) => void;
}

const AdvancesDataGrid: React.FC<AdvancesDataGridProps> = ({
  advances,
  onAdvanceUpdate,
  onAdvanceCreate,
  onAdvanceDelete,
  totalRows,
  ...dataGridProps
}) => {
  const searchParams = useSearchParams();
  const { can } = useCan();
  const currencyFormatter = React.useMemo(
    () =>
      new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [],
  );

  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAdvanceForEdit, setSelectedAdvanceForEdit] =
    useState<Advance | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAdvanceForDelete, setSelectedAdvanceForDelete] =
    useState<Advance | null>(null);
  const [isDeletingAdvance, setIsDeletingAdvance] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [selectedAdvanceForPrint, setSelectedAdvanceForPrint] =
    useState<AdvanceDetails | null>(null);
  const [isLoadingAdvanceForPrint, setIsLoadingAdvanceForPrint] = useState(false);
  const [printErrorMessage, setPrintErrorMessage] = useState<string | null>(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);

  const resolveDownloadFileName = React.useCallback(
    (contentDisposition: string | null): string => {
      if (!contentDisposition) {
        return 'anticipos.xlsx';
      }

      const utf8FileNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
      if (utf8FileNameMatch?.[1]) {
        try {
          return decodeURIComponent(utf8FileNameMatch[1]);
        } catch {
          return utf8FileNameMatch[1];
        }
      }

      const plainFileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      if (plainFileNameMatch?.[1]) {
        return plainFileNameMatch[1];
      }

      return 'anticipos.xlsx';
    },
    [],
  );

  const handleExportExcel = React.useCallback(async () => {
    setExportErrorMessage(null);

    try {
      const exportParams = new URLSearchParams();
      const allowedParams = [
        'hideAnnulled',
        'producerId',
        'search',
        'sort',
        'sortField',
        'filters',
      ];

      allowedParams.forEach((paramName) => {
        const value = searchParams.get(paramName);
        if (value && value.trim().length > 0) {
          exportParams.set(paramName, value);
        }
      });

      const exportUrl = `/api/advances/export${
        exportParams.toString() ? `?${exportParams.toString()}` : ''
      }`;

      const response = await fetch(exportUrl, {
        method: 'GET',
      });

      if (!response.ok) {
        let message = 'No fue posible exportar los anticipos a Excel.';
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          const payload = await response.json().catch(() => null);
          if (payload?.error) {
            message = payload.error;
          }
        }

        throw new Error(message);
      }

      const blob = await response.blob();
      const fileName = resolveDownloadFileName(
        response.headers.get('content-disposition'),
      );

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setExportErrorMessage(
        error instanceof Error
          ? error.message
          : 'No fue posible exportar los anticipos a Excel.',
      );
    }
  }, [resolveDownloadFileName, searchParams]);

  const openDeleteDialog = (advance: Advance) => {
    setSelectedAdvanceForDelete(advance);
    setDeleteErrorMessage(null);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = (forceClose = false) => {
    if (isDeletingAdvance && !forceClose) {
      return;
    }

    setIsDeleteDialogOpen(false);
    setSelectedAdvanceForDelete(null);
    setDeleteErrorMessage(null);
  };

  const handleDeleteAdvance = async () => {
    if (!selectedAdvanceForDelete) {
      return;
    }

    setIsDeletingAdvance(true);
    setDeleteErrorMessage(null);

    try {
      const result = await deleteAdvance(selectedAdvanceForDelete.id);

      if (!result.success) {
        setDeleteErrorMessage(result.error || 'No fue posible anular el anticipo.');
        return;
      }

      const fallbackAdvance: Advance = {
        ...selectedAdvanceForDelete,
        status: 'cancelled',
        isActive: false,
        deletedAt: new Date().toISOString(),
      };

      const deletedAdvance = result.data || fallbackAdvance;

      if (onAdvanceDelete) {
        onAdvanceDelete(deletedAdvance);
      } else {
        onAdvanceUpdate?.(deletedAdvance);
      }

      closeDeleteDialog(true);
    } catch (error) {
      setDeleteErrorMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrio un error inesperado al anular el anticipo.',
      );
    } finally {
      setIsDeletingAdvance(false);
    }
  };

  const handlePrintAdvance = async (advance: Advance) => {
    setIsPrintDialogOpen(true);
    setSelectedAdvanceForPrint(null);
    setPrintErrorMessage(null);
    setIsLoadingAdvanceForPrint(true);

    try {
      const detailedAdvance = await fetchAdvanceDetails(advance.id);

      if (!detailedAdvance) {
        setPrintErrorMessage('No fue posible cargar el documento del anticipo.');
        return;
      }

      setSelectedAdvanceForPrint(detailedAdvance);
    } catch (error) {
      setPrintErrorMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrio un error inesperado al preparar el documento.',
      );
    } finally {
      setIsLoadingAdvanceForPrint(false);
    }
  };

  const handleClosePrintDialog = () => {
    setIsPrintDialogOpen(false);
    setSelectedAdvanceForPrint(null);
    setIsLoadingAdvanceForPrint(false);
    setPrintErrorMessage(null);
  };

  const columns: DataGridColumn[] = [
    {
      field: 'id',
      headerName: 'Folio',
      width: 90,
      type: 'number',
      sortable: true,
      valueGetter: (params) => params.row.id,
    },
    {
      field: 'producer',
      headerName: 'Productor',
      width: 220,
      sortable: true,
      valueGetter: (params) => params.row.producer?.name || 'N/A',
    },
    {
      field: 'amount',
      headerName: 'Monto',
      width: 140,
      type: 'number',
      sortable: true,
      renderCell: ({ value }) => currencyFormatter.format(Number(value || 0)),
    },
    {
      field: 'paymentMethod',
      headerName: 'Medio de pago',
      width: 155,
      sortable: true,
      valueGetter: (params) => {
        const raw = String(params.row.paymentMethod ?? '').toLowerCase();
        return raw === 'transfer' || raw === 'check' || raw === 'cash'
          ? raw
          : null;
      },
      renderCell: ({ value }) => {
        if (!value) {
          return '-';
        }

        return paymentMethodLabels[value as 'transfer' | 'check' | 'cash'] || '-';
      },
    },
    {
      field: 'bank',
      headerName: 'Banco',
      width: 220,
      sortable: true,
      valueGetter: (params) => {
        const raw = params.row.bank;
        return raw === null || raw === undefined ? '' : String(raw);
      },
      renderCell: ({ row, value }) => {
        const method = String(row.paymentMethod ?? '').toLowerCase();

        if (method === 'cash') {
          return '';
        }

        const text = String(value ?? '').trim();
        return text.length > 0 ? text : '-';
      },
    },
    {
      field: 'referenceNumber',
      headerName: 'Referencia',
      width: 160,
      sortable: true,
      valueGetter: (params) => {
        const raw = params.row.referenceNumber;
        return raw === null || raw === undefined ? '' : String(raw);
      },
      renderCell: ({ value }) => {
        const text = String(value ?? '').trim();
        return text.length > 0 ? text : '-';
      },
    },
    {
      field: 'interestRate',
      headerName: 'Tasa (% mensual)',
      width: 120,
      type: 'number',
      sortable: true,
      valueGetter: (params) => `${params.row.interestRate}%`,
    },
    {
      field: 'issueDate',
      headerName: 'Fecha Entrega',
      width: 140,
      sortable: true,
      renderCell: ({ value }) => {
        if (!value) return '-';
        const d = new Date(String(value));
        if (isNaN(d.getTime())) return String(value);
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        const yyyy = d.getUTCFullYear();
        return `${dd}-${mm}-${yyyy}`;
      },
    },
    {
      field: 'interestEndDate',
      headerName: 'Fecha Finalización',
      width: 150,
      sortable: true,
      valueGetter: (params) => params.row.interestEndDate || null,
      renderCell: ({ value }) => {
        const parsed = parseDateInput(String(value || ''));
        return <span>{parsed ? parsed.toLocaleDateString('es-CL') : '-'}</span>;
      },
    },
    {
      field: 'totalDays',
      headerName: 'Días Totales',
      width: 120,
      type: 'number',
      sortable: true,
      valueGetter: (params) => Number(params.row.totalDays ?? 0),
      renderCell: ({ value }) => <span>{value === null || value === undefined ? '-' : value}</span>,
    },
    {
      field: 'accruedInterest',
      headerName: 'Interés Acumulado',
      width: 170,
      type: 'number',
      sortable: true,
      valueGetter: (params) => Number(params.row.accruedInterest ?? 0),
      renderCell: ({ value }) => (
        <span className="font-semibold text-foreground">
          {currencyFormatter.format(Number(value || 0))}
        </span>
      ),
    },
    {
      field: 'status',
      headerName: 'Estado',
      width: 110,
      sortable: true,
      renderCell: ({ row, value }) => {
        const status =
          row.deletedAt || value === 'cancelled'
            ? 'cancelled'
            : value === 'settled'
            ? 'settled'
            : 'paid';
        const statusClassName =
          status === 'paid'
            ? 'bg-yellow-100 text-yellow-800'
            : status === 'settled'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-700';

        return (
          <div className={`px-2 py-1 rounded text-sm font-medium ${statusClassName}`}>
            {status === 'paid' ? 'Pagado' : status === 'settled' ? 'Liquidado' : 'Anulado'}
          </div>
        );
      },
    },
    {
      field: 'description',
      headerName: 'Descripción',
      width: 220,
      valueGetter: (params) => params.row.description || '-',
    },
    {
      field: 'actions',
      headerName: '',
      width: 190,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => {
        const isAnnulled = row.status === 'cancelled' || Boolean(row.deletedAt);
        const canEdit = !isAnnulled && can('advances.update');
        const canManageInterest = !isAnnulled && can('advances.change_interest');
        const canDelete = !isAnnulled && can('advances.cancel');
        const canPrintReceipt = !isAnnulled;

        return (
          <div className="flex items-center gap-2">
            <IconButton
              icon="receipt_long"
              variant="basicSecondary"
              onClick={() => handlePrintAdvance(row)}
              title={
                canPrintReceipt
                  ? 'Imprimir recepcion conforme'
                  : 'No se puede imprimir un anticipo anulado'
              }
              disabled={!canPrintReceipt}
            />
            <IconButton
              icon="edit"
              variant="basicSecondary"
              onClick={() => {
                setSelectedAdvanceForEdit(row);
                setIsEditDialogOpen(true);
              }}
              title={canEdit ? 'Editar anticipo' : 'No se puede editar un anticipo anulado'}
              disabled={!canEdit}
            />
            <IconButton
              icon="trending_up"
              variant="basicSecondary"
              onClick={() => {
                setSelectedAdvance(row);
                setDialogOpen(true);
              }}
              title={
                canManageInterest
                  ? 'Gestionar interés'
                  : 'No se puede gestionar interés en un anticipo anulado'
              }
              disabled={!canManageInterest}
            />
            <IconButton
              icon="delete"
              variant="basicSecondary"
              onClick={() => openDeleteDialog(row)}
              title={canDelete ? 'Anular y eliminar anticipo' : 'El anticipo ya fue anulado'}
              disabled={!canDelete}
            />
          </div>
        );
      },
    },
  ];

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedAdvance(null);
  };

  const handleSave = (updated: Advance) => {
    onAdvanceUpdate?.(updated);
    handleDialogClose();
  };

  return (
    <div className="w-full">
      {exportErrorMessage && (
        <div className="mb-3">
          <Alert variant="error">{exportErrorMessage}</Alert>
        </div>
      )}

      <DataGrid
        columns={columns}
        rows={advances}
        totalRows={typeof totalRows === 'number' ? totalRows : advances.length}
        title="Anticipos"
        height="85vh"
        showSearch={true}
        showSortButton={true}
        showBorder={false}
        pinActionsColumn={true}
        onAddClick={() => setIsCreateDialogOpen(true)}
        addDisabled={!can('advances.create')}
        onExportExcel={handleExportExcel}
        {...dataGridProps}
      />

      <NewAdvanceDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        mode="create"
        onSuccess={(advance) => {
          onAdvanceCreate?.(advance);
          setIsCreateDialogOpen(false);
        }}
      />

      <NewAdvanceDialog
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedAdvanceForEdit(null);
        }}
        mode="edit"
        advanceId={selectedAdvanceForEdit?.id ?? null}
        onSuccess={(advance) => {
          onAdvanceUpdate?.(advance);
          setIsEditDialogOpen(false);
          setSelectedAdvanceForEdit(null);
        }}
      />

      <Dialog
        open={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        title={
          selectedAdvanceForDelete
            ? `Anular anticipo #${selectedAdvanceForDelete.id}`
            : 'Anular anticipo'
        }
        size="sm"
        headerClassName="border-b border-gray-200 px-6 py-4 mb-0"
        titleClassName="p-0 text-lg font-bold text-foreground"
        bodyClassName="px-6 py-4"
        actions={
          <div className="flex gap-3 pt-4 justify-between">
            <Button
              type="button"
              variant="outlined"
              onClick={() => closeDeleteDialog()}
              disabled={isDeletingAdvance}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              className="bg-red-500 text-white hover:bg-red-600 rounded-full"
              onClick={handleDeleteAdvance}
              loading={isDeletingAdvance}
            >
              Anular y eliminar
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-sm text-neutral-700">
          <p className="text-gray-700">
            Esta accion anulara el anticipo y aplicara un soft-delete. En el DataGrid
            seguira visible con estado <span className="font-semibold">Anulado</span>.
          </p>

          <p className="font-medium text-neutral-800">
            Al confirmar, se aplicaran estos cambios:
          </p>

          <ul className="list-disc space-y-1 pl-5">
            <li>El estado del anticipo se actualiza a cancelled en backend.</li>
            <li>El registro del anticipo se elimina logicamente (soft-delete).</li>
            <li>
              La transaccion de anticipo asociada tambien se elimina logicamente para
              mantener la trazabilidad financiera.
            </li>
          </ul>

          {deleteErrorMessage && <Alert variant="error">{deleteErrorMessage}</Alert>}
        </div>
      </Dialog>

      <PrintDialog
        open={isPrintDialogOpen}
        onClose={handleClosePrintDialog}
        title={
          selectedAdvanceForPrint
            ? `Recepcion conforme anticipo #${selectedAdvanceForPrint.id}`
            : 'Recepcion conforme anticipo'
        }
        fileName={
          selectedAdvanceForPrint
            ? `anticipo-${selectedAdvanceForPrint.id}-recepcion-conforme`
            : 'recepcion-conforme-anticipo'
        }
        size="lg"
        fullWidth={true}
        maxWidth="96vw"
        pageSize="Letter"
        pageOrientation="portrait"
        disablePrint={
          isLoadingAdvanceForPrint ||
          !selectedAdvanceForPrint ||
          Boolean(printErrorMessage)
        }
        printLoading={isLoadingAdvanceForPrint}
      >
        {isLoadingAdvanceForPrint ? (
          <div className="flex min-h-[320px] items-center justify-center text-sm text-neutral-500">
            Preparando documento...
          </div>
        ) : printErrorMessage ? (
          <div className="px-4 py-6">
            <Alert variant="error">{printErrorMessage}</Alert>
          </div>
        ) : selectedAdvanceForPrint ? (
          <AdvanceReceiptToPrint advance={selectedAdvanceForPrint} />
        ) : (
          <div className="flex min-h-[320px] items-center justify-center text-sm text-neutral-500">
            No hay datos disponibles para imprimir.
          </div>
        )}
      </PrintDialog>
      
      <AdvanceInterestDialog
        open={dialogOpen}
        advance={selectedAdvance}
        onClose={handleDialogClose}
        onSave={handleSave}
      />
    </div>
  );
};

export default AdvancesDataGrid;
