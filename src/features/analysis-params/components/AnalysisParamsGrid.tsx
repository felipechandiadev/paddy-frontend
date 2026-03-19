'use client';

import React from 'react';
import { usePermissions } from '@/providers/PermissionsProvider';
import DataGrid, { DataGridColumn } from '@/shared/components/ui/DataGrid';
import Alert from '@/shared/components/ui/Alert/Alert';
import Switch from '@/shared/components/ui/Switch/Switch';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import AnalysisParamsFilter from './AnalysisParamsFilter';
import CreateAnalysisParamDialog from './CreateAnalysisParamDialog';
import UpdateAnalysisParamDialog from './UpdateAnalysisParamDialog';
import { updateAnalysisParamIsActive } from '../actions';
import { AnalysisParam } from '../types/analysis-params.types';

interface AnalysisParamsGridProps {
  initialData: AnalysisParam[];
}

export default function AnalysisParamsGrid({
  initialData,
}: AnalysisParamsGridProps) {
  const { isAdmin } = usePermissions();
  const [allData, setAllData] = React.useState<AnalysisParam[]>(initialData || []);
  const [filteredData, setFilteredData] = React.useState<AnalysisParam[]>(initialData || []);
  const [selectedParam, setSelectedParam] = React.useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedParamForEdit, setSelectedParamForEdit] = React.useState<AnalysisParam | null>(
    null,
  );
  const [toggleError, setToggleError] = React.useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = React.useState<Set<number>>(new Set());

  React.useEffect(() => {
    setAllData(initialData || []);
  }, [initialData]);

  React.useEffect(() => {
    if (!selectedParam) {
      setFilteredData(allData);
    } else {
      setFilteredData(allData.filter((item) => item.discountName === selectedParam));
    }
  }, [selectedParam, allData]);

  const handleCreateSuccess = React.useCallback((createdParam: AnalysisParam) => {
    setAllData((prev) => {
      const merged = [...prev.filter((item) => item.id !== createdParam.id), createdParam];
      return merged.sort((a, b) => {
        if (a.discountCode !== b.discountCode) {
          return a.discountCode - b.discountCode;
        }
        return a.rangeStart - b.rangeStart;
      });
    });
  }, []);

  const handleEditSuccess = React.useCallback((updatedParam: AnalysisParam) => {
    setAllData((prev) =>
      prev.map((item) => (item.id === updatedParam.id ? updatedParam : item)),
    );
  }, []);

  const handleActiveToggle = React.useCallback(
    async (row: AnalysisParam, checked: boolean) => {
      const previousValue = Boolean(row.isActive);

      setToggleError(null);
      setAllData((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? {
                ...item,
                isActive: checked,
              }
            : item,
        ),
      );
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.add(row.id);
        return next;
      });

      try {
        const result = await updateAnalysisParamIsActive(row.id, checked);

        if (!result.success || !result.data) {
          setAllData((prev) =>
            prev.map((item) =>
              item.id === row.id
                ? {
                    ...item,
                    isActive: previousValue,
                  }
                : item,
            ),
          );
          setToggleError(result.error || 'No fue posible actualizar el estado del parámetro.');
          return;
        }

        setAllData((prev) =>
          prev.map((item) => (item.id === row.id ? { ...item, ...result.data } : item)),
        );
      } catch (error) {
        setAllData((prev) =>
          prev.map((item) =>
            item.id === row.id
              ? {
                  ...item,
                  isActive: previousValue,
                }
              : item,
          ),
        );
        setToggleError(
          error instanceof Error
            ? error.message
            : 'No fue posible actualizar el estado del parámetro.',
        );
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(row.id);
          return next;
        });
      }
    },
    [],
  );

  const columns: DataGridColumn[] = [
    {
      field: 'discountName',
      headerName: 'Parámetro',
      flex: 1.5,
      sortable: true,
      type: 'string',
    },
    {
      field: 'rangeStart',
      headerName: 'Inicio Rango',
      flex: 1.2,
      sortable: true,
      type: 'number',
    },
    {
      field: 'rangeEnd',
      headerName: 'Fin Rango',
      flex: 1.2,
      sortable: true,
      type: 'number',
    },
    {
      field: 'discountPercent',
      headerName: 'Descuento %',
      flex: 1.2,
      sortable: true,
      type: 'number',
    },
    {
      field: 'isActive',
      headerName: 'Activo',
      flex: 1,
      sortable: true,
      type: 'boolean',
      renderCell: ({ row, value }) => {
        const item = row as AnalysisParam;
        const checked = typeof value === 'boolean' ? value : Boolean(item.isActive);
        const isUpdating = updatingIds.has(item.id);

        return (
          <Switch
            checked={checked}
            onChange={(nextChecked) => {
              void handleActiveToggle(item, nextChecked);
            }}
            disabled={isUpdating}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: '',
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => {
        const item = row as AnalysisParam;

        return (
          <div className="flex items-center">
            <IconButton
              icon="edit"
              variant="basicSecondary"
              onClick={() => {
                setSelectedParamForEdit(item);
                setEditDialogOpen(true);
              }}
              ariaLabel={`Editar rango de ${item.discountName}`}
              title="Editar rango"
              disabled={!isAdmin}
            />
          </div>
        );
      },
    },
  ];

  return (
    <>
      {toggleError && (
        <div className="mb-2">
          <Alert variant="error">{toggleError}</Alert>
        </div>
      )}
      <DataGrid
        columns={columns}
        rows={filteredData}
        title="Parámetros de Análisis"
        height="70vh"
        totalRows={filteredData.length}
        showBorder={false}
        showSortButton={true}
        showFilterButton={true}
        showExportButton={true}
        showSearch={true}
        pinActionsColumn={true}
        onAddClick={() => setCreateDialogOpen(true)}
        addDisabled={!isAdmin}
        headerActions={
          <AnalysisParamsFilter
            data={allData}
            onFilterChange={setSelectedParam}
          />
        }
      />

      <CreateAnalysisParamDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
        parameters={allData}
      />

      <UpdateAnalysisParamDialog
        open={editDialogOpen}
        analysisParam={selectedParamForEdit}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedParamForEdit(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
