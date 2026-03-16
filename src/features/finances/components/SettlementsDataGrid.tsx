'use client';

import React, { useMemo, useState } from 'react';
import DataGrid, { DataGridColumn, DataGridProps } from '@/shared/components/ui/DataGrid';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import Alert from '@/shared/components/ui/Alert/Alert';
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import { Button } from '@/shared/components/ui/Button/Button';
import { PrintDialog } from '@/shared/components/PrintDialog';
import { deleteSettlement, fetchSettlementById } from '../actions/finances.action';
import { Settlement } from '../types/finances.types';
import NewSettlementDialog from './NewSettlementDialog';
import SettlementToPrint from './SettlementToPrint';

type SettlementDisplayStatus = Settlement['status'] | 'annulled';

const toSafeNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getCalculationDetails = (settlement: Settlement): Record<string, unknown> => {
  if (!settlement.calculationDetails || typeof settlement.calculationDetails !== 'object') {
    return {};
  }

  return settlement.calculationDetails as Record<string, unknown>;
};

const getSettlementSummary = (settlement: Settlement): Record<string, unknown> => {
  const calculationDetails = getCalculationDetails(settlement);
  const summary = calculationDetails.summary;

  if (!summary || typeof summary !== 'object') {
    return {};
  }

  return summary as Record<string, unknown>;
};

const getServiceInvoices = (settlement: Settlement): Record<string, unknown> => {
  const calculationDetails = getCalculationDetails(settlement);
  const serviceInvoices = calculationDetails.serviceInvoices;

  if (!serviceInvoices || typeof serviceInvoices !== 'object') {
    return {};
  }

  return serviceInvoices as Record<string, unknown>;
};

const getReceptionsCount = (settlement: Settlement): number => {
  if (Array.isArray(settlement.receptionIds)) {
    return settlement.receptionIds.length;
  }

  return Math.max(0, Math.round(toSafeNumber(getSettlementSummary(settlement).totalReceptions)));
};

const getAdvancesCount = (settlement: Settlement): number => {
  if (Array.isArray(settlement.advanceIds)) {
    return settlement.advanceIds.length;
  }

  return Math.max(
    0,
    Math.round(toSafeNumber(getSettlementSummary(settlement).totalAdvancesCount)),
  );
};

const getServicesCount = (settlement: Settlement): number => {
  const serviceInvoices = getServiceInvoices(settlement);
  return Object.values(serviceInvoices).filter(
    (service) => service && typeof service === 'object',
  ).length;
};

const getAdvancesAmount = (settlement: Settlement): number => {
  const entityAmount = toSafeNumber(settlement.totalAdvances);
  if (entityAmount !== 0) {
    return entityAmount;
  }

  return toSafeNumber(getSettlementSummary(settlement).totalAdvances);
};

const getNetRiceAmount = (settlement: Settlement): number => {
  const entityAmount = toSafeNumber(settlement.totalPrice);
  if (entityAmount !== 0) {
    return entityAmount;
  }

  return toSafeNumber(getSettlementSummary(settlement).netRiceAmount);
};

const getRiceVatAmount = (settlement: Settlement): number => {
  const entityAmount = toSafeNumber(settlement.ivaRice);
  if (entityAmount !== 0) {
    return entityAmount;
  }

  return toSafeNumber(getSettlementSummary(settlement).riceVatAmount);
};

const getTotalRiceAmount = (settlement: Settlement): number => {
  const summaryAmount = toSafeNumber(getSettlementSummary(settlement).totalRiceAmount);
  if (summaryAmount !== 0) {
    return summaryAmount;
  }

  return getNetRiceAmount(settlement) + getRiceVatAmount(settlement);
};

const getDisplayStatus = (settlement: Settlement): SettlementDisplayStatus =>
  settlement.deletedAt ? 'annulled' : settlement.status;

export interface SettlementsDataGridProps extends Omit<DataGridProps, 'columns'> {
  settlements: Settlement[];
  totalRows?: number;
  onSettlementCreate?: (settlement: Settlement) => void;
  onSettlementUpdate?: (settlement: Settlement) => void;
  onSettlementDelete?: (settlement: Settlement) => void;
}

