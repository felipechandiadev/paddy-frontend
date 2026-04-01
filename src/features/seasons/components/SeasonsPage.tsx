'use client';

import { useState, useEffect } from 'react';
import { usePermissions } from '@/providers/PermissionsProvider';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import SeasonCard from './SeasonCard';
import SeasonSearchBar from './SeasonSearchBar';
import CreateSeasonDialog from './CreateSeasonDialog';
import UpdateSeasonDialog from './UpdateSeasonDialog';
import DeleteSeasonDialog from './DeleteSeasonDialog';
import { Season } from '../types/seasons.types';

interface SeasonsPageProps {
  initialSeasons: Season[];
}

export default function SeasonsPage({ initialSeasons }: SeasonsPageProps) {
  const { isAdmin } = usePermissions();
  const [seasons, setSeasons] = useState<Season[]>(initialSeasons);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);

  // Sincronizar temporadas cuando cambien los initialSeasons (búsqueda o crear/editar/eliminar)
  useEffect(() => {
    setSeasons(initialSeasons);
  }, [initialSeasons]);

  const handleEditClick = (season: Season) => {
    setSelectedSeason(season);
    setUpdateDialogOpen(true);
  };

  const handleDeleteClick = (season: Season) => {
    setSelectedSeason(season);
    setDeleteDialogOpen(true);
  };

  const handleSuccess = () => {
    // Recargar la página para obtener los datos actualizados desde el servidor
    window.location.reload();
  };

  return (
    <div className="w-full">
      {/* Header con búsqueda y botón crear */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <IconButton
          icon="add"
          variant="ghost"
          onClick={() => setCreateDialogOpen(true)}
          title="Crear nueva temporada"
          disabled={!isAdmin}
        />
        <SeasonSearchBar />
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {seasons.length > 0 ? (
          seasons.map((season) => (
            <SeasonCard
              key={season.id}
              season={season}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))
        ) : (
          <div className="col-span-full text-center text-neutral-500 py-12">
            <p className="text-lg">No se encontraron temporadas</p>
            <p className="text-sm">Intenta con otros términos de búsqueda</p>
          </div>
        )}
      </div>

      <CreateSeasonDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleSuccess}
      />

      <UpdateSeasonDialog
        open={updateDialogOpen}
        season={selectedSeason}
        onClose={() => {
          setUpdateDialogOpen(false);
          setSelectedSeason(null);
        }}
        onSuccess={handleSuccess}
      />

      <DeleteSeasonDialog
        open={deleteDialogOpen}
        season={selectedSeason}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedSeason(null);
        }}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
