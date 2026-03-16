'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DataGrid from '@/shared/components/ui/DataGrid';
import type { DataGridColumn } from '@/shared/components/ui/DataGrid';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import { Producer } from '@/features/producers/types/producers.types';
import CreateProducerDialog from '@/features/producers/components/CreateProducerDialog';
import DeleteProducerDialog from '@/features/producers/components/DeleteProducerDialog';
import ProducerDetailDialog from '@/features/producers/components/detail/ProducerDetailDialog';

interface ProducersDataGridProps {
  data: Producer[];
  total: number;
  page: number;
  limit: number;
}

function ProducerActions({ 
  row, 
  onDetail,
  onDelete 
}: { 
  row: Producer; 
  onDetail: (producer: Producer) => void;
  onDelete: (producer: Producer) => void;
}) {
  return (
    <div className="flex gap-2 justify-center">
      <IconButton
        icon="more_horiz"
        variant="basicSecondary"
        size="sm"
        onClick={() => onDetail(row)}
        ariaLabel="Ver detalles"
        title="Ver detalles"
      />
      <IconButton
        icon="delete"
        variant="basicSecondary"
        size="sm"
        onClick={() => onDelete(row)}
        ariaLabel="Eliminar"
        title="Eliminar"
      />
    </div>
  );
}

export default function ProducersDataGrid({ data, total, page, limit }: ProducersDataGridProps) {
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [producers, setProducers] = useState<Producer[]>(data);

  useEffect(() => {
    setProducers(data);
  }, [data]);

  const columns: DataGridColumn[] = [
    {
      field: 'rut',
      headerName: 'RUT',
      width: 130,
      sortable: true,
    },
    {
      field: 'name',
      headerName: 'Nombre',
      flex: 1,
      sortable: true,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      sortable: true,
    },
    {
      field: 'phone',
      headerName: 'Teléfono',
      width: 130,
      sortable: true,
    },
    {
      field: 'city',
      headerName: 'Ciudad',
      width: 120,
      sortable: true,
    },
    {
      field: 'isActive',
      headerName: 'Estado',
      width: 120,
      align: 'center' as const,
      renderCell: ({ value }: { value: boolean }) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 80,
      align: 'center' as const,
      sortable: false,
      filterable: false,
      actionComponent: ({ row }: { row: Producer }) => (
        <ProducerActions row={row} onDetail={handleDetailClick} onDelete={handleDeleteClick} />
      ),
    },
  ];

  const handleDeleteClick = (producer: Producer) => {
    setSelectedProducer(producer);
    setDeleteDialogOpen(true);
  };

  const handleDetailClick = (producer: Producer) => {
    setSelectedProducer(producer);
    setDetailDialogOpen(true);
  };

  const handleAddClick = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateSuccess = (newProducer: Producer) => {
    setProducers((prev) => [newProducer, ...prev]);
    router.refresh();
  };

  const handleDeleteSuccess = () => {
    if (selectedProducer) {
      setProducers((prev) => prev.filter((p) => p.id !== selectedProducer.id));
      router.refresh();
    }
  };

  const handleProducerUpdated = (updatedProducer: Producer) => {
    setSelectedProducer(updatedProducer);
    setProducers((prev) =>
      prev.map((producer) =>
        producer.id === updatedProducer.id ? updatedProducer : producer,
      ),
    );
  };

  return (
    <>
      <DataGrid
        columns={columns}
        rows={producers}
        totalRows={total}
        title="Productores"
        limit={limit}
        onAddClick={handleAddClick}
        height="75vh"
      />

      <CreateProducerDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <DeleteProducerDialog
        open={deleteDialogOpen}
        producer={selectedProducer}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedProducer(null);
        }}
        onSuccess={handleDeleteSuccess}
      />

      <ProducerDetailDialog
        open={detailDialogOpen}
        producer={selectedProducer}
        onProducerUpdate={handleProducerUpdated}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedProducer(null);
        }}
      />
    </>
  );
}