const SettlementsDataGrid: React.FC<SettlementsDataGridProps> = ({
  settlements,
  totalRows,
  onSettlementCreate,
  onSettlementUpdate,
  onSettlementDelete,
  ...props
}) => {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSettlementForEdit, setSelectedSettlementForEdit] =
    useState<Settlement | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSettlementForDelete, setSelectedSettlementForDelete] =
    useState<Settlement | null>(null);
  const [isDeletingSettlement, setIsDeletingSettlement] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [selectedSettlementForPrint, setSelectedSettlementForPrint] =
    useState<Settlement | null>(null);
  const [isLoadingSettlementForPrint, setIsLoadingSettlementForPrint] = useState(false);
  const resolvedTotalRows =
    typeof totalRows === 'number' && Number.isFinite(totalRows)
      ? totalRows
      : settlements.length;

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

  const statusStyles: Record<SettlementDisplayStatus, string> = {
    draft: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-700',
    annulled: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<SettlementDisplayStatus, string> = {
    draft: 'Pre-liquidacion',
    completed: 'Liquidada',
    cancelled: 'Cancelada',
    annulled: 'Anulada',
  };

  const handlePrintSettlement = async (settlement: Settlement) => {
    setSelectedSettlementForPrint(settlement);
    setIsPrintDialogOpen(true);
    setIsLoadingSettlementForPrint(true);

    const detailedSettlement = await fetchSettlementById(settlement.id);
    if (detailedSettlement) {
      setSelectedSettlementForPrint(detailedSettlement);
    }

    setIsLoadingSettlementForPrint(false);
  };

  const handleClosePrintDialog = () => {
    setIsPrintDialogOpen(false);
    setSelectedSettlementForPrint(null);
    setIsLoadingSettlementForPrint(false);
  };

  const openDeleteDialog = (settlement: Settlement) => {
    setSelectedSettlementForDelete(settlement);
    setDeleteErrorMessage(null);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = (forceClose = false) => {
    if (isDeletingSettlement && !forceClose) {
      return;
    }

    setIsDeleteDialogOpen(false);
    setSelectedSettlementForDelete(null);
    setDeleteErrorMessage(null);
  };

  const handleDeleteSettlement = async () => {
    if (!selectedSettlementForDelete) {
      return;
    }

    setIsDeletingSettlement(true);
    setDeleteErrorMessage(null);

    try {
      const result = await deleteSettlement(selectedSettlementForDelete.id);

      if (!result.success) {
        setDeleteErrorMessage(result.error || 'No fue posible anular la liquidacion.');
        return;
      }

      const fallbackSettlement: Settlement = {
        ...selectedSettlementForDelete,
        status: 'cancelled',
        deletedAt: new Date().toISOString(),
        receptionIds: [],
        advanceIds: [],
      };

      onSettlementDelete?.(result.data || fallbackSettlement);
      closeDeleteDialog(true);
    } catch (error) {
      setDeleteErrorMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrio un error inesperado al anular la liquidacion.',
      );
    } finally {
      setIsDeletingSettlement(false);
    }
  };

  const columns: DataGridColumn[] = [
    {
      field: 'id',
      headerName: 'Folio',
      minWidth: 95,
      sortable: true,
      renderCell: ({ value }) => {
        const folioId = Number(value);
        return Number.isFinite(folioId) && folioId > 0 ? String(folioId) : '-';
      },
    },
    {
      field: 'producer',
      headerName: 'Productor',
      minWidth: 220,
      width: 260,
      sortable: true,
      valueGetter: (params) => params.row.producer?.name || 'N/A',
    },
    {
      field: 'season',
      headerName: 'Temporada',
      minWidth: 140,
      sortable: true,
      valueGetter: (params) => params.row.season?.code || '-',
    },
    {
      field: 'netRiceAmount',
      headerName: 'Neto paddy',
      minWidth: 135,
      sortable: true,
      valueGetter: (params) => getNetRiceAmount(params.row as Settlement),
      renderCell: ({ value }) => currencyFormatter.format(Number(value || 0)),
    },
    {
      field: 'riceVatAmount',
      headerName: 'IVA Paddy',
      minWidth: 125,
      sortable: true,
      valueGetter: (params) => getRiceVatAmount(params.row as Settlement),
      renderCell: ({ value }) => currencyFormatter.format(Number(value || 0)),
    },
    {
      field: 'totalRiceAmount',
      headerName: 'Total Paddy',
      minWidth: 125,
      sortable: true,
      valueGetter: (params) => getTotalRiceAmount(params.row as Settlement),
      renderCell: ({ value }) => (
        <span className="font-semibold text-blue-700">
          {currencyFormatter.format(Number(value || 0))}
        </span>
      ),
    },
    {
      field: 'totalAdvances',
      headerName: 'Anticipos',
      minWidth: 125,
      sortable: true,
      valueGetter: (params) => getAdvancesAmount(params.row as Settlement),
      renderCell: ({ value }) => (
        <span className="font-semibold text-red-700">
          {currencyFormatter.format(Number(value || 0))}
        </span>
      ),
    },
    {
      field: 'interestNet',
      headerName: 'Neto interes',
      minWidth: 130,
      sortable: true,
      valueGetter: (params) => toSafeNumber((params.row as Settlement).interestNet),
      renderCell: ({ value }) => (
        <span className="font-semibold text-red-700">
          {currencyFormatter.format(Number(value || 0))}
        </span>
      ),
    },
    {
      field: 'interestVat',
      headerName: 'IVA interes',
      minWidth: 125,
      sortable: true,
      valueGetter: (params) => toSafeNumber((params.row as Settlement).interestVat),
      renderCell: ({ value }) => (
        <span className="font-semibold text-red-700">
          {currencyFormatter.format(Number(value || 0))}
        </span>
      ),
    },
    {
      field: 'interestTotal',
      headerName: 'Total interes',
      minWidth: 130,
      sortable: true,
      valueGetter: (params) => toSafeNumber((params.row as Settlement).interestTotal),
      renderCell: ({ value }) => (
        <span className="font-semibold text-red-700">
          {currencyFormatter.format(Number(value || 0))}
        </span>
      ),
    },
    {
      field: 'servicesNet',
      headerName: 'Neto servicios',
      minWidth: 135,
      sortable: true,
      valueGetter: (params) => toSafeNumber((params.row as Settlement).servicesNet),
      renderCell: ({ value }) => (
        <span className="font-semibold text-red-700">
          {currencyFormatter.format(Number(value || 0))}
        </span>
      ),
    },
    {
      field: 'servicesVat',
      headerName: 'IVA servicios',
      minWidth: 130,
      sortable: true,
      valueGetter: (params) => toSafeNumber((params.row as Settlement).servicesVat),
      renderCell: ({ value }) => (
        <span className="font-semibold text-red-700">
          {currencyFormatter.format(Number(value || 0))}
        </span>
      ),
    },
    {
      field: 'servicesTotal',
      headerName: 'Total servicios',
      minWidth: 135,
      sortable: true,
      valueGetter: (params) => toSafeNumber((params.row as Settlement).servicesTotal),
      renderCell: ({ value }) => (
        <span className="font-semibold text-red-700">
          {currencyFormatter.format(Number(value || 0))}
        </span>
      ),
    },
    {
      field: 'liquidationNet',
      headerName: 'Neto liquidacion',
      minWidth: 145,
      sortable: true,
      valueGetter: (params) => toSafeNumber((params.row as Settlement).liquidationNet),
      renderCell: ({ value }) => (
        <span className="font-semibold text-green-700">
          {currencyFormatter.format(Number(value || 0))}
        </span>
      ),
    },
    {
      field: 'liquidationVat',
      headerName: 'IVA liquidacion',
      minWidth: 140,
      sortable: true,
      valueGetter: (params) => toSafeNumber((params.row as Settlement).liquidationVat),
      renderCell: ({ value }) => (
        <span className="font-semibold text-green-700">
          {currencyFormatter.format(Number(value || 0))}
        </span>
      ),
    },
    {
      field: 'liquidationTotal',
      headerName: 'Total liquidacion',
      minWidth: 150,
      sortable: true,
      valueGetter: (params) => toSafeNumber((params.row as Settlement).liquidationTotal),
      renderCell: ({ value }) => (
        <span className="font-semibold text-green-700">
          {currencyFormatter.format(Number(value || 0))}
        </span>
      ),
    },
    {
      field: 'status',
      headerName: 'Estado',
      minWidth: 145,
      sortable: true,
      renderCell: ({ row }) => {
        const settlement = row as Settlement;
        const status = getDisplayStatus(settlement);
        return (
          <span className={`rounded px-2 py-1 text-xs font-medium ${statusStyles[status]}`}>
            {statusLabels[status]}
          </span>
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Fecha',
      minWidth: 110,
      sortable: true,
      renderCell: ({ value }) =>
        value ? new Date(value).toLocaleDateString('es-CL') : '-',
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 190,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => {
        const settlement = row as Settlement;
        const isAnnulled = Boolean(settlement.deletedAt);
        const canEdit = settlement.status === 'draft' && !isAnnulled;
        const canDelete = !isAnnulled;
        const canPrint = !isAnnulled;

        return (
          <div className="flex items-center gap-2">
            <IconButton
              icon="print"
              onClick={() => {
                void handlePrintSettlement(settlement);
              }}
              title={
                canPrint
                  ? 'Imprimir liquidacion/pre-liquidacion'
                  : 'No se puede imprimir una liquidacion anulada'
              }
              disabled={!canPrint}
              variant="basicSecondary"
            />
            <IconButton
              icon="edit"
              onClick={() => {
                setSelectedSettlementForEdit(settlement);
                setIsEditDialogOpen(true);
              }}
              title={
                canEdit
                  ? 'Editar pre-liquidacion'
                  : isAnnulled
                    ? 'No se puede editar una liquidacion anulada'
                    : 'Solo se pueden editar liquidaciones en estado pre-liquidacion'
              }
              disabled={!canEdit}
              variant="basicSecondary"
            />
            <IconButton
              icon="delete"
              onClick={() => openDeleteDialog(settlement)}
              title={
                canDelete
                  ? 'Anular y eliminar liquidacion'
                  : 'La liquidacion ya fue anulada'
              }
              disabled={!canDelete}
              variant="basicSecondary"
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full">
      <DataGrid
        columns={columns}
        rows={settlements}
        totalRows={resolvedTotalRows}
        title="Liquidaciones"
        height="85vh"
        showSearch={true}
        showSortButton={true}
        showBorder={false}
        pinActionsColumn={true}
        onAddClick={() => setIsNewDialogOpen(true)}
        {...props}
      />

      <NewSettlementDialog
        open={isNewDialogOpen}
        onClose={() => setIsNewDialogOpen(false)}
        mode="create"
        onSuccess={(settlement) => {
          onSettlementCreate?.(settlement);
          setIsNewDialogOpen(false);
        }}
      />

      <NewSettlementDialog
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedSettlementForEdit(null);
        }}
        mode="edit"
        settlementId={selectedSettlementForEdit?.id ?? null}
        onSuccess={(settlement) => {
          onSettlementUpdate?.(settlement);
          setIsEditDialogOpen(false);
          setSelectedSettlementForEdit(null);
        }}
      />

      <Dialog
        open={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        title={
          selectedSettlementForDelete
            ? `Anular liquidacion #${selectedSettlementForDelete.id}`
            : 'Anular liquidacion'
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
              disabled={isDeletingSettlement}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              className="bg-red-500 text-white hover:bg-red-600 rounded-full"
              onClick={handleDeleteSettlement}
              loading={isDeletingSettlement}
            >
              Anular y eliminar
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-sm text-neutral-700">
          <p className="text-gray-700">
            Esta accion eliminara la liquidacion. En el listado seguira visible con estado{' '}
            <span className="font-semibold">Anulada</span>.
          </p>

          <p className="font-medium text-neutral-800">
            Al confirmar, se aplicaran estos cambios:
          </p>

          <ul className="list-disc space-y-1 pl-5">
            <li>
              Las recepciones asociadas se desliquidan y vuelven a estado analizada, quedando
              disponibles para una nueva liquidacion.
            </li>
            <li>
              Los anticipos asociados se liberan y vuelven a estado pagado, disponibles para ser
              liquidados nuevamente.
            </li>
            <li>
              Los montos de servicios e intereses de esta liquidacion dejan de impactar este
              documento y deberan recalcularse al crear una nueva liquidacion.
            </li>
          </ul>

          {deleteErrorMessage && <Alert variant="error">{deleteErrorMessage}</Alert>}
        </div>
      </Dialog>

      {selectedSettlementForPrint && (
        <PrintDialog
          open={isPrintDialogOpen}
          onClose={handleClosePrintDialog}
          title={`Liquidacion #${selectedSettlementForPrint.id}`}
          fileName={`Liquidacion-${selectedSettlementForPrint.id}`}
          disablePrint={isLoadingSettlementForPrint}
          printLoading={isLoadingSettlementForPrint}
          size="custom"
          maxWidth="96vw"
          fullWidth
          scroll="body"
          zIndex={90}
          contentStyle={{ maxHeight: '95vh' }}
          pageOrientation="landscape"
        >
          <SettlementToPrint settlement={selectedSettlementForPrint} />
        </PrintDialog>
      )}
    </div>
  );
};

export default SettlementsDataGrid;
