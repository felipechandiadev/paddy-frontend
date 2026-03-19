'use client';

import React, { useState } from 'react';
import { usePermissions } from '@/providers/PermissionsProvider';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import { RiceType } from '../types/rice-types.types';
import RiceTypeCard from './RiceTypeCard';
import RiceTypesSearchBar from './RiceTypesSearchBar';
import CreateRiceTypeDialog from './CreateRiceTypeDialog';
import UpdateRiceTypeDialog from './UpdateRiceTypeDialog';
import DeleteRiceTypeDialog from './DeleteRiceTypeDialog';

interface RiceTypesPageProps {
  initialData: RiceType[];
  searchParams?: Record<string, string>;
}

export default function RiceTypesPage({
  initialData,
  searchParams = {},
}: RiceTypesPageProps) {
  const { isAdmin } = usePermissions();
  const [riceTypes, setRiceTypes] = useState(initialData);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRiceType, setSelectedRiceType] = useState<RiceType | null>(null);

  const searchQuery = (searchParams.search || '').toLowerCase();
  const filteredRiceTypes = riceTypes.filter((riceType) =>
    riceType.name.toLowerCase().includes(searchQuery)
  );

  const handleRefresh = () => {
    // Force parent to refetch data
    window.location.reload();
  };

  const handleEdit = (riceType: RiceType) => {
    setSelectedRiceType(riceType);
    setUpdateDialogOpen(true);
  };

  const handleDelete = (riceType: RiceType) => {
    setSelectedRiceType(riceType);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <IconButton
          icon="add"
          variant="ghost"
          onClick={() => setCreateDialogOpen(true)}
          title="Agregar nuevo tipo de arroz"
          disabled={!isAdmin}
        />
        <div className="ml-auto w-full max-w-md">
          <RiceTypesSearchBar />
        </div>
      </div>

      {/* Rice Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRiceTypes.length > 0 ? (
          filteredRiceTypes.map((riceType) => (
            <RiceTypeCard
              key={riceType.id}
              riceType={riceType}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            {searchQuery
              ? 'No se encontraron tipos de arroz'
              : 'No hay tipos de arroz disponibles'}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateRiceTypeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleRefresh}
      />

      <UpdateRiceTypeDialog
        open={updateDialogOpen}
        riceType={selectedRiceType}
        onClose={() => {
          setUpdateDialogOpen(false);
          setSelectedRiceType(null);
        }}
        onSuccess={handleRefresh}
      />

      <DeleteRiceTypeDialog
        open={deleteDialogOpen}
        riceType={selectedRiceType}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedRiceType(null);
        }}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
