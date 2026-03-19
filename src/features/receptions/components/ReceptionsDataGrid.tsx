'use client';

import React from 'react';
import { useCan } from '@/shared/hooks/useCan';
import DataGrid, { DataGridColumn, DataGridProps } from '@/shared/components/ui/DataGrid';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import Alert from '@/shared/components/ui/Alert/Alert';
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import { Button } from '@/shared/components/ui/Button/Button';
import { useSearchParams } from 'next/navigation';
import { PrintDialog } from '@/shared/components/PrintDialog';
import { deleteReception, fetchReceptionAnalysis } from '../actions/fetch.action';
import {
  PrintableReception,
  ReceptionAnalysis,
  ReceptionListItem,
} from '../types/receptions.types';
import CreateReceptionDialog from './CreateReceptionDialog';
import ReceptionToPrint from './ReceptionToPrint';

export interface ReceptionsDataGridProps extends Omit<DataGridProps, 'columns'> {
  receptions: ReceptionListItem[];
  onReceptionCreate?: () => void;
}

const ReceptionsDataGrid: React.FC<ReceptionsDataGridProps> = ({
  receptions,
  onReceptionCreate,
  ...props
}) => {
  const searchParams = useSearchParams();
  const { can } = useCan();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingReception, setEditingReception] = React.useState<ReceptionListItem | null>(null);
  const [printOpen, setPrintOpen] = React.useState(false);
  const [selectedReception, setSelectedReception] = React.useState<PrintableReception | null>(null);
  const [isLoadingPrintAnalysis, setIsLoadingPrintAnalysis] = React.useState(false);
  const [printAnalysisError, setPrintAnalysisError] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [receptionToDelete, setReceptionToDelete] = React.useState<ReceptionListItem | null>(null);
  const [isDeletingReception, setIsDeletingReception] = React.useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = React.useState<string | null>(null);
  const [exportErrorMessage, setExportErrorMessage] = React.useState<string | null>(null);
  const printRequestRef = React.useRef(0);

  const weightFormatter = React.useMemo(
    () =>
      new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  const integerWeightFormatter = React.useMemo(
    () =>
      new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [],
  );

  const formatWeightValue = React.useCallback(
    (value: unknown) => {
      const numericValue = Number(value || 0);

      if (!Number.isFinite(numericValue)) {
        return '0';
      }

      if (Math.abs(numericValue % 1) < Number.EPSILON) {
        return integerWeightFormatter.format(numericValue);
      }

      return weightFormatter.format(numericValue);
    },
    [integerWeightFormatter, weightFormatter],
  );

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

  const hasRenderableAnalysis = React.useCallback(
    (analysis: ReceptionAnalysis | null | undefined) => {
      if (!analysis) {
        return false;
      }

      const fields: Array<keyof ReceptionAnalysis> = [
        'humedadRange',
        'humedadPercent',
        'impurezasRange',
        'impurezasPercent',
        'verdesRange',
        'manchadosRange',
        'yesososRange',
        'peladosRange',
        'vanoRange',
        'hualcachoRange',
        'totalGroupPercent',
        'groupTolerance',
        'dryPercent',
      ];

      return fields.some((field) => {
        const value = analysis[field];
        return value !== null && value !== undefined;
      });
    },
    [],
  );

  const handlePrint = React.useCallback(
    async (reception: ReceptionListItem) => {
      const requestId = printRequestRef.current + 1;
      printRequestRef.current = requestId;

      const receptionData: PrintableReception = {
        ...reception,
        rut: reception.rut || '',
        analysis: reception.analysis ?? null,
      };

      setSelectedReception(receptionData);
      setPrintAnalysisError(null);
      setPrintOpen(true);

      if (hasRenderableAnalysis(reception.analysis)) {
        setIsLoadingPrintAnalysis(false);
        return;
      }

      setIsLoadingPrintAnalysis(true);
      const result = await fetchReceptionAnalysis(reception.id);

      if (printRequestRef.current !== requestId) {
        return;
      }

      if (!result.success) {
        setPrintAnalysisError(result.error || 'No se pudo cargar el análisis de granos');
        setIsLoadingPrintAnalysis(false);
        return;
      }

      setSelectedReception((currentReception) => {
        if (!currentReception || currentReception.id !== reception.id) {
          return currentReception;
        }

        return {
          ...currentReception,
          analysis: result.data ?? null,
        };
      });
      setIsLoadingPrintAnalysis(false);
    },
    [hasRenderableAnalysis],
  );

  const handleClosePrint = React.useCallback(() => {
    printRequestRef.current += 1;
    setPrintOpen(false);
    setSelectedReception(null);
    setPrintAnalysisError(null);
    setIsLoadingPrintAnalysis(false);
  }, []);

  const openDeleteDialog = React.useCallback((reception: ReceptionListItem) => {
    setReceptionToDelete(reception);
    setDeleteErrorMessage(null);
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = React.useCallback(
    (forceClose = false) => {
      if (isDeletingReception && !forceClose) {
        return;
      }

      setDeleteDialogOpen(false);
      setReceptionToDelete(null);
      setDeleteErrorMessage(null);
    },
    [isDeletingReception],
  );

  const handleDeleteReception = React.useCallback(async () => {
    if (!receptionToDelete) {
      return;
    }

    setIsDeletingReception(true);
    setDeleteErrorMessage(null);

    try {
      const result = await deleteReception(receptionToDelete.id);

      if (!result.success) {
        setDeleteErrorMessage(result.error || 'No fue posible anular la recepción.');
        return;
      }

      closeDeleteDialog(true);
      onReceptionCreate?.();
    } catch (error) {
      setDeleteErrorMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado al anular la recepción.',
      );
    } finally {
      setIsDeletingReception(false);
    }
  }, [closeDeleteDialog, onReceptionCreate, receptionToDelete]);

  const handleEdit = React.useCallback((reception: ReceptionListItem) => {
    setEditingReception(reception);
    setEditDialogOpen(true);
  }, []);

  const resolveDownloadFileName = React.useCallback(
    (contentDisposition: string | null): string => {
      if (!contentDisposition) {
        return 'recepciones.xlsx';
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

      return 'recepciones.xlsx';
    },
    [],
  );

  const handleExportExcel = React.useCallback(async () => {
    setExportErrorMessage(null);

    try {
      const exportParams = new URLSearchParams();
      const allowedParams = [
        'hideAnnulled',
        'status',
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

      const exportUrl = `/api/receptions/export${
        exportParams.toString() ? `?${exportParams.toString()}` : ''
      }`;

      const response = await fetch(exportUrl, {
        method: 'GET',
      });

      if (!response.ok) {
        let message = 'No fue posible exportar las recepciones a Excel.';
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
          : 'No fue posible exportar las recepciones a Excel.',
      );
    }
  }, [resolveDownloadFileName, searchParams]);

  const columns = React.useMemo<DataGridColumn[]>(
    () => [
      {
        field: 'id',
        headerName: 'Folio',
        width: 90,
        type: 'id',
        sortable: true,
        renderCell: ({ value }) => <span>{value}</span>,
      },
      {
        field: 'guide',
        headerName: 'Guía',
        width: 110,
        sortable: true,
      },
      {
        field: 'producer',
        headerName: 'Productor',
        minWidth: 190,
        flex: 1,
        sortable: true,
      },
      {
        field: 'riceType',
        headerName: 'Tipo de Arroz',
        minWidth: 170,
        flex: 1,
        sortable: true,
      },
      {
        field: 'season',
        headerName: 'Temporada',
        minWidth: 150,
        sortable: true,
        valueGetter: ({ row }) => (row as ReceptionListItem).season || '-',
      },
      {
        field: 'licensePlate',
        headerName: 'Placa',
        width: 120,
        sortable: true,
      },
      {
        field: 'grossWeight',
        headerName: 'Peso Bruto',
        width: 120,
        type: 'number',
        sortable: true,
        renderCell: ({ value }) => (
          <span>{formatWeightValue(value)} kg</span>
        ),
      },
      {
        field: 'tare',
        headerName: 'Tara',
        width: 110,
        type: 'number',
        sortable: true,
        renderCell: ({ value }) => (
          <span>{formatWeightValue(value)} kg</span>
        ),
      },
      {
        field: 'netWeight',
        headerName: 'Peso Neto',
        width: 120,
        type: 'number',
        sortable: true,
        renderCell: ({ value }) => (
          <span>{formatWeightValue(value)} kg</span>
        ),
      },
      {
        field: 'paddyNeto',
        headerName: 'Paddy Neto',
        width: 130,
        type: 'number',
        sortable: true,
        renderCell: ({ value }) => (
          <span className="font-semibold text-blue-700">
            {formatWeightValue(value)} kg
          </span>
        ),
      },
      {
        field: 'price',
        headerName: 'Precio',
        width: 130,
        type: 'number',
        sortable: true,
        renderCell: ({ value }) => (
          <span className="font-semibold text-gray-900">
            {currencyFormatter.format(Number(value || 0))}
          </span>
        ),
      },
      {
        field: 'status',
        headerName: 'Estado',
        width: 120,
        sortable: true,
        renderCell: ({ value, row }) => {
          const receptionRow = row as ReceptionListItem;
          if (receptionRow.deletedAt) {
            return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                Anulada
              </span>
            );
          }

          const rawStatus = String(value || 'cancelled').toLowerCase();
          const status =
            rawStatus === 'analyzed' || rawStatus === 'settled' || rawStatus === 'cancelled'
              ? rawStatus
              : rawStatus === 'pending' || rawStatus === 'in_process'
                ? 'cancelled'
                : 'cancelled';
          const statusClassName =
            status === 'cancelled'
              ? 'bg-red-100 text-red-700'
              : status === 'analyzed'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800';

          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClassName}`}
            >
              {status === 'cancelled' && 'Cancelada'}
              {status === 'analyzed' && 'Analizada'}
              {status === 'settled' && 'Liquidada'}
            </span>
          );
        },
      },
      {
        field: 'createdAt',
        headerName: 'Fecha',
        width: 110,
        sortable: true,
        renderCell: ({ value }) => (
          <span>{new Date(value).toLocaleDateString('es-CL')}</span>
        ),
      },
      {
        field: 'actions',
        headerName: '',
        width: 170,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => {
          const receptionRow = row as ReceptionListItem;
          const isAnnulled = Boolean(receptionRow.deletedAt);
          const isSettled = String(receptionRow.status || '').toLowerCase() === 'settled';

          return (
            <div className="flex items-center justify-center gap-2 w-full">
            <IconButton
              icon="edit"
              variant="basicSecondary"
              size="sm"
              onClick={() => handleEdit(row)}
              title={
                isAnnulled
                  ? 'No se puede editar una recepción anulada'
                  : isSettled
                    ? 'No se puede editar una recepción liquidada'
                    : 'Editar recepción'
              }
              ariaLabel="Editar recepción"
              disabled={isAnnulled || isSettled || !can('receptions.update')}
            />
            <IconButton
              icon="print"
              variant="basicSecondary"
              size="sm"
              onClick={() => handlePrint(row)}
              title="Imprimir recepción"
              ariaLabel="Imprimir recepción"
              disabled={isAnnulled}
            />
            <IconButton
              icon="delete"
              variant="basicSecondary"
              size="sm"
              onClick={() => openDeleteDialog(receptionRow)}
              title={
                isAnnulled
                  ? 'La recepción ya está anulada'
                  : isSettled
                    ? 'No se puede eliminar una recepción liquidada'
                    : 'Anular recepción'
              }
              ariaLabel="Anular recepción"
              disabled={isAnnulled || isSettled || !can('receptions.cancel')}
            />
          </div>
          );
        },
      },
    ],
    [currencyFormatter, formatWeightValue, handleEdit, handlePrint, openDeleteDialog, can],
  );

  return (
    <div className="w-full">
      {exportErrorMessage && (
        <div className="mb-3">
          <Alert variant="error">{exportErrorMessage}</Alert>
        </div>
      )}

      <DataGrid
        columns={columns}
        rows={receptions}
        totalRows={receptions.length}
        title="Recepciones"
        height="85vh"
        showSearch={true}
        showSortButton={true}
        showBorder={false}
        onAddClick={() => setCreateDialogOpen(true)}
        addDisabled={!can('receptions.create')}
        onExportExcel={handleExportExcel}
        {...props}
        pinActionsColumn={true}
      />

      <CreateReceptionDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          // No cerrar automáticamente el diálogo al guardar
          onReceptionCreate?.();
        }}
      />

      <CreateReceptionDialog
        open={editDialogOpen}
        mode="edit"
        initialReception={editingReception}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingReception(null);
        }}
        onSuccess={() => {
          setEditDialogOpen(false);
          setEditingReception(null);
          onReceptionCreate?.();
        }}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => closeDeleteDialog()}
        title={
          receptionToDelete
            ? `Anular recepción #${receptionToDelete.id}`
            : 'Anular recepción'
        }
        size="sm"
        actions={
          <div className="flex gap-3 pt-4 justify-between">
            <Button
              type="button"
              variant="outlined"
              onClick={() => closeDeleteDialog()}
              disabled={isDeletingReception}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              className="bg-red-500 text-white hover:bg-red-600 rounded-full"
              onClick={handleDeleteReception}
              loading={isDeletingReception}
            >
              Anular y eliminar
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-sm text-neutral-700">
          <p>
            Vas a anular esta recepción. Esta acción aplica una eliminación lógica (soft delete)
            y no se puede revertir.
          </p>

          <p className="font-medium text-neutral-800">Al confirmar:</p>

          <ul className="list-disc space-y-1 pl-5">
            <li>La recepción cambia su estado a cancelada.</li>
            <li>La recepción queda anulada y seguirá visible en la grilla para trazabilidad.</li>
            <li>El análisis asociado también se elimina de forma lógica.</li>
            <li>La anulación es irreversible.</li>
          </ul>

          {deleteErrorMessage && <Alert variant="error">{deleteErrorMessage}</Alert>}
        </div>
      </Dialog>

      {selectedReception && (
        <PrintDialog
          open={printOpen}
          onClose={handleClosePrint}
          title={`Recepción #${selectedReception.id || selectedReception.guide}`}
          fileName={`Recepcion-${selectedReception.guide}`}
          disablePrint={isLoadingPrintAnalysis}
          printLoading={isLoadingPrintAnalysis}
          size="custom"
          maxWidth="96vw"
          fullWidth
          scroll="body"
          zIndex={90}
          contentStyle={{ maxHeight: '95vh' }}
        >
          <ReceptionToPrint
            reception={selectedReception}
            isLoadingAnalysis={isLoadingPrintAnalysis}
            analysisError={printAnalysisError}
          />
        </PrintDialog>
      )}
    </div>
  );
};

export default ReceptionsDataGrid;
